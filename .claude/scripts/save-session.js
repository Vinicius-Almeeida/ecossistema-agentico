#!/usr/bin/env node
/**
 * Hook SessionEnd: gera resumo da sessão em .claude/sessions/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.resume();
process.stdin.on('data', () => {});
process.stdin.on('end', () => clearTimeout(stdinTimeout));

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const sessionsDir = path.join(ROOT, '.claude/sessions');
const PROJECT_NAME = process.env.PROJECT_NAME || '{{NOME_DO_PROJETO}}';

if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });

const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
const sessionFile = path.join(sessionsDir, `session-${timestamp}.md`);

let summary = `# Sessão ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}\n\n`;

summary += '## Arquivos Modificados\n';
try {
  const modified = execSync('git diff --name-only HEAD~1', {
    cwd: ROOT, encoding: 'utf-8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe']
  }).trim();
  summary += modified ? modified.split('\n').map(f => `- ${f}`).join('\n') : '- Nenhum';
} catch (e) { summary += '- Não foi possível listar'; }

summary += '\n\n## Commits\n';
try {
  const today = now.toISOString().slice(0, 10);
  const commits = execSync(`git log --oneline --since="${today}"`, {
    cwd: ROOT, encoding: 'utf-8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe']
  }).trim();
  summary += commits ? commits.split('\n').map(c => `- ${c}`).join('\n') : '- Nenhum';
} catch (e) { summary += '- Não foi possível listar'; }

summary += `\n\n## Contexto\n- **Projeto:** ${PROJECT_NAME}\n`;

fs.writeFileSync(sessionFile, summary);
console.log(`[SESSION] Resumo salvo: ${path.basename(sessionFile)}`);

try {
  const sessions = fs.readdirSync(sessionsDir).filter(f => f.startsWith('session-')).sort().reverse();
  if (sessions.length > 20) sessions.slice(20).forEach(f => fs.unlinkSync(path.join(sessionsDir, f)));
} catch (e) {}

process.exit(0);
