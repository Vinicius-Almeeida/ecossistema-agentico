# Instincts — {{NOME_DO_PROJETO}}

> Ideia adaptada de continuous-learning-v2 (affaan-m/ECC, MIT), sem o observer em background —
> a observação contínua já é feita pelo claude-mem.

Um **instinct** é um comportamento aprendido, atômico: um gatilho, uma ação, uma confiança.
Os de confiança **≥ 0.7** são injetados no início de toda sessão pelo `load-context.js`.

## Formato (um arquivo por instinct)

`.claude/instincts/<dominio>-<slug>.md`

```markdown
---
id: prisma-tenant-filter
trigger: "ao escrever query Prisma em modelo com tenantId"
action: "usar o helper scopedPrisma(tenantId), nunca prisma.<model> direto"
confidence: 0.8
domain: database
created: 2026-09-21
updated: 2026-09-21
---

## Evidência
- 2026-09-21: bug de vazamento entre tenants em /reservas (corrigido em abc1234)
- 2026-09-28: usuário corrigiu query sem filtro no módulo de hóspedes
```

## Confiança

| Valor | Significado | Quando |
|---|---|---|
| 0.3–0.5 | tentativo | visto 1 vez |
| 0.6–0.7 | provável | repetido, ou correção explícita do usuário |
| 0.8–0.9 | quase certo | confirmado várias vezes / causou bug real |

- Confirmado de novo → +0.1 (máx. 0.9) e nova linha em Evidência.
- Contradito → −0.2; abaixo de 0.3, apagar.
- Instinct que vira regra permanente → promover para `RULES.md` e apagar o arquivo.

Criados e atualizados pelo `/learn`.
