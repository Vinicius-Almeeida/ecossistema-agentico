# Planos — {{NOME_DO_PROJETO}}

Planos gerados pelo `/proj-plan` e executados pelo `/proj-execute-plan`.

- `AAAA-MM-DD-<slug>.md` — o plano (objetivo, restrições globais, tarefas com arquivos e dependências)
- `<slug>.ledger.md` — progresso: tarefas concluídas, rodadas de correção, `Decisão:` tomadas

O ledger é o que sobrevive à compactação de contexto. Depois de retomar, confiar nele e no
`git log`, não na memória da conversa.

Plano concluído e revisado: pode ser movido para `plans/arquivo/` ou apagado — o histórico fica no git.
