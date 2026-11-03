# Rick IA — resumo local por módulo

## Objetivo

Dar à Rick IA um resumo instantâneo do módulo atual usando somente o snapshot vivo do OS, sem chamada automática à API.

## Formato

Cada resumo retorna no máximo 3 linhas curtas:
1. estado atual;
2. atenção/prioridade;
3. próximo passo sugerido.

## Regras por módulo

- HOME: tarefas abertas/concluídas e a missão aberta mais avançada.
- STUDY: tarefas de estudo, tópicos concluídos e a missão de estudo mais avançada.
- FIT: quantidade de corridas, distância recente acumulada, treinos pendentes e último peso quando disponível.
- FINANCE: saldo, volume de entradas/saídas recentes e maior gasto recente quando existir.
- LAB: projetos por status e projeto ativo prioritário.
- SYSTEM: último backup, último diagnóstico e atraso de manutenção quando houver.

## UX

- botão `Resumo` no contexto do módulo;
- clique abre/fecha um cartão local `RESUMO DO MÓDULO`;
- nenhuma chamada à API;
- cartão atualiza imediatamente quando os dados do OS mudarem;
- disponível apenas em modo ADM.

## Segurança

O resumo é somente leitura e nunca gera ação automaticamente. A regra de confirmação explícita para alterações permanece intacta.
