# Rick IA Changes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar mudanças relevantes por módulo desde a última revisão usando snapshots compactos locais e sem chamadas automáticas à API.

**Architecture:** Criar um módulo puro `changes.mjs` para compactar o snapshot atual e calcular diffs determinísticos. Persistir a referência por módulo em `localStorage` por meio de helpers pequenos, e integrar o resultado ao `RickAiPanel` com botão, badge e cartão de revisão.

**Tech Stack:** React, JavaScript ESM, localStorage, Node test runner, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-03-rick-ai-changes.md`

## Global Constraints

- Nenhuma chamada automática à API.
- Somente leitura dos dados do OS.
- Referências ficam apenas no navegador.
- No máximo 4 mudanças exibidas por revisão.
- Primeira visita cria referência sem gerar alerta.
- Disponível apenas em modo ADM.

## Review Focus

- localStorage indisponível/corrompido deve degradar sem quebrar o chat.
- Diferenças devem ser estáveis e não duplicadas.
- Troca de módulo deve usar referência separada.
- Revisar mudanças deve atualizar a referência apenas após capturar o diff atual.
- Dados ausentes/arrays vazios devem produzir estado seguro.

---

### Task 1: Motor puro de snapshots e diffs

**Files:**
- Create: `src/rick-ai/changes.mjs`
- Create: `tests/rick-ai-changes.test.mjs`

**Interfaces:**
- Produces: `buildRickAiChangeSnapshot(snapshot, moduleId)`
- Produces: `diffRickAiChanges(previous, current, moduleId)`

- [ ] Escrever testes RED para os 6 módulos, primeira referência e limite de 4 mudanças.
- [ ] Rodar testes e confirmar falha pela ausência das funções.
- [ ] Implementar compactação e diffs mínimos.
- [ ] Rodar testes e confirmar GREEN.

### Task 2: Persistência local por módulo

**Files:**
- Modify: `src/rick-ai/changes.mjs`
- Modify: `tests/rick-ai-changes.test.mjs`

**Interfaces:**
- Produces: `loadRickAiChangeBaseline(moduleId, storage)`
- Produces: `saveRickAiChangeBaseline(moduleId, snapshot, storage)`

- [ ] Escrever testes para baseline por módulo, JSON inválido e storage indisponível.
- [ ] Confirmar RED.
- [ ] Implementar helpers resilientes de localStorage.
- [ ] Confirmar GREEN.

### Task 3: Integração no painel

**Files:**
- Modify: `src/rick-ai/RickAiPanel.jsx`
- Modify: `src/rick-ai/rick-ai.css`
- Modify: `tests/rick-ai-ui.test.mjs`

- [ ] Escrever testes de UI para botão `Mudanças`, badge, cartão e revisão sem API.
- [ ] Confirmar RED.
- [ ] Integrar baseline/diff ao snapshot vivo.
- [ ] Ao abrir mudanças, capturar diff e salvar nova referência.
- [ ] Fechar cartão ao trocar módulo.
- [ ] Confirmar testes e build.

### Task 4: Publicação

- [ ] Abrir PR.
- [ ] Mesclar após CI verde.
- [ ] Confirmar workflow do GitHub Pages concluído com sucesso.
