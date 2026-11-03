# Rick IA — mudanças desde a última revisão

## Objetivo

Permitir que a Rick IA compare o estado atual de cada módulo com uma referência anterior e mostre apenas mudanças relevantes, sem chamar a API.

## Persistência

A referência é salva localmente no navegador por módulo, em `localStorage`. Nada é enviado para servidor e nenhum histórico completo é mantido: apenas um snapshot compacto necessário para comparação.

## Comportamento

- Na primeira vez de cada módulo, o estado atual vira a referência e nenhum alerta é exibido.
- Depois disso, mudanças reais geram um indicador discreto no botão `Mudanças`.
- Ao abrir `Mudanças`, o painel captura a lista atual e marca o estado atual como nova referência.
- Novas alterações posteriores voltam a aparecer como não revisadas.
- O cartão mostra no máximo 4 mudanças por vez.

## Mudanças relevantes

- HOME: novas/concluídas/progresso de missões.
- STUDY: missões e tópicos concluídos.
- FIT: novas corridas, distância adicionada, treinos concluídos e alteração do último peso.
- FINANCE: variação de saldo, novas entradas/saídas e gasto relevante recente.
- LAB: novos projetos e mudanças de status.
- SYSTEM: novos registros de backup e diagnóstico.

## UX

- botão `Mudanças` junto de `Resumo` no contexto do módulo;
- badge pequeno com quantidade de mudanças não revisadas;
- cartão `MUDOU DESDE A ÚLTIMA VEZ`;
- estado vazio claro quando não houver novidade;
- disponível apenas em modo ADM.

## Segurança e custo

- somente leitura;
- nenhuma chamada automática à API;
- nenhuma alteração nos dados do OS;
- snapshots ficam apenas no navegador.
