# Rick IA Briefing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um briefing manual, local e explicável que resume o estado atual do RICK_DEV OS sem chamar a API nem alterar dados.

**Architecture:** Criar um motor puro `buildRickAiBriefing(snapshot, priorities, insights, changes)` que combina sinais já calculados pelo OS em uma estrutura curta. O painel apenas abre/fecha o card e renderiza o resultado; nenhuma chamada de rede é disparada ao abrir o briefing.

**Tech Stack:** React, JavaScript modules, Node test runner, CSS existente da Rick IA.

**Spec:** decisão aprovada em conversa em 2026-11-03.

## Global Constraints

- Somente ADM.
- Zero chamada automática à API.
- Somente leitura; não alterar dados.
- Manter a nova estética atual da Rick IA.
- Briefing manual por botão.
- Reusar prioridades, insights e mudanças já calculados.
- Fechar o briefing ao trocar de módulo.

## Review Focus

- Snapshot vazio deve produzir briefing seguro e não inventar fatos.
- Prioridade principal deve aparecer como foco quando existir.
- Insight crítico financeiro/manutenção deve aparecer sem duplicar a prioridade principal.
- Mudanças recentes devem ser limitadas e resumidas.
- Abrir briefing nunca pode chamar `sendRickAiMessage`.

---

### Task 1: Motor de briefing local

**Files:**
- Create: `src/rick-ai/briefing.mjs`
- Create: `tests/rick-ai-briefing.test.mjs`

**Interfaces:**
- Produces: `buildRickAiBriefing(snapshot, priorities, insights, changes)`.

- [ ] Escrever testes RED para foco principal, sinais relevantes, mudanças e estado vazio.
- [ ] Confirmar falha pela ausência de `briefing.mjs`.
- [ ] Implementar o motor mínimo.
- [ ] Confirmar GREEN.

### Task 2: Integrar briefing ao painel

**Files:**
- Modify: `src/rick-ai/RickAiPanel.jsx`
- Modify: `src/rick-ai/rick-ai.css`
- Modify: `tests/rick-ai-ui.test.mjs`

**Interfaces:**
- Consumes: `buildRickAiBriefing(...)`.

- [ ] Escrever teste RED para botão, card, estado local e ausência de chamada de API.
- [ ] Confirmar RED.
- [ ] Adicionar `briefingOpen`, cálculo memoizado e botão `Briefing`.
- [ ] Renderizar card `BRIEFING DA RICK IA` com foco e sinais.
- [ ] Fechar ao trocar módulo.
- [ ] Aplicar estilo coerente com a interface atual.
- [ ] Confirmar GREEN e build.

### Task 3: Publicar

- [ ] Validar testes e build na branch.
- [ ] Abrir PR.
- [ ] Mesclar após verde.
- [ ] Confirmar GitHub Pages no SHA final.
