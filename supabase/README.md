# Sincronização React

A função rick_dev_patch_state é SECURITY INVOKER e usa as políticas RLS existentes. Apenas administradores já cadastrados podem modificar módulos permitidos. Cada patch compara os valores anteriores dos mesmos módulos na transação; alterações concorrentes interrompem o salvamento em vez de sobrescrever. Cofre, notas, credenciais e tokens não são enviados.

A consulta de verificação confere privilégios e negação a uma identidade sem ADM, sem modificar dados reais.
