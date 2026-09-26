# Soluções Documentadas — {{NOME_DO_PROJETO}}

> Ideia adaptada do passo "compound" (EveryInc/compound-engineering-plugin, MIT).

Cada problema resolvido de forma **não-óbvia** vira um documento aqui, para que o próximo
plano ou correção não redescubra a mesma coisa. O `/proj-plan` e o `/proj-fix` consultam esta
pasta antes de começar.

## Critério de entrada (o teste contrafactual)

Só documentar se: **"se este documento sumisse, um engenheiro lendo só o código final
provavelmente repetiria o erro ou refaria uma investigação grande?"**

- Sim → documentar.
- Não (o código, os testes ou os comentários já explicam) → não documentar.
- Esforço grande ou diff grande **não** qualificam por si só.

Uma solução por documento. Se já existe um documento sobre o tema e ele ficou desatualizado,
atualizar em vez de criar outro.

## Formato

`.claude/solutions/<area>/<slug>.md`

```markdown
---
titulo: Webhook do WhatsApp duplicando mensagens
area: integracoes
tags: [n8n, whatsapp, idempotencia]
data: 2026-09-21
commits: abc1234..def5678
---

## Sintoma
O que se via e como reproduzir.

## Causa raiz
O que realmente estava errado (e por que não era óbvio).

## Solução
O que foi feito e onde (arquivo:linha).

## Como evitar
Regra prática para a próxima vez. Se virou instinct, citar o id.
```
