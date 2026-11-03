# Rick IA Priority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Calcular e exibir até três prioridades explicáveis usando snapshot do OS + memórias seletivas, sem chamada à API.

**Architecture:** Um motor puro em `src/rick-ai/priority.mjs` transforma snapshot e memórias em candidatos, pontua e ordena de forma estável. `RickAiPanel.jsx` apenas consome o resultado e controla abertura/fechamento do card, preservando a separação entre lógica e UI.

**Tech Stack:** React, JavaScript ESM, Node test runner, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-03-rick-ai-priority.md`

## Global Constraints

- Somente leitura; nenhuma alteração nos dados do OS.
- Nenhuma chamada automática à API.
- Disponível apenas no modo ADM.
- Até três prioridades, sem inventar item quando não houver candidato real.
- Memórias usadas apenas das categorias já filtradas pela memória seletiva.
- Ranking determinístico e estável.

## Review Focus

- Saldo negativo deve vencer candidatos menos urgentes.
- Memória `priority` só reforça item real citado no OS; não cria item fantasma.
- Tarefa concluída não pode aparecer como prioridade.
- Datas inválidas de manutenção devem ser ignoradas.
- Empates devem manter ordem estável e previsível.

---

### Task 1: Motor de ranking

**Files:**
- Create: `src/rick-ai/priority.mjs`
- Create: `tests/rick-ai-priority.test.mjs`

**Interfaces:**
- Consumes: `snapshot`, `memories`, `now` opcional.
- Produces: `buildRickAiPriorities(snapshot, memories, now)` => array com até 3 itens `{ id, bucket, title, reason, module, score, source }`.

- [ ] Escrever testes falhando para ranking, reforço por memória, manutenção e estado vazio.
- [ ] Confirmar RED no CI.
- [ ] Implementar candidatos e ranking mínimos.
- [ ] Confirmar GREEN.

### Task 2: UI do card

**Files:**
- Modify: `src/rick-ai/RickAiPanel.jsx`
- Modify: `src/rick-ai/rick-ai.css`
- Modify: `tests/rick-ai-ui.test.mjs`

**Interfaces:**
- Consumes: `buildRickAiPriorities(snapshot, memories)`.
- Produces: botão `Prioridade` e card `PRIORIDADE AGORA`.

- [ ] Escrever teste de UI falhando.
- [ ] Confirmar RED.
- [ ] Adicionar estado `priorityOpen`, fechamento na troca de módulo e renderização dos 3 buckets.
- [ ] Confirmar GREEN e build.

### Task 3: Publicação

**Files:**
- Modify: `.github/workflows/rick-ai-ci.yml`

- [ ] Incluir a branch no CI.
- [ ] Confirmar testes + build verdes no head final.
- [ ] Abrir PR, mergear e verificar GitHub Pages no SHA final.
