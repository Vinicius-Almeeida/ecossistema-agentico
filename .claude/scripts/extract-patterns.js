#!/usr/bin/env node
/**
 * Hook pós-push: agrega métricas de atividade por área em .claude/patterns/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const patternsDir = path.join(ROOT, '.claude/patterns');
if (!fs.existsSync(patternsDir)) fs.mkdirSync(patternsDir, { recursive: true });

// Áreas de interesse — ajustar por projeto
const AREAS = {
  models: '/models/',
  services: '/services/',
  routers: '/api/',
  schemas: '/schemas/',
  tests: 'test',
  migrations: '/migrations/',
};

try {
  const diff = execSync('git diff HEAD~3..HEAD --stat 2>/dev/null || echo ""', {
    cwd: ROOT, encoding: 'utf-8', timeout: 10000
  });
  const files = diff.split('\n').filter(l => l.includes('|')).map(l => l.split('|')[0].trim());

  for (const [type, marker] of Object.entries(AREAS)) {
    const count = files.filter(f => f.includes(marker)).length;
    if (count < 2) continue;

    const patternFile = path.join(patternsDir, `${type}-activity.json`);
    let data = { count: 0, lastSeen: null, sessions: [] };
    if (fs.existsSync(patternFile)) data = JSON.parse(fs.readFileSync(patternFile, 'utf-8'));

    data.count += count;
    data.lastSeen = new Date().toISOString();
    data.sessions.push({ date: data.lastSeen, files: count });
    data.sessions = data.sessions.slice(-10);

    fs.writeFileSync(patternFile, JSON.stringify(data, null, 2));
    console.log(`[PATTERNS] ${type}: +${count} (total: ${data.count})`);
  }
} catch (e) {
  console.log('[PATTERNS] Não foi possível extrair padrões');
}

process.exit(0);
