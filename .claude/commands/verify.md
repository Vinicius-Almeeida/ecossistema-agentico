# /verify

Executa verificação completa de qualidade no código.

## Relação com o quality gate

As checagens automáticas (typecheck, testes, prisma validate) já rodam no hook `Stop` e
bloqueiam o encerramento se falharem. O `/verify` é o relatório completo sob demanda:
inclui o que exige leitura de código e não cabe num comando.

## Execução

Ao receber este comando:

0. Rodar o gate completo, sem filtro por arquivo alterado:
   `node .claude/scripts/quality-gate.js --manual`

1. Executar verificações em sequência (adaptar à stack do projeto):
   - {{CHECK_DOMINIO_1}} (ex.: tenant_id, escopo, isolamento)
   - Type hints / typing em funções públicas
   - Imports não usados
   - Uso de `print()` / `console.log`
   - Schemas de input validados
   - Testes (`pytest -v` / `npm test` / equivalente)
   - Fluxos de UI críticos exercitados no navegador (Playwright MCP), se houver frontend

2. Gerar relatório consolidado. Todo número do relatório vem de comando rodado agora
   (`/proj-verify-before-done`), nunca de estimativa.

## Opções

```
/verify              # Verifica tudo
/verify [arquivo]    # Verifica arquivo específico
/verify security     # Apenas segurança
/verify tests        # Apenas testes
```

## Output Esperado

```
═══════════════════════════════════════════════════════════
  {{NOME_DO_PROJETO}} — VERIFICATION REPORT
═══════════════════════════════════════════════════════════

[CHECK 1]
   Status: OK/FALHA

[TYPE HINTS]
   Funções sem tipagem: X

[INPUT VALIDATION]
   Endpoints sem schema: X

[LOGGING]
   print()/console.log encontrados: X

[TESTES]
   Passaram: X / Falharam: Y

───────────────────────────────────────────────────────────
SCORE FINAL: X/100
───────────────────────────────────────────────────────────
```
