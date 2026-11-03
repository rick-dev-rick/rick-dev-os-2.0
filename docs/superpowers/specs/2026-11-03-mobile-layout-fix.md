# Correção cirúrgica do mobile

## Objetivo
Corrigir sobreposições e excesso de largura/altura no RICK_DEV OS 2.0 em telas pequenas sem redesenhar o desktop.

## Escopo
- Home em uma coluna onde necessário.
- Cards e painéis sem overflow horizontal.
- Header e conteúdo respeitando safe area.
- `overview-metrics` mais legível em 1 coluna em telas muito estreitas.
- `next-grid`, `home-projects` e `evolution-board` adaptados ao mobile.
- Music dock sem colidir com o launcher da assistente.
- Launcher da assistente compacto no mobile e deslocado para não cobrir o music dock.
- Painel da assistente continua full-screen-ish no mobile.

## Não objetivos
- Não alterar desktop.
- Não alterar lógica de dados.
- Não criar novos componentes.
- Não trocar identidade visual.
