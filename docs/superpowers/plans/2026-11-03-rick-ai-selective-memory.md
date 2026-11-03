# Rick IA Selective Memory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar memória seletiva privada de longo prazo, com extração conservadora, revisão/exclusão no painel e uso no contexto futuro da Rick IA.

**Architecture:** Um módulo puro `memory.mjs` classifica apenas mensagens explicitamente duradouras e bloqueia conteúdo sensível. O cliente persiste memórias em `rick_ai_memories` com RLS e deduplicação; o painel carrega no máximo 20, injeta somente categoria+conteúdo no snapshot e permite revisão/exclusão.

**Tech Stack:** React, JavaScript ESM, Supabase Postgres/RLS, Node test runner, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-03-rick-ai-selective-memory.md`

## Global Constraints

- Não memorizar automaticamente conversa casual.
- Não memorizar automaticamente segredos/credenciais ou contexto médico/diagnóstico.
- Memórias são privadas do próprio admin autenticado.
- No máximo 20 memórias entram no contexto da IA.
- Falha de memória nunca impede a resposta principal.
- Exclusão requer ação explícita do usuário.

## Review Focus

- Mensagens com “hoje/agora” sem intenção duradoura devem ser ignoradas.
- Duplicatas semânticas simples não devem criar múltiplas linhas idênticas.
- RLS deve bloquear `anon` e outros usuários.
- UI deve continuar funcional se carregamento/salvamento da memória falhar.
- O snapshot enviado à IA não deve incluir ids/owner_id/metadados internos.

---

### Task 1: Extrator conservador

**Files:**
- Create: `src/rick-ai/memory.mjs`
- Create: `tests/rick-ai-memory.test.mjs`

**Interfaces:**
- Produces: `extractRickAiMemoryCandidate(message)`
- Produces: `normalizeRickAiMemoryKey(category, content)`

- [ ] Escrever testes RED para categorias, conversa casual, transitoriedade, dados sensíveis e normalização.
- [ ] Confirmar RED.
- [ ] Implementar extrator mínimo e determinístico.
- [ ] Confirmar GREEN.

### Task 2: CRUD privado no cliente

**Files:**
- Modify: `src/rick-ai/client.mjs`
- Modify: `tests/rick-ai-client.test.mjs`

**Interfaces:**
- Produces: `listRickAiMemories(limit=20)`
- Produces: `saveRickAiMemory(candidate)`
- Produces: `deleteRickAiMemory(id)`
- Produces: `parseRickAiMemories(rows)`

- [ ] Testar parser e presença de filtros owner/RLS-friendly.
- [ ] Implementar listagem, upsert/deduplicação e exclusão por owner.
- [ ] Rodar testes.

### Task 3: Integração no painel e contexto

**Files:**
- Modify: `src/rick-ai/RickAiPanel.jsx`
- Modify: `src/rick-ai/rick-ai.css`
- Modify: `tests/rick-ai-ui.test.mjs`

- [ ] Testar botão Memórias, lista, exclusão explícita e snapshot com `rickAiLongTermMemory`.
- [ ] Carregar memórias ao abrir painel ADM.
- [ ] Após resposta bem sucedida, extrair candidato e tentar salvar sem bloquear o chat.
- [ ] Atualizar lista e avisar quando nova memória for criada.
- [ ] Permitir exclusão explícita e recarregar contexto.
- [ ] Confirmar testes e build.

### Task 4: Banco privado e segurança

**Files:**
- Modify: `supabase/rick_ai_private.sql`
- Test: `tests/rick-ai-rls.test.mjs`

- [ ] Adicionar schema/grants/RLS/policy da tabela `rick_ai_memories` ao SQL versionado.
- [ ] Aplicar migration no projeto Supabase.
- [ ] Consultar schema/policies/grants para verificar.
- [ ] Rodar advisors de segurança/performance.

### Task 5: Publicação

- [ ] Rodar `npm test` e `npm run build` via CI.
- [ ] Abrir PR e mesclar somente após CI verde.
- [ ] Confirmar GitHub Pages no merge final.
