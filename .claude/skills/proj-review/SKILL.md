---
name: proj-review
description: Use para a etapa COBRA do Commander — após cada tarefa de um plano, ao concluir feature, antes de merge. Despacha revisor(es) em contexto limpo com o diff exato e o requisito, nunca com o histórico da sessão.
version: 1.0.0
---

# Skill: Revisão Independente — {{NOME_DO_PROJETO}}

> Adaptado de `requesting-code-review` (obra/superpowers, MIT) + revisores do `pr-review-toolkit` (Anthropic).

**Princípio:** revisar cedo e sempre, em contexto limpo. Quem executou (e o Commander no mesmo
contexto) tende a certificar que ficou pronto mesmo quando não ficou.

## Quando

**Obrigatório:** após cada tarefa em `/proj-execute-plan`; ao concluir feature; antes de merge.
**Dispensa:** mudança trivial (1 arquivo, óbvia).

## Como

### 1. Fixar o intervalo do diff
```bash
BASE=$(git rev-parse HEAD)   # gravar ANTES de despachar o executor
# ...executor trabalha e commita...
HEAD_SHA=$(git rev-parse HEAD)
```
Nunca usar `HEAD~1` como base: perde commits de tarefas com mais de um commit.

### 2. Escolher o(s) revisor(es) pelo risco

| Mudança | Revisor |
|---|---|
| Qualquer entrega não-trivial | revisor geral com [reviewer-prompt.md](reviewer-prompt.md) |
| Tratamento de erro, fallback, try/catch | `pr-review-toolkit:silent-failure-hunter` |
| Testes novos ou alterados | `pr-review-toolkit:pr-test-analyzer` |
| Tipos/schemas novos (Zod, Pydantic, Prisma) | `pr-review-toolkit:type-design-analyzer` |
| Auth, tenant, dados sensíveis | `elite-security-architect` em modo revisão |

Revisores independentes entre si → despachar **na mesma mensagem** (paralelo).
Se o plugin `pr-review-toolkit` não estiver instalado, usar só o revisor geral.

### 3. Agir sobre o retorno

- **Crítico** → corrigir já (volta ao executor, não o Commander)
- **Importante** → corrigir antes de seguir para a próxima tarefa
- **Menor** → registrar e seguir
- Revisor errado → contestar com evidência técnica (código/teste), nunca ignorar em silêncio

Depois do fix: **re-review com escopo** só no diff da correção (base = HEAD que o revisor anterior viu).
Máximo de 3 rodadas; persistindo, o Commander decide e registra a decisão (`Decisão: … — por quê — custo se errado`).

## Regras

- O revisor recebe: requisito/tarefa, intervalo `BASE..HEAD`, restrições do RULES.md. Nada do histórico da sessão.
- O revisor é somente-leitura e não despacha outros revisores.
- Não pré-julgar: nunca escrever "não aponte X" no prompt do revisor.
- Commander não corrige no próprio contexto: devolve ao especialista.

## Complementos fora da sessão

- `claude-code-action` no GitHub revisa cada PR em contexto realmente separado.
- O plugin `security-guidance`, se instalado, revisa diffs e commits em segundo plano.
