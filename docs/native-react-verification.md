# React 2.0 — verificação e limites

A única entrada publicada é src/entry.jsx → Workspace → Login/App. Não há redirecionamento, iframe do aplicativo anterior nem execução do HTML do 1.0. A referência antiga fica em reference/, fora da distribuição.

A interface usa componentes React com estado e formulários. O redesign usa grafite, tipografia sans-serif, cartões arredondados e acentos neon; a estética original não é mantida.

O acesso lê as listas atuais do Supabase automaticamente. O adaptador serializa apenas os módulos modificados. A função SECURITY INVOKER rick_dev_patch_state mantém RLS, verifica os administradores existentes e exige os valores esperados antes de atualizar atomicamente.

Verificação DB: anon não pode executar; authenticated pode; security_definer=false; RLS permanece ativo. Consultas de leitura confirmaram matching=true, conflicting=false e preservação de módulos não alterados.

Limite de verificação: a revisão automática bloqueou um teste que configurava claims de um administrador existente para tentar uma operação com rollback. Esse teste não foi executado e não foi repetido. Não houve atualização dos registros reais para QA. Salvamento autenticado ponta a ponta precisa ser exercitado pelo proprietário.

Avisos de segurança preexistentes (não introduzidos pela função nova): rls_auto_enable SECURITY DEFINER executável, e proteção contra senhas vazadas desativada. Não alterados no escopo do redesign. Referências: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable e https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .
