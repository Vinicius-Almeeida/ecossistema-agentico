#!/usr/bin/env node
/**
 * Hook pós-commit: valida formato `tipo(escopo): descrição` e veta Co-Authored-By.
 */

const { execFileSync } = require('child_process');

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();

const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.resume();
process.stdin.on('data', () => {});
process.stdin.on('end', () => clearTimeout(stdinTimeout));

try {
  const lastCommit = execFileSync('git', ['log', '-1', '--pretty=%B'], { cwd: ROOT, encoding: 'utf-8' }).trim();
  const commitPattern = /^(feat|fix|refactor|docs|style|test|chore|perf)\([a-z0-9-]+\):\s.+/;

  if (!commitPattern.test(lastCommit)) {
    console.log('[COMMIT] Formato fora do padrão:');
    console.log('  Esperado: tipo(escopo): descrição');
    console.log('  Tipos: feat, fix, refactor, docs, style, test, chore, perf');
    console.log(`  Recebido: "${lastCommit.split('\n')[0]}"`);
  } else {
    console.log('[COMMIT] OK — formato correto');
  }

  if (/co-authored-by/i.test(lastCommit)) {
    console.log('[COMMIT] PROIBIDO: contém Co-Authored-By (remover!)');
  }
} catch (e) {}

process.exit(0);
