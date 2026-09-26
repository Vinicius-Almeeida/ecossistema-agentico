---
name: proj-plan
description: Planejar implementação complexa antes de executar
version: 1.0.0
---

# Skill: Planejar — {{NOME_DO_PROJETO}}

Processo de planejamento antes de implementação complexa.

## Quando Usar

Use `/proj-plan` ANTES de implementar quando:
- Pedido é vago ou ambíguo
- Afeta 3+ arquivos
- Envolve schema + service + endpoint
- Múltiplas formas de resolver
- Impacto em integração externa

> **Projeto com GSD ativo** (existe `.planning/`)? Trabalho de roadmap/fase vai por
> `/gsd-discuss-phase` → `/gsd-plan-phase`. Esta skill cobre pedidos avulsos e épicos do Commander.

## Processo

### Fase 0: CONSULTAR O QUE JÁ SE SABE
1. Procurar em `.claude/solutions/` por área/tag do pedido — problema parecido já resolvido?
2. Os instincts relevantes já vieram no início da sessão; aplicá-los ao plano.
3. Para APIs de libs (Next, Prisma, FastAPI…), consultar a documentação atual via Context7
   em vez de confiar na memória.

### Fase 1: ENTENDER
1. O que precisa ser feito? (requisito funcional)
2. Quem vai consumir? (frontend, integração, webhook)
3. Quais dados envolvidos?
4. Quais restrições? (performance, segurança, compatibilidade)

### Fase 2: MAPEAR IMPACTO
1. Quais módulos são afetados?
2. Precisa de migration?
3. Quais serviços precisam mudar?
4. Quais endpoints / contratos públicos mudam?
5. Afeta integrações externas?

### Fase 3: DEFINIR PLANO

```markdown
# Plano: [Nome]

## Objetivo
[O que vai ser implementado e por quê]

## Restrições Globais
[Valores exatos, formatos e regras que TODA tarefa deve respeitar — o revisor usa isto]

## Tarefas
### Tarefa 1: [nome]
- Arquivos: [caminhos]
- Especialista: [elite-*]
- Depende de: [nenhuma | Tarefa N]
- Pronto quando: [critério verificável por comando/teste]

### Tarefa 2: ...

## Riscos
- [Risco] → [Mitigação]

## Critérios de Aceite
- [ ] ...
```

Gravar em `.claude/plans/AAAA-MM-DD-<slug>.md`. Tarefas pequenas, com arquivos explícitos e
dependências declaradas — é isso que permite ao `/proj-execute-plan` paralelizar com segurança.

### Fase 4: VALIDAR COM USUÁRIO
Apresentar plano e aguardar aprovação antes de executar. Aprovado → `/proj-execute-plan`.

## Regra de Ouro
**Planejar por 10 minutos economiza 2 horas de refatoração.**
