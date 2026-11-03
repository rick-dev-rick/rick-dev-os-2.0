# Daiane Dual Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Renomear a assistente visível para Daiane e fazê-la distinguir contextualmente Douglas de Rick/rick_dev sem seletor manual.

**Architecture:** Manter a arquitetura interna `rick-ai` intacta. Adicionar um classificador local e determinístico de contexto para ajudar UX e enviar um sinal explícito ao backend; o modelo recebe esse sinal junto com perfil privado dividido entre contexto pessoal e dev, mas deve usar linguagem neutra quando a confiança for baixa. A Edge Function continua responsável por conversa e ações estruturadas, sem alterar o mecanismo de confirmação.

**Tech Stack:** React, Node test runner, Supabase Edge Functions (Deno), PostgreSQL JSONB.

**Spec:** `docs/superpowers/specs/2026-11-03-daiane-dual-identity.md`

## Global Constraints

- Nome público: Daiane.
- Douglas e Rick/rick_dev são contextos da mesma pessoa, não personas independentes.
- Sem botão ou seletor manual de modo.
- Ambiguidade deve resultar em tratamento neutro.
- Não incluir saúde, credenciais ou segredos no perfil fixo.
- Manter confirmação explícita para qualquer mutação do OS.
- Não renomear tabelas, funções ou arquivos internos `rick-ai`.

## Review Focus

- Conversas que misturam pessoal e dev não podem trocar de nome de forma brusca ou incoerente.
- Uma palavra dev isolada em conversa pessoal não deve necessariamente classificar como Rick.
- Uma palavra pessoal isolada em conversa dev não deve necessariamente classificar como Douglas.
- Contexto ambíguo deve permanecer neutro.
- Histórico antigo com “Rick IA” não deve quebrar carregamento.

---

### Task 1: Classificador de contexto

**Files:**
- Create: `src/rick-ai/identity-context.mjs`
- Test: `tests/rick-ai-identity-context.test.mjs`

**Interfaces:**
- Produces: `inferRickIdentityContext({ message, recentConversation, activeModule }) -> { context, confidence, preferredName, signals }`

- [ ] Escrever testes RED para pessoal, dev, misto e ambíguo.
- [ ] Executar testes e confirmar falha.
- [ ] Implementar classificador simples por sinais ponderados e módulo.
- [ ] Executar testes e confirmar GREEN.

### Task 2: UX Daiane

**Files:**
- Modify: `src/rick-ai/RickAiPanel.jsx`
- Test: `tests/rick-ai-ui.test.mjs`

**Interfaces:**
- Consumes: `inferRickIdentityContext`.
- Produces: header/aria/cópias com Daiane e snapshot com `rickAiIdentityContext`.

- [ ] Adicionar testes RED para nome Daiane e ausência de “RICK IA” na cópia visível principal.
- [ ] Atualizar greeting para neutro e textos visíveis.
- [ ] Incluir sinal de identidade no snapshot enviado ao backend.
- [ ] Rodar suíte e build.

### Task 3: Perfil privado dividido

**Files:**
- Database row: `rick_ai_profiles.profile`.

- [ ] Atualizar JSONB com `identity`, `personal_context`, `developer_context`, `tone`, `priorities`.
- [ ] Preservar somente dados pessoais úteis e não sensíveis.
- [ ] Ler de volta e verificar estrutura.

### Task 4: Prompt/backend Daiane

**Files:**
- Supabase Edge Function `rick-ai`: `prompt.ts` e `index.ts` se necessário.

- [ ] Atualizar identidade de Rick IA para Daiane.
- [ ] Ensinar regra Douglas/Rick e uso do `rickAiIdentityContext` como sinal, não verdade absoluta.
- [ ] Manter schema de ações e tratamento 429 intactos.
- [ ] Deploy nova versão.
- [ ] Verificar função ativa e logs sem erro de boot.

### Task 5: Integração e publicação

**Files:**
- Nenhum adicional esperado.

- [ ] Rodar suíte completa e build no SHA final da branch.
- [ ] Abrir PR e revisar diff.
- [ ] Mesclar no main.
- [ ] Verificar GitHub Pages em sucesso no SHA de merge.
