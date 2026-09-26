---
name: proj-upgrade
description: Use para levar um projeto que já usa o ecossistema agêntico (Commander + Elite + AUTO-ROUTING) para a versão atual do template, mesclando sem sobrescrever as personalizações do projeto. Roda dentro do projeto alvo, num branch próprio.
version: 1.0.0
---

# Skill: Atualizar Projeto para o Template v2

Fonte da verdade: `C:\Users\vinic\Documents\Dev\_template-projeto-agentico` (chamado de TEMPLATE abaixo).
Validado no piloto `projeto-gerenciador-de-sites-smart-hoteis` (commit `81f095f`, 22/09/2026).

**Princípio:** mesclar, nunca sobrescrever. Cada projeto divergiu do template (prefixo de skill
próprio, scripts próprios, regras próprias). O que o projeto tem de melhor fica; o template só
acrescenta o que falta.

## 0. Pré-condições (parar e reportar se falhar)

| Checagem | Se falhar |
|---|---|
| É repositório git | Aplicar só skills, guard e aprendizado. **Sem quality gate** (depende de git). Reportar |
| `git status --porcelain` sem mudanças em `.claude/` | Parar. Mudança pendente em `.claude/` se misturaria com a atualização |
| Mudanças pendentes fora de `.claude/` | Seguir, mas **nunca** incluí-las no stage; reportar quantas são |
| Branch atual | Criar `chore/template-v2` a partir dele (`git switch -c chore/template-v2`) |

## 1. Inventário (ler antes de escrever qualquer coisa)

1. Listar `.claude/` inteiro: agentes, skills (e o **prefixo** delas: `proj-`, `smart-`, `hr-`…),
   commands, scripts, settings.
2. Ler `settings.json` e `settings.local.json`: onde estão os hooks hoje, formato (oficial ou
   inválido, ex.: `matcher` como objeto), caminhos relativos ou `$CLAUDE_PROJECT_DIR`.
3. Ler cada script existente e anotar o que ele faz a mais que o do template.
4. Ler `RULES.md` (ou equivalente) procurando **regras de escrita** (ex.: proibição de travessão)
   e a **convenção de commit**. Elas valem para tudo que for escrito na atualização.
5. Detectar stack (package.json, composer.json, pyproject, monorepo) e se há GSD (`.planning/`).
6. Detectar se o `settings.local.json` está rastreado no git (se estiver, o `.gitignore` não
   basta: reportar ao usuário, que decide sobre `git rm --cached`).
7. Conferir `.git/info/exclude`: se contém `.claude/`, os arquivos novos ficam invisíveis ao git
   (escolha de manter a configuração privada). Reportar, não alterar.

## 2. Matriz de mesclagem

