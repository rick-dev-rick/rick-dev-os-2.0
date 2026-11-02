# Rick IA Memory & Context — conclusão

Implementação final usa as tabelas privadas `rick_ai_conversations` e `rick_ai_messages` pelo cliente autenticado com RLS. A Edge Function textual permanece estável e não persiste histórico diretamente.

Concluído:
- memória entre sessões;
- carregamento das últimas 20 mensagens;
- envio de até 12 mensagens recentes como contexto transitório;
- auto-scroll do painel;
- voz permanece desativada;
- ações no OS continuam exigindo confirmação explícita;
- suite completa e build verdes na branch `feature/rick-ai-memory-context`.
