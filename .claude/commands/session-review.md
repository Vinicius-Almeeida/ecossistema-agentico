# /session-review

Revisa a sessão de desenvolvimento atual e extrai insights.

## Execução

1. Analisar:
   - Arquivos modificados (`git diff --name-only`)
   - Commits realizados (`git log --oneline -10`)
   - Padrões identificados
   - Decisões tomadas
2. Gerar relatório com sugestões.

## Output

```
═══════════════════════════════════════════════════════════
  {{NOME_DO_PROJETO}} — REVISÃO DE SESSÃO
═══════════════════════════════════════════════════════════

ARQUIVOS MODIFICADOS:
   - ...

COMMITS:
   - ...

PADRÕES IDENTIFICADOS:
   - ...

SUGESTÕES:
   - ...
═══════════════════════════════════════════════════════════
```
