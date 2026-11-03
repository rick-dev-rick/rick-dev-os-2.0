# Rick IA Module Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um resumo local, instantâneo e somente leitura para o módulo atual da Rick IA.

**Architecture:** Criar um motor puro `buildRickAiModuleSummary(snapshot)` que consome apenas o snapshot atual e retorna até 3 itens `{id,label,value,tone}`. O painel calcula esse resumo com `useMemo` e mostra/oculta um cartão local através de um botão `Resumo` no contexto do módulo. Nenhuma chamada à API ou persistência adicional será usada.

**Tech Stack:** React 19, JavaScript modules, Node test runner, CSS existente da Rick IA.

**Spec:** `docs/superpowers/specs/2026-11-03-rick-ai-module-summary.md`

## Global Constraints

- Resumo somente leitura.
- No máximo 3 itens.
- Nenhuma chamada automática à API.
- Disponível apenas em modo ADM.
- Voz continua desativada.
- Ações do OS continuam exigindo confirmação explícita.

## Review Focus

- Módulos sem dados não podem quebrar o resumo.
- Finance deve formatar valores em BRL sem alterar dados.
- FIT deve lidar com ausência de peso/corridas.
- SYSTEM deve lidar com histórico vazio.
- Troca de módulo deve trocar imediatamente o conteúdo do resumo.

---

### Task 1: Motor de resumo

**Files:**
- Create: `src/rick-ai/module-summary.mjs`
- Create: `tests/rick-ai-module-summary.test.mjs`

**Interfaces:**
- Produces: `buildRickAiModuleSummary(snapshot) -> Array<{id,label,value,tone}>`.

- [ ] Escrever testes para os 6 módulos e fallback sem dados.
- [ ] Confirmar RED.
- [ ] Implementar motor puro com no máximo 3 itens.
- [ ] Confirmar GREEN.

### Task 2: UI do resumo

**Files:**
- Modify: `src/rick-ai/RickAiPanel.jsx`
- Modify: `src/rick-ai/rick-ai.css`
- Modify: `tests/rick-ai-ui.test.mjs`

**Interfaces:**
- Consumes: `buildRickAiModuleSummary(snapshot)`.

- [ ] Testar botão `Resumo`, estado `summaryOpen` e cartão `RESUMO DO MÓDULO`.
- [ ] Implementar abertura/fechamento local sem chamar `sendRickAiMessage`.
- [ ] Fechar resumo ao trocar de módulo.
- [ ] Estilizar cartão compacto e responsivo.
- [ ] Rodar testes e build.

### Task 3: Publicação

- [ ] Confirmar CI verde.
- [ ] Abrir PR para `main`.
- [ ] Mesclar somente com validação verde.
- [ ] Confirmar GitHub Pages publicado.
