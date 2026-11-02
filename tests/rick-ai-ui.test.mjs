import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const main = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8');
const panel = await readFile(new URL('../src/rick-ai/RickAiPanel.jsx', import.meta.url), 'utf8');

test('App importa e renderiza RickAiPanel com o estado vivo do OS', () => {
  assert.match(main, /import RickAiPanel from ["']\.\/rick-ai\/RickAiPanel\.jsx["']/);
  assert.match(main, /<RickAiPanel[\s\S]*data=\{data\}[\s\S]*page=\{page\}[\s\S]*role=\{role\}[\s\S]*setData=\{setData\}[\s\S]*notify=\{notify\}/);
});

test('painel exige confirmação explícita antes de aplicar ação', () => {
  assert.match(panel, /applyConfirmedAction\(data, pendingAction\)/);
  assert.match(panel, /onClick=\{confirmAction\}/);
  assert.match(panel, /Nada foi alterado ainda\./);
  assert.doesNotMatch(panel, /setData\([^)]*reply\.pendingAction/);
});

test('modo convidado não consegue enviar mensagens privadas', () => {
  assert.match(panel, /role !== ['"]admin['"]/);
  assert.match(panel, /Disponível no modo ADM/);
});
