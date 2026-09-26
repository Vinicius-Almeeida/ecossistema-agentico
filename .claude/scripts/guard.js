#!/usr/bin/env node
/**
 * Hook PreToolUse: guardas contra vazamento de segredo e comando destrutivo.
 *
 * - deny: ler/editar .env real, `rm -rf` em raiz/home, force push em main/master.
 * - ask:  comandos destrutivos às vezes legítimos (migrate reset, down -v, reset --hard): o usuário decide.
 * Arquivos de exemplo (.env.example, .env.sample, .env.template) são liberados.
 */

const path = require('path');

const ENV_FILE = /^\.env(\.[\w-]+)?$/i;
const ENV_ALLOWED = /\.(example|sample|template|dist)$/i;

// .env real como argumento. Destino de redirecionamento (`> .env`) é removido antes da checagem.
const ENV_ARG = /(^|[\s/\\'"=])\.env(\.(?!example\b|sample\b|template\b|dist\b)[\w-]+)?(?=$|[\s'"])/i;
const READERS = /\b(cat|less|more|head|tail|type|bat|Get-Content|gc|grep|rg|sed|awk|strings|xxd|od|source)\b/i;

const BASH_DENY = [
  { re: /\brm\s+-[a-z]*r[a-z]*f?[a-z]*\s+(\/|~|\$HOME|\/\*|[A-Za-z]:[\\/]?)(\s|$)/i, why: 'rm -rf na raiz ou na home' },
  { re: /\bgit\s+push\b(?=.*(\s--force(-with-lease)?\b|\s-f\b))(?=.*[\s:+](main|master)(\s|$))/i, why: 'force push em main/master' },
];

const BASH_ASK = [
  { re: /\bprisma\s+migrate\s+reset\b/i, why: 'prisma migrate reset apaga o banco' },
  { re: /\bprisma\s+db\s+push\b.*--force-reset/i, why: 'prisma db push --force-reset apaga o banco' },
  { re: /\b(drop\s+(database|schema)|truncate\s+table)\b/i, why: 'DROP/TRUNCATE' },
  { re: /\bdocker(-|\s+)compose\b.*\bdown\b.*(-v\b|--volumes\b)/i, why: 'docker compose down -v apaga volumes' },
  { re: /\bdocker\s+(system\s+prune|volume\s+(rm|prune))\b/i, why: 'remoção de volumes/imagens Docker' },
  { re: /\bgit\s+(reset\s+--hard|clean\s+-[a-z]*f)/i, why: 'descarta mudanças locais sem volta' },
];

// Comandos que só mencionam texto (busca, mensagem de commit, echo) não executam o que citam.
const TEXT_ONLY = /^\s*(git\s+commit|grep|rg|echo|printf|git\s+log|git\s+grep)\b/i;

function decide(decision, reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: `[GUARD] ${reason}` },
  }));
  process.exit(0);
}

function isRealEnv(p) {
  const base = path.basename(String(p));
  return ENV_FILE.test(base) && !ENV_ALLOWED.test(base);
}

function checkBash(cmd) {
  for (const r of BASH_DENY) if (r.re.test(cmd)) decide('deny', `Bloqueado: ${r.why}.`);

  // Leitura de .env: remove destinos de redirecionamento (`> .env`) antes de procurar
  const withoutRedirects = cmd.replace(/\d?>>?\s*\S+/g, ' ');
  for (const segment of withoutRedirects.split(/\|\||&&|[|;]/)) {
    if (READERS.test(segment) && ENV_ARG.test(segment)) {
      decide('deny', 'Bloqueado: leitura de .env (segredos). Use .env.example para documentar variáveis.');
    }
  }

  if (TEXT_ONLY.test(cmd)) return;
  for (const r of BASH_ASK) if (r.re.test(cmd)) decide('ask', `Confirme: ${r.why}.`);
}

function check(input) {
  const tool = input.tool_name || '';
  const ti = input.tool_input || {};

  if (/^(Read|Edit|Write|MultiEdit)$/.test(tool) && ti.file_path && isRealEnv(ti.file_path)) {
    decide('deny', `${path.basename(ti.file_path)} contém segredos. Use .env.example para documentar variáveis.`);
  }
  if (tool === 'Grep' && ti.path && isRealEnv(ti.path)) {
    decide('deny', `${path.basename(ti.path)} contém segredos.`);
  }
  if (tool === 'Bash' && ti.command) checkBash(ti.command);

  process.exit(0);
}

let raw = '';
let done = false;
const run = () => { if (done) return; done = true; try { check(JSON.parse(raw)); } catch { process.exit(0); } };
setTimeout(run, 3000);
process.stdin.on('data', d => { raw += d; });
process.stdin.on('end', run);
