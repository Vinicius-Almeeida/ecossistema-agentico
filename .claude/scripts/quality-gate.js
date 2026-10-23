#!/usr/bin/env node
/**
 * Hook Stop: quality gate. O turno só encerra com as checagens verdes.
 *
 * - Compara contra o HEAD do início da sessão (gravado pelo load-context.js): pega mudança
 *   commitada pelos especialistas E mudança ainda não commitada.
 * - Roda só as checagens relevantes para o que mudou (.ts → tsc/test, .py → pytest, schema.prisma → prisma).
 * - Checagens vêm de .claude/quality-gate.json; lista vazia = auto-detecção.
 * - Cache: mesmo estado já verde → libera sem rodar. Mesmo estado já vermelho em turno novo → avisa sem rodar.
 * - Anti-loop: após `maxRetries` bloqueios seguidos no mesmo turno, libera com aviso.
 * - Orçamento total de tempo (`budgetSec`, padrão 780s) abaixo do timeout do hook (900s).
 * - Desligar: QUALITY_GATE=off ou "enabled": false no config.
 * - Uso manual: node .claude/scripts/quality-gate.js --manual
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync, execFileSync } = require('child_process');

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const CONFIG_FILE = path.join(ROOT, '.claude', 'quality-gate.json');
const CACHE_DIR = path.join(ROOT, '.claude', '.cache');
const STATE_FILE = path.join(CACHE_DIR, 'quality-gate-state.json');
const BASE_FILE = path.join(CACHE_DIR, 'session-base');
const MANUAL = process.argv.includes('--manual');
const MAX_OUTPUT_LINES = 40;
const START = Date.now();

const CODE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|vue|py|php|prisma|sql)$|(^|\/)(package\.json|tsconfig[\w.-]*\.json|pyproject\.toml|composer\.json|phpstan\.neon(\.dist)?)$/i;

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch { return fallback; }
}

function writeState(state) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Sem shell: no Windows o cmd.exe trataria `^` e aspas como escape.
function git(...args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 15000, maxBuffer: 64 * 1024 * 1024 }).trim();
}

function sessionBase() {
  try {
    const base = fs.readFileSync(BASE_FILE, 'utf-8').trim();
    git('cat-file', '-e', `${base}^{commit}`);
    return base;
  } catch { return 'HEAD'; }
}

// Caminhos relativos a ROOT e restritos a ele (funciona com o projeto numa subpasta de monorepo).
function changedFiles(base) {
  const tracked = git('diff', '--name-only', '--relative', base).split('\n');
  const untracked = git('ls-files', '--others', '--exclude-standard').split('\n');
  return [...new Set([...tracked, ...untracked].filter(Boolean))];
}

// Não hasheia o conteúdo do diff (pode passar de MB): usa numstat + status + HEAD e,
// para capturar edição de arquivos não commitados, caminho:mtime:size de cada arquivo.
const HASH_IGNORE = /(^|\/)(node_modules|\.next|\.git|coverage)(\/|$)/;

function stateHash(base, files) {
  const h = crypto.createHash('sha1');
  h.update(git('rev-parse', 'HEAD'));
  h.update(git('diff', '--relative', '--numstat', base));
  h.update(git('status', '--porcelain'));
  for (const f of files) {
    if (HASH_IGNORE.test(f)) continue;
    try {
      const st = fs.statSync(path.join(ROOT, f));
      h.update(`${f}:${st.mtimeMs}:${st.size}\n`);
    } catch { /* removido */ }
  }
  return h.digest('hex');
}

function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }

function pythonCmd() {
  if (exists('.venv/Scripts/python.exe')) return '".venv/Scripts/python.exe"';
  if (exists('.venv/bin/python')) return '.venv/bin/python';
  if (exists('uv.lock')) return 'uv run python';
  if (exists('poetry.lock')) return 'poetry run python';
  return 'python';
}

