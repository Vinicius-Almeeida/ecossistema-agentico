---
name: proj-feature
description: Implementar feature completa no {{NOME_DO_PROJETO}} (camadas conforme arquitetura)
version: 1.0.0
---

# Skill: Implementar Feature — {{NOME_DO_PROJETO}}

Processo completo para implementar funcionalidade nova end-to-end.

## Quando Usar

Use `/proj-feature` quando precisar de algo que envolve múltiplas camadas (ex.: dado novo + lógica + exposição + teste).

## Ordem de Implementação

```
1. SCHEMA DE DADOS     → {{path/models}}
2. MIGRATION           → {{ferramenta de migration}}
3. SCHEMA DE I/O       → {{path/schemas}}  (validação de entrada e saída)
4. SERVICE / LÓGICA    → {{path/services}}
5. EXPOSIÇÃO PÚBLICA   → {{path/endpoints ou ui}}
6. REGISTRO            → {{onde registrar}}
7. TESTE               → {{path/tests}}
```

## Checklist por Camada

### Schema de Dados
```
[ ] Identificadores e timestamps padrão
[ ] {{REGRA_TENANT_OU_ESCOPO}}
[ ] Índices em campos de busca frequente
[ ] Relacionamentos tipados
```

### Migration
```
[ ] Gerada e revisada
[ ] upgrade() e downgrade() corretos
[ ] Roda local sem erro
```

### Schema de I/O
```
[ ] Validação no input (Pydantic / Zod / equivalente)
[ ] Create, Update, Response separados
[ ] Listagem com paginação `{ items, total, page, pages, limit }`
```

### Service
```
[ ] {{REGRA_TENANT_OU_ESCOPO}} em toda query
[ ] Erros propagados com tipo correto
[ ] Sem side effects escondidos
```

### Endpoint / UI
```
[ ] Prefix / rota correta
[ ] Auth e autorização aplicados
[ ] response_model definido
[ ] Status code correto
```

### Teste
```
[ ] Happy path
[ ] Caso de erro de validação
[ ] Caso de não-autorizado / cross-tenant
```

## Commit Pattern
```
feat({{escopo}}): {{descrição}}

Problema: [necessidade]
Solução: [o que foi feito]
```
