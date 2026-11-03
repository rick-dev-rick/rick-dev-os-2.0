# Rick IA — comandos conversacionais

## Objetivo

Permitir que Rick controle os principais dados do RICK_DEV OS pela conversa com a Rick IA, sempre com confirmação explícita antes de qualquer alteração.

## Fluxo

1. Rick descreve uma ação em linguagem natural.
2. A Edge Function responde com mensagem + no máximo uma `pendingAction` estruturada.
3. Se faltar dado obrigatório ou houver alvo ambíguo, `pendingAction` deve ser `null` e a Rick IA pede o dado faltante.
4. O frontend valida a ação, mostra preview e mantém `Nada foi alterado ainda.`
5. Só `Confirmar` chama `applyConfirmedAction`.

## Ações permitidas

- `add_task`: criar missão em HOME/STUDY.
- `update_task_progress`: alterar progresso de uma missão existente por ID.
- `complete_task`: concluir missão existente por ID.
- `add_transaction`: registrar entrada ou saída.
- `delete_transaction`: remover lançamento existente por ID.
- `add_workout`: registrar treino.
- `add_run`: registrar corrida/caminhada realizada.
- `add_project`: criar projeto.
- `update_project_status`: alterar status de projeto existente por ID.
- `mark_system_care`: registrar backup ou diagnóstico do dia.

## Segurança

- Nunca gerar SQL, código ou mutação livre.
- Nunca aplicar automaticamente.
- IDs de edição/remoção devem vir do snapshot vivo do OS.
- Alvo ausente ou ambíguo: perguntar, não adivinhar.
- Frontend revalida todo payload antes de aplicar.
- Operações em registros inexistentes falham sem alterar o estado.
- Apenas modo ADM.

## Corridas

`add_run` exige data, distância, duração em segundos, tipo (`run|mixed|walk`), local (`street|park|track|treadmill|trail|other`) e esforço (`light|moderate|hard`). Se a mensagem não trouxer dados suficientes, a IA pergunta.

## Projetos

Status permitido: `doing`, `improve`, `later`, `done`.

## UX

Reutilizar o card de confirmação existente. Não adicionar uma nova barra de botões. A conversa passa a ser a interface principal para essas ações.
