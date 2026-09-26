# Regras — {{NOME_DO_PROJETO}}

## Proibido
- {{PROIBIDO_1}}
- {{PROIBIDO_2}}
- Secrets hardcoded (usar `.env` / config tipada)
- `print()` / `console.log` em código de produção (usar logger)
- Catch vazio sem log
- Magic numbers sem constante nomeada
- Commits sem `tipo(escopo):` no início
- Commits com `Co-Authored-By`

## Obrigatório
- Type hints / typing em TODAS as funções públicas
- Validar inputs com schema (Pydantic / Zod / equivalente)
- {{OBRIGATORIO_1}}
- {{OBRIGATORIO_2}}
- Logger com contexto (request_id, user_id, tenant_id quando aplicável)
- Paginação em listagens: `{ items, total, page, pages, limit }`
- Migration / versionamento ao alterar schema persistente

## Nomenclatura
- Arquivos: {{snake_case | kebab-case | conforme stack}}
- Classes: `PascalCase`
- Funções: {{conforme stack}}
- Constantes: `UPPER_SNAKE_CASE`
- Endpoints HTTP: `kebab-case`

## Git
```
tipo(escopo): título curto

Problema: descrição
Solução: como resolveu

feat | fix | refactor | docs | test | chore | perf
```
- SEM `Co-Authored-By`.
- Commits em português.

## Testes
- Services / business logic: sempre.
- Rotas / endpoints públicos: sempre.
- Formato do nome: `should [ação] when [condição]`.

## Rate Limits (definir conforme projeto)
- {{ENDPOINT_SENSIVEL}}: {{LIMITE}}
- Geral: {{LIMITE}}

## Branding
- Nome do produto: **{{NOME_DO_PRODUTO}}**.
- {{TERMOS_PROIBIDOS_OU_OBRIGATORIOS_NA_LINGUAGEM}}.
