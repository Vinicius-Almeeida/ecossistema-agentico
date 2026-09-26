# /learn

Extrai o aprendizado da sessão e o guarda de forma que **volte** no próximo plano.

> Divisão de papéis: o **claude-mem** registra automaticamente o que aconteceu (memória bruta).
> O `/learn` faz a curadoria: decide o que vira regra do projeto. Não duplicar um no outro.

## Execução

1. **Levantar o material** da sessão:
   - `git diff --stat` e `git log --oneline` do período
   - erros encontrados e como foram resolvidos
   - correções que o usuário fez no trabalho do agente
   - decisões registradas em ledgers (`.claude/plans/*.ledger.md`, linhas `Decisão:`)

2. **Classificar cada achado** em no máximo um destino:

| Tipo de achado | Destino |
|---|---|
| Comportamento atômico repetível ("ao fazer X, faça Y") | **instinct** em `.claude/instincts/` (ver README lá) |
| Problema resolvido de forma não-óbvia (passa no teste contrafactual) | **solução** em `.claude/solutions/<area>/` |
| Regra que já tem confiança 0.9 e vale sempre | promover para `RULES.md` e apagar o instinct |
| Algo que o código, os testes ou os comentários já explicam | **nada** — não documentar |

3. **Antes de criar, procurar** instinct ou solução existente sobre o mesmo tema:
   - existe e confirma → subir a confiança (+0.1) e adicionar evidência
   - existe e contradiz → baixar a confiança (−0.2) ou corrigir o documento
   - não existe → criar

4. **Uma solução por documento.** Várias lições = vários documentos.

## Output

```
═══════════════════════════════════════════════════════════
  {{NOME_DO_PROJETO}} — CONTINUOUS LEARNING
═══════════════════════════════════════════════════════════

INSTINCTS:
  + [0.5] novo: <trigger> → <action>
  ↑ [0.7→0.8] confirmado: <id>
  ↓ [0.6→0.4] contradito: <id>

SOLUÇÕES:
  + .claude/solutions/<area>/<slug>.md

PROMOVIDOS PARA RULES.md: N
DESCARTADOS (já explicados pelo código): N
═══════════════════════════════════════════════════════════
```
