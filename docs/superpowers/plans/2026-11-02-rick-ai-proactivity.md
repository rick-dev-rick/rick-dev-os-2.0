# Rick IA Proactivity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer a Rick IA destacar até 3 sinais objetivos do OS sem chamadas automáticas à API.

**Architecture:** Criar um módulo puro `insights.mjs` que recebe o snapshot atual e devolve insights priorizados. O painel apenas renderiza esses insights, controla dispensa por sessão e mostra um badge no launcher. Nenhuma ação de escrita é criada por esse motor.

**Tech Stack:** React 19, JavaScript modules, Node test runner, lucide-react.

**Spec:** `docs/superpowers/specs/2026-11-02-rick-ai-proactivity.md`

## Global Constraints

- No máximo 3 insights simultâneos.
- Nenhuma chamada automática à API.
- Insights são somente leitura.
- Voz continua desativada.
- Nenhuma ação altera o OS sem confirmação explícita.
- Não gerar insights de saúde/corrida nesta versão.

## Review Focus

- Snapshot vazio não deve gerar alerta falso.
- Datas inválidas de manutenção devem ser ignoradas.
- Tarefas concluídas nunca entram como "quase concluída".
- Saldo zero não deve ser tratado como negativo.
- Dispensar deve ocultar apenas o conjunto atual e permitir reaparecer quando os insights mudarem.

---

### Task 1: Motor local de insights

**Files:**
- Create: `src/rick-ai/insights.mjs`
- Create: `tests/rick-ai-insights.test.mjs`

**Interfaces:**
- Produces: `buildRickAiInsights(snapshot, now = new Date()) -> Array<{id,type,message,priority}>`.

- [ ] Escrever testes falhando para saldo negativo, tarefa >=80%, manutenção >=7 dias, limite de 3, snapshot vazio e datas inválidas.
- [ ] Implementar regras determinísticas e ordenação por prioridade.
- [ ] Rodar `npm test`.

### Task 2: Badge e cartão de proatividade

**Files:**
- Modify: `src/rick-ai/RickAiPanel.jsx`
- Modify: `src/rick-ai/rick-ai.css`
- Modify: `tests/rick-ai-ui.test.mjs`

**Interfaces:**
- Consumes: `buildRickAiInsights(snapshot)`.

- [ ] Escrever testes falhando para badge, cartão `RICK IA NOTOU` e botão `Dispensar`.
- [ ] Calcular insights com `useMemo`.
- [ ] Implementar assinatura estável do conjunto atual e dispensa por sessão.
- [ ] Mostrar badge somente com painel fechado.
- [ ] Renderizar cartão acima das mensagens com até 3 itens.
- [ ] Rodar `npm test` e `npm run build`.

### Task 3: Verificação e publicação

- [ ] Rodar suite completa e build no head limpo.
- [ ] Confirmar que nenhum caminho chama `sendRickAiMessage` automaticamente.
- [ ] Abrir PR para `main`, mesclar e confirmar GitHub Pages.
