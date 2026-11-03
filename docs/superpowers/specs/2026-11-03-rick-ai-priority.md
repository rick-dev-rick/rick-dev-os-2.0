# Rick IA — prioridade inteligente

## Objetivo

Mostrar uma recomendação local e explicável de prioridade atual usando o estado vivo do OS e as memórias seletivas, sem chamada automática à API.

## Resultado

A função de prioridade retorna até três itens ordenados:
- `agora`: a prioridade principal;
- `depois`: segunda melhor ação;
- `pode_esperar`: terceira opção de menor urgência relativa.

Cada item tem `title`, `reason`, `module`, `score` e `source`.

## Sinais

- Memória do tipo `priority`: peso muito alto quando o conteúdo cita uma tarefa/projeto existente.
- Finance negativo: prioridade crítica.
- Tarefa aberta com progresso >= 80%: peso alto por estar perto de concluir.
- Projeto ativo do LAB: peso médio-alto, favorecendo itens citados por memórias `priority`, `goal`, `decision` ou `project`.
- Backup ou diagnóstico atrasado >= 7 dias: peso médio.
- Missões abertas de HOME/STUDY: peso base.

## Regras

- Somente leitura.
- Nenhuma chamada à API.
- Não cria nem altera dados.
- Sem pressão constante: o card é aberto pelo usuário pelo botão `Prioridade`.
- Não usar conteúdo sensível; apenas memórias já filtradas pela memória seletiva.
- Explicação curta e determinística.
- Empates são resolvidos de forma estável.
- Sem candidatos reais: mostrar estado vazio, não inventar prioridade.

## UX

- Botão `Prioridade` junto de `Resumo` e `Mudanças`.
- Card `PRIORIDADE AGORA` com até 3 linhas rotuladas `Agora`, `Depois`, `Pode esperar`.
- O primeiro item recebe destaque maior.
- Fecha ao trocar de módulo.
- Disponível apenas no modo ADM.
