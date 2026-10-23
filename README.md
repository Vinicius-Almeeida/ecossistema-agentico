# Template: Projeto com Ecossistema Agêntico

Esqueleto reutilizável da arquitetura "Commander + Elite Agents + Skills + Auto-Routing" do Vinicius. **Agnóstico de stack** — preencher `{{PLACEHOLDERS}}` no clone.

> **v2 (21/09/2026):** qualidade deixou de ser só pedido em prompt. Quality gate e guardas
> agora são hooks que bloqueiam de verdade; revisão, execução de plano e aprendizado
> ganharam skills próprias. Backup da v1: `Dev/_template-projeto-agentico.backup-2026-09-21`.
>
> **v2.1 (11/10/2026):** agente `scout` (Haiku, somente leitura) faz o reconhecimento antes dos
> Elite, e a escolha de modelo virou regra em 4 níveis: haiku (scout) → sonnet → padrão → opus.
> Projetos já na v2 recebem o scout via `/proj-upgrade`.

## Estrutura

```
.claude/
├── CLAUDE.md                   identidade, regras, stack, ambiente
├── RULES.md                    proibido / obrigatório / nomenclatura
├── AUTO-ROUTING.md             matriz palavra-chave → skill / agente + §0 convivência com ferramentas
├── quality-gate.json           checagens do gate (vazio = auto-detecção)
├── settings.json               hooks ativos + attribution vazia (versionado — vale em qualquer clone)
├── settings.local.json         permissões pessoais (não versionar)
├── agents/
│   ├── COMMANDER-PROTOCOL.md   v5: fan-out seguro, 3 camadas de verificação
│   ├── supreme-technical-commander.md
│   ├── elite-*.md              principal, database, security, devops, performance, research (Opus)
│   └── scout.md                reconhecimento somente leitura (Haiku) antes dos Elite
├── skills/
│   ├── _template-skill/        ← copiar pra criar nova skill do domínio
│   ├── proj-plan/              planejar (grava em plans/)
│   ├── proj-execute-plan/      especialista por tarefa + revisão + ledger
│   ├── proj-feature/           feature completa em camadas
│   ├── proj-fix/               bug com reprodução e regressão
│   ├── proj-review/            revisão independente (+ reviewer-prompt.md)
│   └── proj-verify-before-done/ evidência antes de "pronto"
├── commands/
│   ├── verify.md       /verify          relatório de qualidade
│   ├── learn.md        /learn           curadoria: instincts e soluções
│   └── session-review.md /session-review revisa sessão
├── scripts/
│   ├── load-context.js     SessionStart: última sessão + instincts ≥ 0.7
│   ├── save-session.js     SessionEnd: resumo em sessions/
│   ├── guard.js            PreToolUse: bloqueia .env e comandos destrutivos
│   ├── quality-gate.js     Stop: só encerra com typecheck/testes/prisma verdes
│   ├── validate-commit.js  pós git commit: formato tipo(escopo)
│   └── extract-patterns.js pós git push: atividade por área
├── instincts/  comportamentos aprendidos (gatilho → ação, com confiança)
├── solutions/  problemas não-óbvios já resolvidos
├── plans/      planos + ledgers de execução
├── sessions/   histórico .md (gerado em runtime)
└── epics/      iniciativas grandes (uma .md por épico)
```

## Como usar

1. Copiar a pasta inteira:
   ```powershell
   Copy-Item -Recurse "Dev\_template-projeto-agentico" "Dev\projeto-{{nome}}"
   ```
2. `git init` no projeto (o quality gate e o save-session dependem de git).
3. Abrir o novo projeto no Claude Code.
4. Pedir: **"Commander, adapte este template pro projeto {{descrição da stack e objetivo}}"**.
   - O Commander substitui os `{{PLACEHOLDERS}}` em CLAUDE.md, RULES.md, AUTO-ROUTING.md e nas skills.
   - Preencher `quality-gate.json` se a auto-detecção não servir (monorepo, venv Python etc.).
5. Criar skills específicas do domínio copiando `.claude/skills/_template-skill/`.

## Hooks (o que roda sozinho)

| Evento | Script | Efeito |
|---|---|---|
| SessionStart | `load-context.js` | injeta última sessão, instincts e regras |
| PreToolUse | `guard.js` | **nega** ler `.env` / `rm -rf /` / force push em main; **pergunta** antes de migrate reset, `down -v`, `reset --hard` |
| PostToolUse (`git commit`) | `validate-commit.js` | avisa formato fora do padrão |
| PostToolUse (`git push`) | `extract-patterns.js` | atividade por área |
| Stop | `quality-gate.js` | **bloqueia** o fim do turno se typecheck/testes/prisma falharem nas áreas alteradas |
| SessionEnd | `save-session.js` | resumo em `sessions/` |

Quality gate:
- compara com o HEAD do início da sessão: pega o que os especialistas já commitaram e o que ainda não foi commitado;
- roda só se houve mudança de código desde a última passagem verde;
- se o estado continua vermelho num turno novo, só avisa (não roda a suíte de novo);
- funciona com o projeto numa subpasta de monorepo; usa `.venv` / uv / poetry se existirem;
- ferramenta ausente (ex.: pytest não instalado) é pulada com aviso, não bloqueia;
- roda só as checagens das áreas alteradas;
- libera com aviso depois de 3 tentativas;
- desliga com `QUALITY_GATE=off` ou `"enabled": false`.

## Ferramentas globais recomendadas

O template funciona sem elas, mas foi desenhado para somar com:
**GSD** (fases/roadmap), **claude-mem** (memória bruta), **Context7** (docs atuais),
**Playwright MCP** (verificar UI), plugins **pr-review-toolkit** (revisores do `/proj-review`) e
**security-guidance** (revisão de segurança em segundo plano).
Quem é dono de quê: `AUTO-ROUTING.md` §0.

> **Usando GSD no projeto?** O `/gsd-new-project` grava no `CLAUDE.md` da raiz um bloco
> `GSD:workflow` com roteamento próprio. Troque esse bloco por um ponteiro para
> `AUTO-ROUTING.md` §0, senão as duas regras se contradizem.

## Filosofia (do Vinicius)

- O **Commander** é gerente. Nunca escreve código. Analisa, delega para Elite, cobra qualidade.
- **Elite Agents** são especialistas com credenciais ("15+ anos", "ex-Staff Google"). Eles executam.
- **Skills** (`/proj-*`) são processos repetíveis do domínio. Triggers automáticos via AUTO-ROUTING.
- **Auto-routing** detecta palavra-chave/contexto e invoca skill/agente sem o usuário pedir.
- **Hooks** impõem o que prompt sozinho não garante: guardas, quality gate, contexto entre sessões.
- **Aprendizado composto**: cada problema não-óbvio vira instinct ou solução e volta no próximo plano.

## Créditos

Ideias adaptadas (MIT): obra/superpowers, EveryInc/compound-engineering-plugin, affaan-m/ECC,
disler/claude-code-hooks-mastery. Pesquisa completa: `Downloads/Pesquisa-Template-Agentico-2026-09-21.docx`.
