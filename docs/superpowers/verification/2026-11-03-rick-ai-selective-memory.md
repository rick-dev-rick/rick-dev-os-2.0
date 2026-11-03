# Verificação — Rick IA memória seletiva

- CI branch: `npm test` ✅
- CI branch: `npm run build` ✅
- Supabase: tabela `public.rick_ai_memories` criada ✅
- Supabase: RLS habilitado ✅
- Supabase: policy `rick_ai_memories_admin_own` para `authenticated` ✅
- Supabase: `anon` sem grants ✅
- Supabase: `authenticated` limitado a SELECT/INSERT/UPDATE/DELETE ✅
- Security advisor: sem finding novo específico de `rick_ai_memories`; permanecem avisos preexistentes do projeto sobre `public.rls_auto_enable()` e proteção de senhas vazadas/desabilitada.
- Performance advisor: índice novo ainda consta como unused porque a tabela foi criada agora e está vazia; esperado neste momento.
