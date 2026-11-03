# Rick IA — Consciência de módulo

## Objetivo

Fazer a Rick IA entender explicitamente qual módulo do RICK_DEV OS está ativo, quais dados desse módulo merecem prioridade e quais perguntas são mais úteis naquele contexto.

## Abordagem

Criar uma configuração central de módulos da Rick IA. Cada módulo define nome, foco, prioridades e sugestões rápidas. O snapshot passa a incluir um bloco `activeModule` derivado dessa configuração e o painel mostra até 3 sugestões clicáveis do módulo atual.

## Módulos

- `home`: visão geral, prioridades abertas, progresso geral e foco.
- `study`: tarefas de estudo, tópicos, recursos e progresso.
- `fit`: corridas, evolução corporal, treinos e metas de corrida.
- `finance`: saldo, transações, compras planejadas e itens já comprados.
- `lab`: projetos, evolução técnica, snippets e materiais.
- `system`: backups, diagnósticos e manutenção do OS.

## UX

- Mostrar uma linha discreta com o nome/foco do módulo atual no painel.
- Mostrar até 3 chips de perguntas sugeridas quando a conversa estiver vazia ou só com o greeting.
- Clicar em uma sugestão preenche e envia a pergunta diretamente.
- Sugestões mudam ao trocar de módulo.
- Não chamar API automaticamente.

## Segurança

- A nova camada só organiza contexto e sugestões.
- Nenhuma alteração no OS sem confirmação explícita.
- Voz permanece desativada.
