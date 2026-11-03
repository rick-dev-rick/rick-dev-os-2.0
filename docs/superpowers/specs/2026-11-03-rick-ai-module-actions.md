# Rick IA — ações por módulo

## Objetivo

Transformar a Rick IA em uma camada operacional do RICK_DEV OS, oferecendo ações rápidas diferentes conforme o módulo atual, sem depender de novas chamadas automáticas à API.

## Ações iniciais

- HOME: adicionar missão.
- STUDY: adicionar missão de estudo.
- FIT: adicionar treino simples.
- FINANCE: registrar gasto ou entrada.
- LAB: adicionar projeto.
- SYSTEM: registrar backup ou diagnóstico do dia.

## Fluxo

1. Rick abre a Rick IA.
2. A interface mostra ações rápidas do módulo atual.
3. Ações que exigem dados abrem um formulário compacto dentro do painel.
4. Ao enviar o formulário, a Rick IA cria apenas uma `pendingAction` validada.
5. Nada muda no OS ainda.
6. Rick revisa o preview e clica `Confirmar`.
7. Só então `applyConfirmedAction` aplica a mudança ao estado vivo do OS.

## Regras

- Nenhuma ação local chama a API.
- Nenhuma ação é aplicada sem confirmação explícita.
- Ações ficam disponíveis apenas em modo ADM.
- Trocar de conversa ou módulo fecha o formulário local pendente.
- Valores e textos inválidos são rejeitados pelos validadores já existentes.
- Voz continua desativada.

## UX

- Bloco compacto `AÇÕES RÁPIDAS` acima do composer quando não houver ação pendente.
- No máximo 3 ações por módulo.
- Formulário inline com apenas os campos necessários.
- Ações de System podem gerar confirmação direto, sem formulário.