| Artefato | Ação |
|---|---|
| `scripts/package.json` (`{"type":"commonjs"}`) | Copiar sempre. Sem ele, projeto com `"type":"module"` quebra todos os scripts com `require is not defined` |
| `scripts/guard.js`, `scripts/quality-gate.js` | Copiar **idênticos** do TEMPLATE (mantém atualização futura simples). Se o projeto proíbe algum caractere que eles contêm, corrigir no TEMPLATE e copiar de novo |
| `quality-gate.json` | Copiar do TEMPLATE; preencher `checks` só se a auto-detecção não cobrir a stack (monorepo, venv fora do padrão) |
| `scripts/load-context.js` do projeto | **Mesclar**: manter tudo que ele imprime hoje; acrescentar `recordSessionBase`, instincts ≥ 0.7, contagem de soluções, regra "sem evidência não está pronto"; ler stdin como JSON (`source`) |
| `scripts/save-session.js`, `extract-patterns.js`, `validate-commit.js` | Manter o do projeto; só trocar `process.cwd()` por `process.env.CLAUDE_PROJECT_DIR \|\| process.cwd()` e passar `cwd` aos comandos git |
| Scripts exclusivos do projeto (ex.: `design-gate.js`) | Manter e registrar no `settings.json` |
| Hooks | Mover para **`.claude/settings.json`** (versionado), formato oficial, caminho `node "$CLAUDE_PROJECT_DIR/.claude/scripts/x.js"`, `if` para `git commit`/`git push`, Stop para o quality gate. Remover os hooks do `settings.local.json` (evita execução dupla) |
| `permissions.deny` e `env` do projeto | Levar para `settings.json` (valem para o time) |
| `permissions.allow` | Ficam no `settings.local.json` (pessoal) |
| `attribution` | `{ "commit": "", "pr": "" }` no `settings.json` se o projeto proíbe Co-Authored-By |
| `.gitignore` | Acrescentar `.claude/.cache/` e `.claude/settings.local.json` |
| Skills novas | Copiar `proj-execute-plan` e `proj-verify-before-done` **com o prefixo do projeto**, trocando referências (`/proj-plan` → `/<prefixo>-plan` etc.) e o nome do projeto |
| Revisão | Se o projeto já tem revisor dedicado (ex.: `elite-code-reviewer`), **não** criar `proj-review`: acrescentar ao protocolo o intervalo `BASE..HEAD`, os revisores do pr-review-toolkit em paralelo e o limite de 3 rodadas. Se não tem, copiar `proj-review` com o prefixo |
| `instincts/`, `solutions/`, `plans/` | Criar com os READMEs do TEMPLATE, nome do projeto trocado |
| `commands/learn.md` | Reescrever com a curadoria do TEMPLATE, mantendo o banner e as referências do projeto |
| `commands/verify.md` | Acrescentar o passo 0 (`quality-gate.js --manual`) e os revisores especializados; não remover checagens do projeto |
| Skill de plano do projeto | Acrescentar consulta a `solutions/` + instincts no início, e gravação do plano em `.claude/plans/` |
| Skill de bug do projeto | Acrescentar passo 0 (já aconteceu antes?) e postmortem via `/learn` |
| `COMMANDER-PROTOCOL.md` | Acrescentar: guardas do fan-out, prompt de delegação, BASE..HEAD, 3 camadas de verificação, relato das `Decisão:` |
| `AUTO-ROUTING.md` | Acrescentar a tabela de convivência (TEMPLATE §0, adaptada: sem GSD, remover linhas de GSD; com GSD, manter e avisar do bloco `GSD:workflow`), linhas das skills novas, passo [6] do fluxo |
| Agente Commander | `tools:` ganha `Write` e `Skill`; exceção explícita "só edita `.claude/plans/`" (também no CLAUDE.md) |
| `CLAUDE.md` do projeto | §Lições: apontar para instincts/solutions. Checklist pré-commit: linha do quality gate. Não reescrever o resto |
| `hooks/hooks.json` (referência) | Atualizar para refletir o `settings.json` |

Laravel/PHP: o gate já detecta `composer.json` (PHPStan, `php artisan test`, Pest, PHPUnit).
Registrar no AUTO-ROUTING que o Laravel Boost convive (guidelines, skills, `.mcp.json`, sem hooks)
e que as regras do projeto prevalecem sobre as guidelines dele.

## 3. Regras de escrita do projeto

Tudo que for escrito segue as regras do próprio projeto. Se houver proibição de caractere
(ex.: travessão U+2014 e meia-risca U+2013), varrer ao final:

```bash
git diff -U0 | grep -P '^\+(?!\+\+).*[\x{2014}\x{2013}]'           # linhas acrescentadas
git ls-files --others --exclude-standard | xargs grep -HnP '[\x{2014}\x{2013}]'   # arquivos novos
```

Reescrever a frase (dois pontos, vírgula, ponto final, parênteses), não só trocar o caractere.

## 4. Testes (evidência obrigatória no relatório)

1. `node --check` em todos os `.claude/scripts/*.js`.
2. Todos os JSON de `.claude/` parseiam.
3. `echo '{"source":"startup"}' | CLAUDE_PROJECT_DIR=<raiz> node .claude/scripts/load-context.js`
   imprime o contexto e grava `.claude/.cache/session-base`.
4. Guard: `cat .env` → deny; `cp .env.example .env` → allow; `npx prisma migrate reset` → ask;
   `git push --force origin main` → deny.
5. `node .claude/scripts/quality-gate.js --manual` roda sem erro e lista as checagens detectadas.
   Linha `[PULADO]` significa ferramenta ausente (ex.: `node_modules` não instalado): o gate não
   verificou nada ali. Instalar dependências (`npm ci`, `composer install`) antes de concluir.
   Monorepo sem script de teste na raiz: preencher `checks` no `quality-gate.json` por pasta.
   **Se o projeto já tem testes vermelhos**, reportar: o gate vai bloquear a primeira sessão.
6. Nenhuma referência quebrada: toda skill citada em CLAUDE.md, AUTO-ROUTING e protocolo existe.

## 5. Entrega

- **Não commitar** sem aprovação do usuário. Deixar tudo no branch `chore/template-v2`.
- Aprovado: commit na convenção do **projeto** (validar com o `validate-commit.js` dele).
  Cuidado: validador que procura "Co-Authored-By" no texto acusa até menção no corpo.
- Relatório: pré-condições, o que foi mesclado e o que foi mantido do projeto, evidência de cada
  teste, pendências (testes vermelhos, GSD, falta de git) e `git diff --stat`.
