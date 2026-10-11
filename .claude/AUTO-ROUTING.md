# AUTO-ROUTING INTELIGENTE — {{NOME_DO_PROJETO}}

Regras de roteamento automático. Commander e Claude DEVEM seguir para invocar skills e agentes sem que o usuário precise pedir.

---

## Princípio Central

**NÃO espere o usuário pedir.** Detecte contexto e use a ferramenta certa automaticamente.

---

## 0. Convivência com ferramentas globais (evita conflito)

Regra: **um dono por responsabilidade.** Se existe dono, os outros não disputam.

| Responsabilidade | Dono | Os demais |
|---|---|---|
| Roadmap / fases do projeto (existe `.planning/`) | **GSD**: `/gsd-plan-phase` e `/gsd-execute-phase` (executor do GSD) | Commander **não** re-executa a fase: consulta Elite no discuss/plan quando há decisão de especialista e roda `/proj-review` na saída da fase |
| Pedido avulso, bug, épico fora do roadmap | **Commander** (`/proj-plan` → `/proj-execute-plan`, `/proj-fix`) | GSD não é acionado |
| Memória bruta entre sessões | **claude-mem** (automático) | `/learn` só faz curadoria; `save-session.js` só grava resumo git versionável |
| Regras aprendidas do projeto | **`.claude/instincts/` + `solutions/`** | claude-mem não substitui |
| Bloquear "pronto" com teste vermelho | **quality gate** (hook Stop do template) | não criar regra de Stop no hookify para o mesmo fim (bloqueio duplo) |
| Revisão de segurança em segundo plano | **security-guidance** (plugin, se instalado) | `elite-security-architect` para decisões de design |
| Revisão de código | **`/proj-review`** (usa agentes do pr-review-toolkit) | não chamar também `/code-review` e `/gsd-code-review` na mesma entrega |
| Documentação atual de libs | **Context7** (MCP) | não confiar em memória para API de lib |
| Verificação de UI | **Playwright MCP** | — |
| Guardas (.env, comandos destrutivos) | **`guard.js`** (hook do template) | hookify só para regras novas específicas do projeto |

**Bloco do GSD no CLAUDE.md da raiz:** o `/gsd-new-project` escreve em `./CLAUDE.md` um bloco
`GSD:workflow` ("bugs → /gsd:debug, fixes → /gsd:quick…") que contradiz esta tabela. Depois de
rodá-lo, substituir esse bloco por: *"Roteamento de ferramentas: ver `.claude/AUTO-ROUTING.md` §0."*

**Não instalar** no projeto frameworks de fluxo concorrentes (Superpowers completo, BMAD,
spec-kit, OpenSpec, oh-my-claudecode): suas skills disparam sozinhas e disputam o controle
com GSD e Commander. Ideias úteis deles já estão adaptadas nas skills `proj-*`.

---

## Matriz de Detecção Automática

### 1. Detecção por PALAVRAS-CHAVE

| Detectou no pedido | Ação Automática |
|--------------------|-----------------|
| "feature", "funcionalidade", "implementar" | `/proj-feature` |
| "bug", "erro", "não funciona", "quebrou" | `/proj-fix` |
| "sistema de", "implementar novo", "criar módulo" | `/proj-plan` PRIMEIRO |
| "endpoint", "rota", "API" | `/proj-feature` (ou `/proj-api`, se o projeto criar essa skill) |
| "deploy", "produção", "container" | `elite-devops-architect` (ou `/proj-deploy`, se criada) |
| "segurança", "auth", "JWT", "permissão" | `elite-security-architect` (ou `/proj-seguranca`, se criada) |
| "arquitetura", "refatorar", "redesign", "migrar" | `/proj-plan` + `elite-principal-engineer` |
| plano aprovado, "executa o plano", "pode seguir" | `/proj-execute-plan` |
| entrega de especialista recebida, "revisar", antes de merge | `/proj-review` |
| prestes a dizer "pronto", "corrigido", "passando" | `/proj-verify-before-done` |
| fim de tarefa com algo não-óbvio, "aprendemos que" | `/learn` |
| {{TRIGGER_DOMINIO_1}} | {{SKILL_X}} |
| {{TRIGGER_DOMINIO_2}} | {{SKILL_Y}} |

Skills `/proj-api`, `/proj-deploy`, `/proj-seguranca` não vêm no template: criar a partir de
`skills/_template-skill/` quando o projeto tiver processo repetível nessas áreas.

### 1.1 Detecção de COMPLEXIDADE

**ANTES de implementação complexa, usar `/proj-plan`:**

| Indicador | Ação |
|-----------|------|
| Pedido vago ou ambíguo | `/proj-plan` primeiro |
| Afeta 3+ arquivos | `/proj-plan` primeiro |
| Envolve schema + service + endpoint | `/proj-plan` primeiro |
| Usuário diz "sistema de..." | `/proj-plan` primeiro |

### 2. Detecção por CONTEXTO TÉCNICO

| Contexto | Agente a Delegar |
|----------|------------------|
| Vai escrever query / migration | `elite-database-architect` |
| Vai mexer em autenticação/JWT/permissões | `elite-security-architect` |
| Vai configurar Docker/deploy | `elite-devops-architect` |
| Vai otimizar performance/cache | `elite-performance-architect` |
| Decisão arquitetural complexa | `elite-principal-engineer` |
| Pesquisa / comparação de alternativas | `elite-research-director` |
| Precisa mapear código, achar usos, ler logs ou resumir diff/doc antes de agir | `scout` (Haiku, somente leitura) |

### 3. Detecção por ARQUIVO sendo editado

| Caminho | Especialista |
|---------|--------------|
| {{PATH_ROTAS}} | elite-principal-engineer |
| {{PATH_MODELS}} | elite-database-architect |
| {{PATH_AUTH}} | elite-security-architect |
| {{PATH_DEPLOY}} (Docker, CI) | elite-devops-architect |
| {{PATH_WORKERS}} | elite-performance-architect |

---

## Fluxo de Auto-Routing

```
PEDIDO DO USUÁRIO
       |
       v
[1] DETECTAR PALAVRAS-CHAVE  → invocar skill
       |
       v
[2] AVALIAR COMPLEXIDADE     → /proj-plan se 3+ arquivos
       |
       v
[3] DELEGAR PARA ESPECIALISTA → agente elite (/proj-execute-plan se houver plano)
       |
       v
[4] EXECUTAR COM PADRÃO       → checklist RULES.md (quality gate no Stop)
       |
       v
[5] REVISAR INDEPENDENTE      → /proj-review
       |
       v
[6] REPORTAR COM EVIDÊNCIA    → /proj-verify-before-done, depois /learn
```

---

## Checklist de Verificação (todo código antes de entregar)

```
[ ] {{CHECK_DOMINIO_1}}
[ ] Schema de validação no input?
[ ] Type hints em funções?
[ ] Logger em vez de print()?
[ ] Migration se alterou schema?
[ ] Testes cobrindo o caso?
```

---

Este arquivo é **SEMPRE ATIVO**. Não precisa de trigger especial.
