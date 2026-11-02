import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const backend = await readFile(new URL('../supabase/functions/rick-ai/index.ts', import.meta.url), 'utf8');
const client = await readFile(new URL('../src/rick-ai/client.mjs', import.meta.url), 'utf8');
const panel = await readFile(new URL('../src/rick-ai/RickAiPanel.jsx', import.meta.url), 'utf8');

test('backend textual permanece sem persistir conversas diretamente', () => {
  assert.doesNotMatch(backend, /from\(['"]rick_ai_messages['"]\)/);
  assert.doesNotMatch(backend, /from\(['"]rick_ai_conversations['"]\)/);
});

test('cliente persiste histórico privado nas tabelas RLS', () => {
  assert.match(client, /from\(['"]rick_ai_conversations['"]\)/);
  assert.match(client, /from\(['"]rick_ai_messages['"]\)/);
  assert.match(client, /\.eq\(['"]owner_id['"],\s*user\.id\)/);
  assert.match(client, /\.limit\(20\)/);
  assert.match(client, /role:\s*['"]user['"]/);
  assert.match(client, /role:\s*['"]assistant['"]/);
});

test('painel manda somente contexto recente junto do snapshot atual', () => {
  assert.match(panel, /\.slice\(-12\)/);
  assert.match(panel, /rickAiRecentConversation/);
  assert.match(panel, /saveRickAiExchange/);
});
