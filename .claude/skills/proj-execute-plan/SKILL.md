---
name: proj-execute-plan
description: Use quando o Commander tem um plano aprovado (de /proj-plan ou de um épico) com tarefas definidas e vai executá-lo — um especialista novo por tarefa, revisão independente após cada uma, ledger que sobrevive à compactação.
version: 1.0.0
---

# Skill: Executar Plano com Especialistas — {{NOME_DO_PROJETO}}

> Adaptado de `subagent-driven-development` e `dispatching-parallel-agents` (obra/superpowers, MIT).

**Princípio:** um especialista novo por tarefa + revisão independente por tarefa + revisão final
ampla = qualidade alta sem poluir o contexto do Commander.

> **Projeto com GSD ativo** (existe `.planning/`)? Fases do roadmap são executadas por
> `/gsd-execute-phase`; o Commander só revisa a saída com `/proj-review` (ver AUTO-ROUTING §0).
> Esta skill é para planos do Commander (`.claude/plans/`) e épicos fora do roadmap.

## Setup

1. O plano vive em arquivo: `.claude/plans/AAAA-MM-DD-<slug>.md` (o `/proj-plan` grava lá).
2. Ledger ao lado: `.claude/plans/<slug>.ledger.md`, primeira linha `# Ledger — plano: <caminho>`,
   segunda linha `PLAN_BASE: <git rev-parse HEAD>` (base da revisão final).
3. Se o ledger já existe: tarefas com `Tarefa N: concluída` estão **feitas** — não redespachar.
   Depois de compactação, confiar no ledger e no `git log`, não na memória da conversa.
4. Ler o plano uma vez. Antes da Tarefa 1, procurar conflitos entre tarefas (mesmo arquivo,
   mesma interface) e registrar no ledger como `Decisão: … — por quê — custo se errado`.

## Paralelo ou sequencial

| Situação | Como despachar |
|---|---|
| Tarefas com arquivos **disjuntos** e sem dependência | mesma mensagem, vários Agent (paralelo) |
| Disjuntas mas em área sensível (migrations, config compartilhada) | paralelo com `isolation: "worktree"` no Agent |
| B depende da saída de A, ou mesmo arquivo | sequencial |
| Várias edições pequenas e iguais em N arquivos | **um** despacho com a lista inteira |

## Loop por tarefa

### 1. Despachar o especialista
- Gravar `BASE=$(git rev-parse HEAD)` antes.
- Escolher o Elite pelo `AUTO-ROUTING.md`. O prompt contém só:
  1. uma linha de onde a tarefa se encaixa;
  2. o texto da tarefa (ou caminho do arquivo) com valores exatos;
  3. interfaces/decisões de tarefas anteriores que ela precisa;
  4. restrições do RULES.md;
  5. contrato de retorno: `status (PRONTO | PRONTO_COM_RESSALVAS | PRECISA_CONTEXTO | BLOQUEADO)`, commits, resumo de testes em 1 linha, ressalvas.
- **Não** colar histórico de tarefas anteriores. **Não** pedir que o especialista despache revisor.
- Modelo: levantar contexto/ler/resumir → agente `scout` (`haiku`), antes do especialista; tarefa mecânica com spec completa → `model: "sonnet"`; integração/julgamento → padrão; arquitetura → `opus`.

### 2. Tratar o retorno
- **PRONTO** → revisão (passo 3)
- **PRONTO_COM_RESSALVAS** → ler ressalvas; se forem de correção/escopo, resolver antes da revisão
- **PRECISA_CONTEXTO** → dar o contexto e redespachar
- **BLOQUEADO** → mudar algo: mais contexto, modelo mais capaz, quebrar a tarefa, ou corrigir o plano (registrar decisão). Nunca repetir igual.

### 3. Revisar
`/proj-review` com `BASE..HEAD` e o texto da tarefa. Precisa de dois vereditos:
aderência ao requisito **e** qualidade.

### 4. Loop de correção (máx. 3 rodadas)
- Críticos/Importantes voltam ao **mesmo** especialista com os achados literais.
- Re-review só do diff da correção.
- Menores → ledger como `Tarefa N: menor (adiado): …`.
- Na 3ª rodada sem convergir: Commander decide cada achado e registra `Decisão:` no ledger.
- O Commander **nunca** corrige no próprio contexto.

### 5. Concluir a tarefa
Ledger: `Tarefa N: concluída (commits abc1234..def5678, revisão limpa)`.
Só avança sem Críticos/Importantes abertos (ou decididos e registrados).

## Final
1. Revisão ampla do intervalo `PLAN_BASE..HEAD` (o `BASE` gravado antes da Tarefa 1 — anotar
   no ledger), com o modelo mais capaz, apontando os menores adiados do ledger.
2. Achados → **um** despacho de correção com a lista inteira + um re-review.
3. `/proj-verify-before-done` antes de reportar.
4. No relatório ao usuário, listar todas as linhas `Decisão:` do ledger — são decisões tomadas em nome dele.
5. `/learn` para capturar o que foi não-óbvio.

## Racionalizações proibidas

| Desculpa | Realidade |
|---|---|
| "Eu mesmo corrijo, é rápido" | Polui o contexto e pula revisão. Volta ao especialista. |
| "A correção foi pequena, sem re-review" | É assim que regressão entra. |
| "O especialista disse que passou" | Conferir o diff e rodar a verificação. |
| "Ledger é burocracia" | É o que sobrevive à compactação. Sem ele, tarefas prontas são refeitas. |
