---
name: proj-verify-before-done
description: Use antes de afirmar que algo está pronto, corrigido ou passando — antes de commit, PR, marcar tarefa concluída ou aceitar a entrega de um especialista. Exige rodar o comando de verificação e ler a saída antes de qualquer afirmação de sucesso.
version: 1.0.0
---

# Skill: Evidência Antes de "Pronto" — {{NOME_DO_PROJETO}}

> Adaptado de `verification-before-completion` (obra/superpowers, MIT).

**Princípio:** evidência antes de afirmação. Sempre.

```
NENHUMA AFIRMAÇÃO DE CONCLUSÃO SEM EVIDÊNCIA FRESCA DE VERIFICAÇÃO
```

Se o comando de verificação não rodou nesta mensagem, não dá para afirmar que passa.

## Relação com o quality gate

O hook `Stop` (`.claude/scripts/quality-gate.js`) roda typecheck/testes/prisma automaticamente e
impede o encerramento se algo falhar. Esta skill cobre o que o gate **não** cobre:
requisitos atendidos, comportamento real, entrega de especialista conferida no diff.
O gate é o piso; esta skill é o padrão.

## A Função-Portão

```
ANTES de afirmar qualquer status:

1. IDENTIFICAR: que comando prova essa afirmação?
2. RODAR: o comando COMPLETO, agora (não reaproveitar execução antiga)
3. LER: saída inteira, exit code, número de falhas
4. CONFERIR: a saída confirma a afirmação?
   - NÃO → reportar o status real, com a evidência
   - SIM → afirmar, citando a evidência
5. SÓ ENTÃO afirmar

Pular etapa = mentir, não verificar
```

## O que prova o quê

| Afirmação | Exige | Não basta |
|---|---|---|
| Testes passam | Saída do comando: 0 falhas | Execução anterior, "deve passar" |
| Build ok | Build com exit 0 | Linter passando |
| Bug corrigido | Sintoma original testado e passando | Código alterado, "presumo que resolveu" |
| Teste de regressão válido | Ciclo vermelho→verde verificado | Teste passou uma vez |
| Especialista concluiu | `git diff` mostra as mudanças e elas batem com a tarefa | Relatório do agente dizendo "sucesso" |
| Requisitos atendidos | Checklist linha a linha contra o plano | Testes passando |
| UI funciona | Fluxo exercitado no navegador (Playwright MCP) | "O componente renderiza" |

## Sinais de alerta — PARE

- "deve", "provavelmente", "parece que"
- Comemorar antes de verificar ("Pronto!", "Perfeito!")
- Commit/push/PR sem verificação
- Confiar no relatório de um subagente
- Verificação parcial
- "Só dessa vez"

## Padrões

**Regressão (vermelho→verde):**
```
✅ Escreve teste → roda (passa) → reverte o fix → roda (TEM que falhar) → restaura → roda (passa)
❌ "Escrevi um teste de regressão" (sem o ciclo)
```

**Delegação (Commander):**
```
✅ Especialista reporta → conferir git diff → rodar verificação → reportar estado real
❌ Repassar ao usuário o que o especialista disse
```

**Requisitos:**
```
✅ Reler plano → checklist → verificar cada item → reportar lacunas ou conclusão
❌ "Testes passam, fase concluída"
```
