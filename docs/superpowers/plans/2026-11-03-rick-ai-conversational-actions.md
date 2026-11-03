# Rick IA Conversational Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir comandos conversacionais seguros para criar, editar, concluir e remover dados principais do RICK_DEV OS, sempre com confirmação explícita.

**Architecture:** A Edge Function continua sendo responsável por interpretar linguagem natural e devolver no máximo uma `pendingAction` estruturada. O frontend é a autoridade final: valida o payload, exige IDs reais para mutações em registros existentes e só aplica a alteração depois do clique em Confirmar. Nenhuma ação livre, SQL ou escrita automática é permitida.

**Tech Stack:** React, JavaScript ESM, Node test runner, Supabase Edge Functions, OpenAI Responses API.

**Spec:** `docs/superpowers/specs/2026-11-03-rick-ai-conversational-actions.md`

## Global Constraints

- Nenhuma alteração no OS sem confirmação explícita.
- No máximo uma ação pendente por resposta.
- IDs de atualização/remoção devem existir no estado atual.
- Se faltar dado obrigatório ou houver ambiguidade, responder sem ação.
- Não adicionar nova barra de botões.
- Não usar SQL gerado pelo modelo.

## Review Focus

- IDs inexistentes não podem alterar nenhum registro.
- Progresso precisa ficar entre 0 e 100 e conclusão deve resultar em 100%.
- Remoção de transação deve preservar todos os outros lançamentos.
- Corrida incompleta deve ser rejeitada antes de virar pendingAction válida.
- Status de projeto fora de `doing|improve|later|done` deve ser rejeitado.

---

### Task 1: Expandir contrato e aplicação frontend

**Files:**
- Modify: `src/rick-ai/contracts.mjs`
- Test: `tests/rick-ai-contracts.test.mjs`

**Interfaces:**
- Consumes: `validateRecord`, `normalizeData`, `today`, estado vivo do OS.
- Produces: `validatePendingAction(raw)` e `applyConfirmedAction(data, rawAction)` com os novos tipos.

- [ ] Escrever testes RED para update/complete task, delete transaction, add run e update project status.
- [ ] Confirmar falha por tipos não suportados.
- [ ] Implementar validação mínima e aplicação imutável.
- [ ] Rodar testes e suíte completa.

### Task 2: Ampliar contrato da Edge Function

**Files:**
- Supabase Edge Function `rick-ai/index.ts`
- Supabase Edge Function `rick-ai/prompt.ts`
- Test: `tests/rick-ai-edge-contract.test.mjs` (contrato versionado/fixture quando aplicável)

**Interfaces:**
- Produces: `pendingAction.type` restrito aos tipos permitidos e payload completo/normalizado.

- [ ] Criar teste/inspeção RED do contrato esperado.
- [ ] Ampliar JSON schema e normalização de ações.
- [ ] Atualizar prompt com regras de IDs reais e ambiguidades.
- [ ] Fazer deploy preservando auth e tratamento de rate limit.
- [ ] Verificar logs/deploy ativo.

### Task 3: Validar UX conversacional

**Files:**
- Modify somente se necessário: `src/rick-ai/RickAiPanel.jsx`
- Test: `tests/rick-ai-ui.test.mjs`

**Interfaces:**
- Reutiliza `pendingAction`, preview, Cancelar e Confirmar já existentes.

- [ ] Garantir via teste que não há auto-apply.
- [ ] Garantir que todos os novos tipos passam pelo mesmo card de confirmação.
- [ ] Rodar testes + build.
- [ ] Abrir PR, merge e validar GitHub Pages.
