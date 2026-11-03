# Rick IA Module Awareness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer a Rick IA priorizar o módulo atual do OS e oferecer perguntas rápidas específicas da tela.

**Architecture:** Criar `src/rick-ai/modules.mjs` como fonte única de configuração dos módulos. O snapshot recebe `activeModule` com metadados do módulo atual e o painel consome as sugestões dessa mesma configuração, evitando regras duplicadas.

**Tech Stack:** React 19, módulos ES, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-02-rick-ai-module-awareness.md`

## Global Constraints

- Módulos válidos: `home`, `study`, `fit`, `finance`, `lab`, `system`.
- Voz continua desativada.
- Nenhuma chamada automática à API.
- Nenhuma alteração no OS sem confirmação explícita.
- Sugestões rápidas aparecem apenas no estado inicial da conversa.

## Review Focus

- Página desconhecida deve cair em `home` sem quebrar o painel.
- Cada módulo deve ter no máximo 3 sugestões curtas e distintas.
- Trocar de módulo deve atualizar contexto/sugestões imediatamente.
- Sugestão clicada deve usar o fluxo normal `sendMessage`, sem atalho de escrita.
- Snapshot não deve duplicar dados inteiros dentro de `activeModule`.

---

### Task 1: Configuração central de módulos

**Files:**
- Create: `src/rick-ai/modules.mjs`
- Create: `tests/rick-ai-modules.test.mjs`

**Interfaces:**
- Produces: `getRickAiModule(page)` e `getRickAiSuggestions(page)`.

- [ ] Escrever testes falhando para os 6 módulos, fallback `home` e limite de 3 sugestões.
- [ ] Implementar configuração mínima centralizada.
- [ ] Rodar `npm test`.

### Task 2: Contexto ativo no snapshot

**Files:**
- Modify: `src/rick-ai/context.mjs`
- Modify: `tests/rick-ai-modules.test.mjs`

**Interfaces:**
- Consumes: `getRickAiModule(page)`.
- Produces: `snapshot.activeModule = { id, label, focus, priorities }`.

- [ ] Escrever teste falhando para `activeModule` no snapshot.
- [ ] Implementar sem duplicar os dados do módulo.
- [ ] Rodar `npm test`.

### Task 3: Sugestões rápidas no painel

**Files:**
- Modify: `src/rick-ai/RickAiPanel.jsx`
- Modify: `src/rick-ai/rick-ai.css`
- Modify: `tests/rick-ai-ui.test.mjs`

**Interfaces:**
- Consumes: `getRickAiModule(page)` e `getRickAiSuggestions(page)`.

- [ ] Escrever testes falhando para indicador de módulo e chips de sugestão.
- [ ] Renderizar sugestões apenas quando a conversa estiver no greeting inicial.
- [ ] Clicar em chip chama `sendMessage(suggestion)`.
- [ ] Estilizar de forma compacta e responsiva.
- [ ] Rodar `npm test` e `npm run build`.

### Task 4: Publicação

- [ ] Adicionar branch ao CI.
- [ ] Confirmar testes/build verdes.
- [ ] Abrir PR, mesclar e confirmar GitHub Pages verde.
