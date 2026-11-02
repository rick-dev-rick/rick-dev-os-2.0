# Rick IA Conversation Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar à Rick IA múltiplas conversas privadas, permitindo iniciar um assunto novo e alternar entre conversas recentes sem misturar contexto.

**Architecture:** Reutilizar as tabelas `rick_ai_conversations` e `rick_ai_messages` já protegidas por RLS. O cliente lista as conversas do usuário autenticado, carrega uma conversa específica e reseta apenas o estado local ao iniciar uma conversa nova; a conversa só é criada quando a primeira troca é salva.

**Tech Stack:** React 19, Supabase JS 2.118, lucide-react, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-02-rick-ai-v2.md`

## Global Constraints

- Voz continua desativada.
- Nenhuma ação altera dados do OS sem confirmação explícita.
- Conversas só podem ser lidas pelo próprio usuário autenticado/admin via RLS existente.
- Criar uma nova conversa não apaga nem altera conversas anteriores.
- Sem mudanças na Edge Function textual nesta leva.

## Review Focus

- Usuário sem conversas deve continuar vendo o greeting normal.
- Trocar de conversa deve descartar ação pendente antiga.
- Nova conversa deve limpar somente o contexto atual e não criar linha vazia no banco.
- Lista deve ser limitada para não crescer indefinidamente na UI.
- Falha ao listar histórico não deve impedir enviar mensagem.

---

### Task 1: API de conversas recentes

**Files:**
- Modify: `src/rick-ai/client.mjs`
- Modify: `tests/rick-ai-client.test.mjs`

**Interfaces:**
- Produces: `listRickAiConversations(limit = 8) -> Array<{id,title,updatedAt}>`.

- [ ] Escrever testes para normalização e limite da lista.
- [ ] Implementar consulta por `owner_id`, ordenada por `updated_at desc`, limitada a 8 por padrão.
- [ ] Rodar `npm test`.

### Task 2: Gerenciador de conversa no painel

**Files:**
- Modify: `src/rick-ai/RickAiPanel.jsx`
- Modify: `tests/rick-ai-ui.test.mjs`

**Interfaces:**
- Consumes: `listRickAiConversations`, `loadRickAiHistory(conversationId)`.

- [ ] Escrever testes para botão `Nova conversa`, abertura da lista e troca de conversa.
- [ ] Implementar estado `conversationListOpen` e `conversations`.
- [ ] Implementar `startNewConversation()` zerando `conversationId`, mensagens para greeting e `pendingAction`.
- [ ] Implementar `switchConversation(id)` carregando histórico específico e limpando ação pendente.
- [ ] Atualizar lista após salvar uma troca nova.
- [ ] Rodar `npm test`.

### Task 3: UX compacta

**Files:**
- Modify: `src/rick-ai/rick-ai.css`
- Modify: `tests/rick-ai-ui.test.mjs`

- [ ] Adicionar barra compacta de ações no header com histórico e nova conversa.
- [ ] Adicionar lista dropdown/overlay com título e data curta da conversa.
- [ ] Garantir layout mobile sem cobrir composer.
- [ ] Rodar `npm test` e `npm run build`.

### Task 4: Publicação segura

- [ ] Confirmar CI verde.
- [ ] Abrir PR para `main`.
- [ ] Mesclar somente com testes/build verdes.
- [ ] Confirmar deploy do GitHub Pages.