function autoDetect() {
  const checks = [];
  const pkg = readJson(path.join(ROOT, 'package.json'), null);
  const scripts = (pkg && pkg.scripts) || {};
  const realTest = s => s && !/no test specified/.test(s);

  if (scripts.typecheck) {
    checks.push({ name: 'typecheck', cmd: 'npm run typecheck --silent', when: '\\.(ts|tsx)$|tsconfig[\\w.-]*\\.json$' });
  } else if (exists('tsconfig.json') && exists('node_modules/typescript')) {
    checks.push({ name: 'tsc', cmd: 'npx --no-install tsc --noEmit', when: '\\.(ts|tsx)$|tsconfig[\\w.-]*\\.json$' });
  }
  if (realTest(scripts.test)) {
    checks.push({ name: 'test (node)', cmd: 'npm test --silent', when: '\\.(ts|tsx|js|jsx|mjs|cjs)$|package\\.json$' });
  }
  if (exists('prisma/schema.prisma') && exists('node_modules/prisma')) {
    checks.push({ name: 'prisma validate', cmd: 'npx --no-install prisma validate', when: 'schema\\.prisma$' });
  }
  const composer = readJson(path.join(ROOT, 'composer.json'), null);
  if (composer) {
    const php = '\\.php$|composer\\.json$';
    if (exists('vendor/bin/phpstan')) {
      checks.push({ name: 'phpstan', cmd: 'php vendor/bin/phpstan analyse --no-progress --error-format=raw', when: `${php}|phpstan\\.neon` });
    }
    if (composer.scripts && composer.scripts.test) {
      checks.push({ name: 'test (composer)', cmd: 'composer test', when: php });
    } else if (exists('artisan')) {
      checks.push({ name: 'test (artisan)', cmd: 'php artisan test', when: php });
    } else if (exists('vendor/bin/pest')) {
      checks.push({ name: 'pest', cmd: 'php vendor/bin/pest', when: php });
    } else if (exists('vendor/bin/phpunit')) {
      checks.push({ name: 'phpunit', cmd: 'php vendor/bin/phpunit', when: php });
    }
  }
  if (exists('pyproject.toml') || exists('pytest.ini') || exists('setup.cfg')) {
    // exit 5 = nenhum teste coletado: não é falha
    checks.push({ name: 'pytest', cmd: `${pythonCmd()} -m pytest -q -x`, when: '\\.py$|pyproject\\.toml$', okCodes: [0, 5] });
  }
  return checks;
}

