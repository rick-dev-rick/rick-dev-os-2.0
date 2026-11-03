# Mobile Layout Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Corrigir sobreposições e overflow no mobile sem alterar o desktop.

**Architecture:** Adicionar uma folha `src/mobile.css` carregada depois de `style.css`, contendo apenas overrides responsivos. Isso evita mexer na stylesheet principal minificada e reduz risco de regressão.

**Tech Stack:** React, Vite, CSS, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-03-mobile-layout-fix.md`

## Global Constraints
- Não alterar lógica de dados.
- Não redesenhar desktop.
- Não criar componentes novos.
- Usar apenas classes já existentes.

### Task 1: Regras responsivas
- [ ] Criar teste que exige import de `mobile.css` e regras para Home, safe-area, music dock e launcher.
- [ ] Rodar RED.
- [ ] Criar `src/mobile.css` e importar depois de `style.css`.
- [ ] Rodar testes e build.

### Task 2: Publicação
- [ ] Abrir PR.
- [ ] Mesclar após CI verde.
- [ ] Confirmar deploy do GitHub Pages no SHA final.
