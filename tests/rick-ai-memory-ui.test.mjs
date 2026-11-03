import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const panel = await readFile(new URL('../src/rick-ai/RickAiPanel.jsx', import.meta.url), 'utf8');
const styles = await readFile(new URL('../src/rick-ai/rick-ai.css', import.meta.url), 'utf8');

test('painel carrega memórias privadas e injeta apenas conteúdo útil no snapshot', () => {
  assert.match(panel, /listRickAiMemories/);
  assert.match(panel, /rickAiLongTermMemory/);
  assert.match(panel, /category:\s*memory\.category/);
  assert.match(panel, /content:\s*memory\.content/);
  assert.doesNotMatch(panel, /rickAiLongTermMemory[\s\S]{0,300}owner_id/);
});

test('painel extrai e salva memória somente após mensagem respondida com sucesso', () => {
  assert.match(panel, /extractRickAiMemoryCandidate\(cleanMessage\)/);
  assert.match(panel, /saveRickAiMemory/);
  assert.match(panel, /Memória salva/);
});

test('painel oferece gerenciador de memórias e exclusão explícita', () => {
  assert.match(panel, /Memórias/);
  assert.match(panel, /memoryListOpen/);
  assert.match(panel, /deleteRickAiMemory/);
  assert.match(panel, /Excluir memória/);
  assert.match(styles, /\.rick-ai-memory-list\{/);
});
