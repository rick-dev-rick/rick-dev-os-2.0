# Rick IA — Proatividade leve

## Objetivo

Fazer a Rick IA perceber sinais objetivos do RICK_DEV OS e chamar atenção apenas quando houver algo realmente útil, sem chamadas automáticas à API e sem transformar a assistente em uma fonte constante de cobrança.

## Abordagem escolhida

Usar um motor local determinístico de insights calculado a partir do snapshot atual do OS. O motor retorna no máximo 3 alertas priorizados. A interface mostra um badge discreto no launcher e, quando aberta, exibe um cartão curto com os insights atuais. Nenhum insight altera dados, envia mensagem ou chama a API sozinho.

## Regras iniciais

1. **Saldo negativo**: alertar quando `finance.balance < 0`.
2. **Tarefa quase concluída**: alertar quando existir tarefa não concluída com `progress >= 80`, priorizando a de maior progresso.
3. **Manutenção do sistema atrasada**: alertar se o último backup ou diagnóstico registrado estiver há 7 dias ou mais, desde que já exista histórico daquela rotina.

## Anti-ruído

- no máximo 3 insights simultâneos;
- não alertar só porque existem tarefas abertas;
- não gerar insight de saúde/corrida nesta primeira versão;
- não chamar a API automaticamente;
- permitir dispensar o cartão pelo restante da sessão;
- se os dados mudarem e surgir um conjunto diferente de insights, o cartão pode reaparecer.

## UX

- badge numérico discreto no launcher quando houver insights e o painel estiver fechado;
- cartão `RICK IA NOTOU` acima das mensagens quando o painel estiver aberto;
- botão `Dispensar` para ocultar o conjunto atual durante a sessão;
- texto curto, direto e coerente com a personalidade da Rick IA.

## Segurança

Insights são somente leitura. A regra atual de confirmação explícita antes de qualquer alteração no OS permanece intacta.
