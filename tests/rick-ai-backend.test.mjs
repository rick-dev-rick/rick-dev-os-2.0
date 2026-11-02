import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const backend = await readFile(new URL('../supabase/functions/rick-ai/index.ts', import.meta.url), 'utf8');

test('backend suporta modo history e conversa opcional', () => {
  assert.match(backend, /mode\s*===\s*['"]history['"]/);
  assert.match(backend, /conversationId/);
  assert.match(backend, /rick_ai_conversations/);
  assert.match(backend, /rick_ai_messages/);
});

test('backend limita o contexto recente e nunca persiste snapshot', () => {
  assert.match(backend, /limit\(20\)/);
  assert.match(backend, /role:\s*['"]user['"]/);
  assert.match(backend, /role:\s*['"]assistant['"]/);
  assert.doesNotMatch(backend, /insert\([^)]*snapshot/s);
});

test('backend valida conversa pelo owner antes de reutilizar', () => {
  assert.match(backend, /\.eq\(['"]owner_id['"],\s*user\.id\)/);
  assert.match(backend, /\.eq\(['"]id['"],\s*conversationId\)/);
});

test('backend devolve conversationId na resposta final', () => {
  assert.match(backend, /conversationId\s*[,}]/);
});