// Ferramenta ausente no ambiente não é falha do código: confere antes de rodar
// (independe do idioma da mensagem de erro do sistema).
function commandAvailable(cmd) {
  const first = (cmd.match(/^\s*(?:"([^"]+)"|(\S+))/) || [])[1] || (cmd.match(/^\s*(\S+)/) || [])[1];
  if (!first) return true;
  if (/[\\/]/.test(first)) return exists(first);
  const finder = process.platform === 'win32' ? 'where' : 'which';
  return spawnSync(finder, [first], { stdio: 'ignore' }).status === 0;
}

function runCheck(check, remainingSec) {
  if (!commandAvailable(check.cmd)) return { ok: true, missing: true, tail: '' };
  const timeoutSec = Math.max(10, Math.min(check.timeoutSec || 300, remainingSec));
  const r = spawnSync(check.cmd, {
    cwd: ROOT, shell: true, encoding: 'utf-8',
    timeout: timeoutSec * 1000,
    env: { ...process.env, CI: 'true', FORCE_COLOR: '0' },
  });
  const tail = `${r.stdout || ''}\n${r.stderr || ''}`.trim().split('\n').slice(-MAX_OUTPUT_LINES).join('\n');
  if (r.error && r.error.code === 'ETIMEDOUT') return { ok: false, tail: `Timeout após ${timeoutSec}s` };
  // Ferramenta ausente no ambiente não é falha do código: pula com aviso.
  if (/No module named pytest|is not recognized as an internal|reconhecido como um comando|command not found/i.test(tail)) {
    return { ok: true, missing: true, tail };
  }
  return { ok: (check.okCodes || [0]).includes(r.status), tail };
}

function allow(message) {
  if (message) process.stdout.write(JSON.stringify({ systemMessage: message }));
  process.exit(0);
}

function main(input) {
  const config = readJson(CONFIG_FILE, {});
  if (process.env.QUALITY_GATE === 'off' || config.enabled === false) allow();

  try { git('rev-parse', '--is-inside-work-tree'); } catch { allow(); }

  const base = sessionBase();
  let files;
  try { files = changedFiles(base); } catch { allow(); }
  const codeFiles = files.filter(f => CODE_EXT.test(f) && !f.startsWith('.claude/'));
  const state = readJson(STATE_FILE, {});
  if (codeFiles.length === 0 && !MANUAL) {
    if (state.lastRedHash) writeState({ consecutiveBlocks: 0 }); // voltou ao estado da base: esquece o vermelho
    allow();
  }

  const hash = stateHash(base, codeFiles);
  if (!MANUAL && state.lastGreenHash === hash) allow();

  // Turno novo sobre o mesmo estado vermelho (ex.: fase vermelha do TDD, pergunta do usuário no meio):
  // não roda a suíte de novo nem bloqueia de novo, só lembra.
  if (!MANUAL && !input.stop_hook_active && state.lastRedHash === hash) {
    allow(`[QUALITY GATE] Estado ainda vermelho (${(state.lastRedChecks || []).join(', ')}), sem mudança desde a última checagem.`);
  }

  const maxRetries = config.maxRetries || 3;
  if (!MANUAL && input.stop_hook_active && (state.consecutiveBlocks || 0) >= maxRetries) {
    writeState({ ...state, consecutiveBlocks: 0, lastRedHash: hash });
    allow(`[QUALITY GATE] ${maxRetries} tentativas sem ficar verde. Liberado. Reporte ao usuário o que ainda falha.`);
  }

  const configured = Array.isArray(config.checks) && config.checks.length > 0 ? config.checks : autoDetect();
  const relevant = MANUAL ? configured : configured.filter(c => !c.when || codeFiles.some(f => new RegExp(c.when, 'i').test(f)));
  if (relevant.length === 0) {
    if (MANUAL) console.log('Quality gate: nenhuma checagem detectada (sem package.json, composer.json ou pyproject). Configure em .claude/quality-gate.json se precisar.');
    allow();
  }

  const budgetSec = config.budgetSec || 780;
  const failures = [];
  const skipped = [];
  for (const check of relevant) {
    const remaining = budgetSec - (Date.now() - START) / 1000;
    if (remaining < 10) { skipped.push(check.name); continue; }
    const res = runCheck(check, remaining);
    if (res.missing) {
      skipped.push(`${check.name} (ferramenta ausente: ajuste quality-gate.json)`);
      if (MANUAL) console.log(`[PULADO] ${check.name}: ferramenta ausente`);
      continue;
    }
    if (MANUAL) console.log(`[${res.ok ? 'OK' : 'FALHA'}] ${check.name}`);
    if (!res.ok) failures.push({ name: check.name, cmd: check.cmd, tail: res.tail });
  }

  if (failures.length === 0) {
    const note = skipped.length ? `[QUALITY GATE] Não verificado: ${skipped.join(', ')}. Rode /verify.` : null;
    writeState({ lastGreenHash: skipped.length ? null : hash, consecutiveBlocks: 0 });
    if (MANUAL) {
      console.log(skipped.length
        ? `\nQuality gate: nada falhou, mas NÃO verificado: ${skipped.join(', ')}.`
        : '\nQuality gate: tudo verde.');
      process.exit(0);
    }
    allow(note);
  }

  writeState({
    ...state,
    lastGreenHash: null,
    lastRedHash: hash,
    lastRedChecks: failures.map(f => f.name),
    consecutiveBlocks: (state.consecutiveBlocks || 0) + 1,
  });

  const reason = [
    '[QUALITY GATE] Não encerre ainda. Checagens falharam com as mudanças desta sessão:',
    ...failures.map(f => `\n### ${f.name} (\`${f.cmd}\`)\n${f.tail}`),
    '\nSe você é o Commander: delegue a correção ao especialista responsável (não corrija no próprio contexto).',
    'Caso contrário: corrija a causa raiz e rode de novo. Não desative testes nem o gate para passar.',
  ].join('\n');

  if (MANUAL) { console.log(reason); process.exit(1); }
  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
  process.exit(0);
}

if (MANUAL) {
  main({});
} else {
  let raw = '';
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    let input = {};
    try { input = JSON.parse(raw); } catch { /* sem input */ }
    main(input);
  };
  const timer = setTimeout(start, 3000);
  process.stdin.on('data', d => { raw += d; });
  process.stdin.on('end', () => { clearTimeout(timer); start(); });
}
