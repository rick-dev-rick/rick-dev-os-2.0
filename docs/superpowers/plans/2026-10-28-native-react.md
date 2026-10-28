# RICK_DEV OS 2.0 — React como aplicação real

Usuário rejeitou a cópia do 1.0 como entrega. Retirar a cópia da pasta pública e qualquer redirecionamento. A única experiência publicada será React, com estado e eventos dos componentes.

- [x] Entrada React direta; referência original apenas em código/testes, sem rota executável.
- [x] Autenticação React com login ADM/convidado, carregamento automático das listas reais e restauração de sessão.
- [x] Sincronização compatível com os campos existentes via RPC security invoker; comparar valores anteriores dos módulos antes de atualização atômica. RLS e membros ADM continuam inalterados.
- [x] Adaptadores bidirecionais preservam campos antigos e não sobrescrevem módulos não modificados. Cofre e rascunhos permanecem locais; não sincronizar senhas/tokens.
- [x] HOME próximo passo, cuidados e progresso SYSTEM; ações próxima missão/matéria; timer horas/min/seg; histórico/relatório/preferências no SYSTEM. Controles de música em React usando SDKs oficiais quando suportados.
- [x] Testes novos RED→GREEN, testes originais preservados, QA no navegador com dados reais guest; revisão independente; build e publicação privada do React.

Decisão: nenhuma cópia do documento HTML original é carregada pelo produto. A referência fica fora de public/dist e não é um modo alternativo.

Verificação: 104 testes passaram (incluem referência), build passou, dados reais em guest e navegação Finance/Study/Player testados. QA não fez escrita autenticada no banco. Limites documentados em native-react-verification.md.
