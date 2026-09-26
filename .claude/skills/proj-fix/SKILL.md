---
name: proj-fix
description: Investigar e corrigir bug no {{NOME_DO_PROJETO}} com processo reprodutível
version: 1.0.0
---

# Skill: Corrigir Bug — {{NOME_DO_PROJETO}}

Processo para diagnosticar e corrigir um bug sem deixar dívida.

## Quando Usar

Use `/proj-fix` quando o pedido contém "bug", "erro", "não funciona", "quebrou", stack trace, ou comportamento inesperado.

## Processo

### 0. JÁ ACONTECEU ANTES?
Procurar o sintoma em `.claude/solutions/` (e no claude-mem, se disponível) antes de investigar do zero.

### 1. REPRODUZIR
- Anotar passos exatos para reproduzir
- Identificar inputs mínimos que disparam
- Confirmar em ambiente local antes de tocar em prod

### 2. ISOLAR
- Reduzir escopo até o menor caso que falha
- Ler stack trace de baixo pra cima
- Identificar arquivo:linha exato

### 3. ENTENDER A CAUSA RAIZ
- Não corrigir o sintoma. Achar a causa.
- Perguntar: "por que isso aconteceu agora e não antes?"
- Verificar commits recentes na área (git blame / log)

### 4. CORRIGIR
- Mudança mínima que resolve a causa raiz
- Sem refactor oportunista misturado
- Sem `except: pass` para sumir com o erro

### 5. TESTE DE REGRESSÃO
- Escrever teste que reproduz o bug
- Confirmar que o teste falha sem a correção
- Confirmar que o teste passa com a correção

### 6. POSTMORTEM CURTO
Se a causa raiz era não-óbvia (teste contrafactual em `.claude/solutions/README.md`), registrar
via `/learn`: vira documento em `.claude/solutions/` e, se for comportamento repetível, instinct.
Antes de dizer "corrigido": `/proj-verify-before-done`.

## Commit Pattern
```
fix({{escopo}}): {{descrição curta}}

Problema: [sintoma + reprodução]
Causa raiz: [o que estava errado]
Solução: [o que foi mudado]
```

## Anti-padrões proibidos
- "Aumentar timeout" sem entender por que está lento
- Try/except amplo escondendo o erro
- Mudança em produção sem reproduzir local
- Fix sem teste de regressão
