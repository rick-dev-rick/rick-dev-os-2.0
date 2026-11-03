-- Hardening aplicado após criação de public.rick_ai_memories.
-- Alguns projetos podem herdar privilégios adicionais via default privileges.
-- Mantemos somente o necessário para o cliente autenticado; RLS continua limitando linhas.

revoke all privileges on table public.rick_ai_memories from authenticated;
grant select, insert, update, delete on table public.rick_ai_memories to authenticated;
revoke all privileges on table public.rick_ai_memories from anon;
