# RICK OS 2.0 — React

Redesign do painel pessoal com componentes React, identidade grafite/neon, navegação por módulos, login e carregamento automático das listas existentes no Supabase.

```bash
npm install
npm run dev
npm test
npm run build
```

A única entrada publicada é `src/entry.jsx` → `Workspace` → `Login` / `App`. Não existe modo original, redirecionamento ou iframe do aplicativo anterior. A referência em `reference/` não é publicada: serve apenas para os testes de compatibilidade.

## Funcionalidades

- HOME: panorama real, próximos passos, projetos e evolução do sistema.
- STUDY: matérias, missões/progresso, biblioteca com filtros e foco por horas/minutos/segundos.
- FIT: evolução corporal, peso, corrida, ritmo ponderado, metas mensais e edição.
- FINANCE: RICK_PC e RICK_STYLE, categorias, links, modelo e progresso das conquistas. Movimentações do primeiro protótipo continuam em área local.
- LAB: projetos, cofre com favoritos/pesquisa/importação/exportação, notas locais.
- SYSTEM: backup, recuperação, relatório/diagnóstico, histórico e formatação Prettier com preferências.
- Player React: Spotify PKCE/SDK, controles de reprodução e SoundCloud oficial.

## Dados

Login ADM usa a conta e tabela de administradores existentes. Convidados podem ler sem gravar. A sincronização envia apenas módulos alterados para uma função SECURITY INVOKER com as regras RLS existentes e comparação atômica de valores esperados; conflitos não substituem silenciosamente dados de outra tela.

Rascunhos pendentes ficam preservados em uma outbox local. Depois de uma falha e nova entrada, um aviso permite baixar o rascunho ou arquivá-lo antes de continuar. Cópias arquivadas ficam disponíveis no SYSTEM.

Cofre, notas e transações do protótipo são locais; não são enviados ao banco compartilhado. Os backups contêm dados, sem credenciais/tokens.

## Verificação

Ver `docs/native-react-verification.md`. O fluxo guest foi testado com as listas reais. A escrita autenticada ponta a ponta não foi testada: revisão automática bloqueou a simulação de uma sessão ADM no SQL e o teste não foi repetido. A função foi instalada e seus privilégios/RLS e lógica de comparação foram verificados com consultas sem escrita.

A autorização Spotify exige configuração do Client ID/Redirect URI e uma conta com os recursos exigidos pelo serviço. A reprodução autenticada não foi testada pelo agente.

## GitHub Pages

Endereço de publicação: https://rick-dev-rick.github.io/rick-dev-os-2.0/

Em Settings → Pages → Build and deployment → Source, selecione **GitHub Actions**. O workflow `.github/workflows/deploy-pages.yml` testa e publica somente `dist/` a cada push na `main`. Também pode ser iniciado em Actions → Publicar RICK_DEV OS no GitHub Pages → Run workflow.

O caminho base é aplicado automaticamente no GitHub Actions; builds locais e a hospedagem anterior continuam usando `/`. No Spotify Dashboard, cadastre também o Redirect URI `https://rick-dev-rick.github.io/rick-dev-os-2.0/` para usar o player autenticado nesse domínio.
