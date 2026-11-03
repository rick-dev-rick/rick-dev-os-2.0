# Rick IA Module Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar ações rápidas contextuais por módulo à Rick IA, sempre passando por confirmação explícita antes de alterar o OS.

**Architecture:** Reutilizar o contrato `pendingAction` já existente e expandi-lo apenas com `add_workout` e `mark_system_care`. A UI mantém um estado local de formulário rápido; ações existentes (missão, projeto, transação) continuam usando o mesmo validador e `applyConfirmedAction`. Nenhuma ação rápida chama a API.

**Tech Stack:** React 19, módulos ES, lucide-react, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-03-rick-ai-module-actions.md`

## Global Constraints

- Nenhuma ação altera dados sem confirmação explícita.
- Voz continua desativada.
- Ações rápidas ficam disponíveis apenas em modo ADM.
- Nenhuma ação rápida chama a API.
- Trocar de conversa ou módulo fecha o formulário local pendente.

## Review Focus

- Formulário inválido deve falhar antes de alterar o estado.
- `mark_system_care` deve aceitar somente `backupDays` e `diagnosticDays`.
- Registrar o mesmo cuidado no mesmo dia não pode duplicar a data.
- Ações rápidas devem usar o módulo correto ao criar missão.
- Cancelar deve limpar o formulário sem criar `pendingAction`.

---

### Task 1: Expandir contrato de ações

**Files:**
- Modify: `src/rick-ai/contracts.mjs`
- Create: `tests/rick-ai-module-actions.test.mjs`

**Interfaces:**
- Produces: `validatePendingAction` e `applyConfirmedAction` com suporte a `add_workout` e `mark_system_care`.

- [ ] Escrever testes falhando para treino e manutenção do System.
- [ ] Implementar validação mínima.
- [ ] Implementar aplicação usando `workouts` e `awardCare` + `today`.
- [ ] Rodar `npm test`.

### Task 2: Catálogo de ações rápidas por módulo

**Files:**
- Create: `src/rick-ai/module-actions.mjs`
- Modify: `tests/rick-ai-module-actions.test.mjs`

**Interfaces:**
- Produces: `getRickAiModuleActions(page)` e `buildRickAiLocalAction(actionId, fields, page)`.

- [ ] Escrever testes para home/study/fit/finance/lab/system e fallback seguro.
- [ ] Implementar no máximo 3 ações por módulo.
- [ ] Mapear dados de formulário para `pendingAction` validada.
- [ ] Rodar `npm test`.

### Task 3: UI inline de ações rápidas

**Files:**
- Modify: `src/rick-ai/RickAiPanel.jsx`
- Modify: `src/rick-ai/rick-ai.css`
- Modify: `tests/rick-ai-ui.test.mjs`

- [ ] Escrever testes falhando para `AÇÕES RÁPIDAS`, formulário local e confirmação.
- [ ] Implementar botões contextuais apenas em ADM.
- [ ] Implementar formulário compacto por ação.
- [ ] System gera `pendingAction` diretamente sem formulário.
- [ ] Fechar formulário ao mudar `page`, conversa ou iniciar nova conversa.
- [ ] Rodar `npm test` e `npm run build`.

### Task 4: Publicação segura

- [ ] Confirmar CI verde na branch.
- [ ] Abrir PR para `main`.
- [ ] Mesclar somente com testes/build verdes.
- [ ] Confirmar GitHub Pages concluído.
