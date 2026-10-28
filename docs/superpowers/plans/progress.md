# Execução — recuperar módulos do 1.0

Task 1: complete — modelos e migração; preços em centavos, ritmo ponderado, validação e integridade.
Task 2: complete — interfaces com CRUD nos seis módulos, persistência preservada.
Task 3: complete — acesso/importação Supabase e música; leitura real como convidado verificada no navegador. Login ADM sem credenciais reais permanece não verificado. Sincronização automática não implementada.
Task 4: verificação completa, publicação em andamento — revisão independente concluída; quatro achados corrigidos com testes RED→GREEN, suíte 17/17.

Verificações no navegador: cadastro/edição de produto, preço brasileiro, marcação como comprado e orçamento; corrida 5 km/30 min com 06:00/km; meta mensal; diagnóstico; formatação JavaScript; leitura Supabase como guest; tentativa de editar/abrir restauração em guest bloqueada; reload preserva dados locais anteriores ao guest.

Ruling: integração Supabase importa somente — preservar o esquema e dados do 1.0 enquanto o 2.0 é reconstruído — alterações locais ainda precisam de backup para transferência.
Ruling: revisão visual de celular permanece não verificada nesta sessão — ferramenta não expõe ajuste de viewport — CSS responsivo incluído; não afirmar teste móvel.
