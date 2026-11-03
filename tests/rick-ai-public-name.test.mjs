import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const panel = await readFile(new URL('../src/rick-ai/RickAiPanel.jsx', import.meta.url), 'utf8');

test('interface pública usa somente RICK AI como nome da assistente', () => {
  assert.match(panel, />RICK AI</);
  assert.match(panel, /RICK AI NOTOU/);
  assert.match(panel, /BRIEFING DA RICK AI/);
  assert.match(panel, /RICK AI \/ \{activeModule\.label\}/);
  assert.match(panel, /A RICK AI QUER ALTERAR O OS/);
  assert.match(panel, /Abrir RICK AI/);
  assert.doesNotMatch(panel, /Daiane|DAIANE/);
});
