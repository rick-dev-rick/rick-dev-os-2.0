# Recuperação dos módulos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Execute sem pausas: usuário pediu execução automática.

**Goal:** Corrigir as omissões do protótipo e recuperar as funções verificadas no 1.0.
**Architecture:** Manter shell React; adicionar componentes focados de Finance, Fit, Study, Lab, Home, System e Music. Modelos puros compartilhados validam registros e backups antes de mutações.
**Tech Stack:** React 19, Vite 6, Lucide, Supabase JS, Prettier.
**Spec:** docs/superpowers/specs/2026-10-28-restore-modules.md

## Global Constraints
- Preservar dados locais existentes e o banco do 1.0; não gravar no banco legado.
- Links abertos ou embutidos aceitam apenas hosts/protocolos esperados.
- Valor inválido não pode apagar dados; erro deve ser visível.

## Review Focus
- Backups anteriores ou malformados.
- Metas vazias/zero e duração/distância inválida.
- Preço brasileiro, centavos e itens comprados.
- URLs perigosas e HTML/código exibido como texto.
- Importação/erros de persistência e guest somente leitura.

### Task 1: Modelos e migração
Files: src/models.mjs, src/data.mjs, tests/models.test.mjs, src/legacy.mjs
Interfaces: normalizeData(raw), validateRecord(kind, raw), shoppingSummary(items), runningSummary(entries, month, goal), importLegacy(backup).
- [x] Escrever testes de valores em centavos, resumo mensal e campos inválidos; executar RED.
- [x] Implementar funções puras e validação de todas as coleções novas; executar npm test GREEN.

### Task 2: Módulos e CRUD
Files: src/components.jsx, src/Finance.jsx, src/Fit.jsx, src/Study.jsx, src/Lab.jsx, src/Home.jsx, src/System.jsx, src/main.jsx, src/style.css.
- [x] CRUD compartilhado com editor acessível, confirmação e erros; integrações usam modelos testados.
- [x] Recuperar formulários/campos/progressos comprovados no spec.
- [x] Estender backup e restauração sem perder coleções antigas.

### Task 3: Acesso e música
Files: src/Access.jsx, src/Music.jsx, src/legacy.mjs.
- [x] Conectar autenticação existente por SDK; validar admin via tabela e importar apenas após confirmação.
- [x] Embeds oficiais Spotify/SoundCloud persistentes; validar URL antes de criar iframe.
- [x] Testar transformações de dados legados e URLs; npm test.

### Task 4: Verificar e entregar
- [x] npm test e npm run build; QA de fluxos no navegador disponível.
- [x] Revisão independente de bugs de perda de dados; corrigir importantes com testes.
- [x] Empacotar fonte exata, atualizar o mesmo Site privado e verificar status.
