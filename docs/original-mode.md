# HISTÓRICO — modo original retirado

Este modo foi rejeitado pelo usuário e removido do produto. A aplicação publicada agora abre React diretamente. Os arquivos do 1.0 estão apenas em reference/, fora de public/dist.

# Modo original completo — paridade preservada

A página padrão abre `/original/index.html`, uma cópia da versão atual de `rick-dev-rick/rick-dev-os`, commit `cbf045499974cc2f83215571cc044548f64b92ab`, de 25/10/2026. As telas novas ficam em `/?modo=react`.

Isto é uma ponte de compatibilidade, não uma conversão concluída do original para React.

## Preservado

- Layout, CSS, módulos, botões e dados iniciais originais.
- Login ADM, tabela de permissões e convidado somente leitura.
- Leitura e salvamento originais no Supabase existente.
- Biblioteca, missões, estudos, foco com horas/minutos/segundos.
- Evolução corporal e corrida; RICK_PC e RICK_STYLE; projetos e cofre.
- Progresso do SYSTEM, histórico de exportações, diagnóstico/relatório, configurações Prettier, recuperação validada e cópia preventiva.
- Controles originais de Spotify e SoundCloud, incluindo alternância e aleatório de faixas.
- Arquivos de áudio originais.

## Adaptações de hospedagem

- SDK do Supabase e Prettier são copiados dos pacotes fixados em package-lock.json e servidos localmente.
- O Spotify usa o endereço atual `/original/index.html` como retorno. Esse endereço precisa ser cadastrado no Spotify Developer Dashboard. O código mostra a URL correta em Configurar e mantém o comportamento antigo como fallback nos testes.
- Um seletor discreto abre a prévia React ou o site antigo.
- Os testes originais foram copiados; somente os caminhos de leitura dos arquivos foram ajustados.

## Dados por origem

O banco compartilhado continua sendo o mesmo. Cofre IndexedDB, tokens, Client ID do Spotify, preferências e histórico local pertencem à origem do navegador. A página não pode ler o armazenamento de github.io: o cofre precisa ser exportado no endereço antigo e importado no novo. Nenhuma credencial é copiada entre endereços.

## Validação

90 testes, incluindo as suítes originais de RICK_STYLE, progresso financeiro, SoundCloud e Spotify. QA do banco apenas como convidado: nenhuma alteração de dados na nuvem foi feita pelo agente. Login ADM e autorização Spotify exigem validação do proprietário. Verificação visual mobile não realizada.
