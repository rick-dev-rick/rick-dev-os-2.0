# Rick IA Memory & Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer a Rick IA manter continuidade real entre sessões e melhorar a experiência textual sem reativar voz.

**Architecture:** Reutilizar `rick_ai_conversations` e `rick_ai_messages` já existentes no Supabase. A Edge Function cria/reutiliza uma conversa, salva mensagens, busca histórico recente e o envia ao modelo junto do perfil privado e snapshot vivo. O frontend guarda `conversationId`, carrega histórico e mantém o chat rolado para a resposta mais recente.

**Tech Stack:** React 19, Supabase JS 2.118, Supabase Edge Functions/Deno, OpenAI Responses API, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-02-rick-ai-v2.md`

## Global Constraints

- Texto é o modo principal; voz permanece desativada na UI.
- Nenhuma alteração do OS sem confirmação explícita.
- Histórico deve ser privado, limitado ao usuário autenticado/admin e protegido por RLS já existente.
- Não persistir snapshots do OS nem segredos no histórico.
- Manter `main` intacta até testes e build passarem na branch.

## Review Focus

- `conversationId` inválido ou de outro usuário deve ser rejeitado com segurança.
- Falha ao persistir histórico não pode gerar escrita cruzada entre usuários.
- Histórico enviado ao modelo deve ter limite fixo para não crescer indefinidamente.
- UI deve funcionar quando ainda não existe conversa.
- Ação pendente continua exigindo confirmação explícita.

---

### Task 1: Contrato de conversa no cliente

**Files:**
- Modify: `tests/rick-ai-client.test.mjs`
- Modify: `src/rick-ai/client.mjs`

**Interfaces:**
- Produces: `buildRickAiRequest({ message, page, snapshot, conversationId })` e `loadRickAiHistory(conversationId?)`.

- [ ] Escrever testes falhando para envio/parse de `conversationId` e carregamento de histórico.
- [ ] Implementar o mínimo para os testes passarem.
- [ ] Rodar `npm test`.

### Task 2: Persistência e contexto no backend

**Files:**
- Modify: `supabase/functions/rick-ai/index.ts`
- Test: `tests/rick-ai-backend.test.mjs`

**Interfaces:**
- Consumes: `conversationId` opcional.
- Produces: resposta `{ message, pendingAction, conversationId }` e modo de histórico no mesmo handler.

- [ ] Escrever testes estruturais falhando para criação/validação de conversa, persistência e limite de histórico.
- [ ] Implementar criação/reuso da conversa, salvar mensagem do usuário, buscar últimas 20 mensagens, incluir histórico na entrada do modelo, salvar resposta e atualizar `updated_at`.
- [ ] Implementar leitura das últimas mensagens para a UI sem persistir snapshots.
- [ ] Rodar `npm test`.

### Task 3: Continuidade e UX no painel

**Files:**
- Modify: `tests/rick-ai-ui.test.mjs`
- Modify: `src/rick-ai/RickAiPanel.jsx`
- Modify: `src/rick-ai/rick-ai.css`

**Interfaces:**
- Consumes: `loadRickAiHistory`, `conversationId` retornado pelo backend.

- [ ] Escrever testes falhando para carregar histórico ao abrir, manter `conversationId` e auto-scroll.
- [ ] Implementar estado de conversa, carregamento inicial e auto-scroll.
- [ ] Melhorar estado vazio/erro sem reintroduzir voz.
- [ ] Rodar `npm test` e `npm run build`.

### Task 4: Verificação final

- [ ] Rodar suite completa e build na branch.
- [ ] Revisar diff garantindo que snapshot vivo não é salvo em `rick_ai_messages`.
- [ ] Só depois abrir PR para `main`.
