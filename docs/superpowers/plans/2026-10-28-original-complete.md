# Recuperação integral do original

Usuário confirmou três problemas: dados/listas, funções/botões e visual original. A migração React 2.1 permanece incompleta; não alterar a UI original para simular paridade.

## Entrega

- Manter uma cópia funcional completa dos arquivos publicados do original (commit cbf0454) em public/original, com seus validadores, handlers, player Spotify/SoundCloud e CSS.
- Abrir essa cópia por padrão, no nível superior, para preservar login/embeds/OAuth/fullscreen; link discreto permite testar as telas React em ?modo=react.
- A cópia usa o Supabase existente, com mesmas regras ADM/convidado e esquema. Não criar migração, não atualizar o banco durante QA. Verificar leitura como convidado.
- Não chamar esse modo de migração completa para React. Dados do cofre, sessões e preferências são específicos por origem; expor orientação curta de transferência do cofre e link para o original publicado.
- Copiar e executar os cinco testes originais, além da suíte React e testes do seletor de modo, para provar que as funções originais não foram descartadas.
- Reutilizar o mesmo Site privado e publicar fonte verificada.

## Etapas

- [x] Seleção de modo e testes RED→GREEN.
- [x] Preservar original e assets; testar funções originais.
- [x] Verificar dados, controles e visual no navegador sem gravar no banco.
- [x] Build, revisão, publicação privada e relato honesto dos limites da migração.
