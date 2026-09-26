#!/usr/bin/env node
/**
 * Hook SessionStart: carrega contexto da última sessão, instincts aprendidos e regras críticas.
 * O que este script imprime entra no contexto da sessão.
 * Também grava a base do quality gate (HEAD do início da sessão) em .claude/.cache/session-base.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const sessionsDir = path.join(ROOT, '.claude/sessions');
const instinctsDir = path.join(ROOT, '.claude/instincts');
const solutionsDir = path.join(ROOT, '.claude/solutions');
const baseFile = path.join(ROOT, '.claude/.cache/session-base');
const PROJECT_NAME = process.env.PROJECT_NAME || '{{NOME_DO_PROJETO}}';
const MIN_CONFIDENCE = 0.7;
const MAX_INSTINCTS = 15;

function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*"?(.*?)"?\s*$/);
    if (kv) data[kv[1]] = kv[2];
  }
  return data;
}

function listMd(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listMd(full));
    else if (entry.name.endsWith('.md') && entry.name !== 'README.md') out.push(full);
  }
  return out;
}

// Mantida em resume/compact para cobrir o trabalho commitado ao longo da sessão inteira.
function recordSessionBase(source) {
  if (fs.existsSync(baseFile) && (source === 'resume' || source === 'compact')) return;
  try {
    const head = execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 5000 }).trim();
    fs.mkdirSync(path.dirname(baseFile), { recursive: true });
    fs.writeFileSync(baseFile, head);
  } catch { /* sem git ou sem commits */ }
}

function printLastSession() {
  if (!fs.existsSync(sessionsDir)) return;
  const sessions = fs.readdirSync(sessionsDir).filter(f => f.startsWith('session-')).sort().reverse();
  if (sessions.length === 0) return;
  console.log('\nÚLTIMA SESSÃO:');
  const content = fs.readFileSync(path.join(sessionsDir, sessions[0]), 'utf-8');
  content.split('\n').slice(0, 15).forEach(l => console.log('  ' + l));
}

function printInstincts() {
  const instincts = listMd(instinctsDir)
    .map(f => frontmatter(fs.readFileSync(f, 'utf-8')))
    .filter(i => i.trigger && i.action && parseFloat(i.confidence) >= MIN_CONFIDENCE)
    .sort((a, b) => parseFloat(b.confidence) - parseFloat(a.confidence))
    .slice(0, MAX_INSTINCTS);
  if (instincts.length === 0) return;
  console.log('\nINSTINCTS DO PROJETO (aprendidos, confiança ≥ 0.7):');
  instincts.forEach(i => console.log(`  - [${i.confidence}] ${i.trigger} → ${i.action}`));
}

function main(input) {
  recordSessionBase(input.source);

  console.log('='.repeat(60));
  console.log(`  ${PROJECT_NAME} — CONTEXTO DA SESSÃO`);
  console.log('='.repeat(60));

  printLastSession();
  printInstincts();

  const solutions = listMd(solutionsDir);
  if (solutions.length > 0) {
    console.log(`\nSOLUÇÕES DOCUMENTADAS: ${solutions.length} em .claude/solutions/ — consultar antes de planejar ou corrigir bug.`);
  }

  console.log('\nREGRAS CRÍTICAS:');
  console.log('  - Ver .claude/RULES.md');
  console.log('  - Commits sem Co-Authored-By');
  console.log('  - Nada de print()/console.log em código de produção');
  console.log('  - Toda entrada externa validada por schema');
  console.log('  - Sem evidência não está pronto (/proj-verify-before-done); o quality gate roda no Stop');

  console.log('\n' + '='.repeat(60) + '\n');
  process.exit(0);
}

let raw = '';
let started = false;
const start = () => {
  if (started) return;
  started = true;
  let input = {};
  try { input = JSON.parse(raw); } catch { /* sem input */ }
  main(input);
};
setTimeout(start, 3000);
process.stdin.on('data', d => { raw += d; });
process.stdin.on('end', start);
