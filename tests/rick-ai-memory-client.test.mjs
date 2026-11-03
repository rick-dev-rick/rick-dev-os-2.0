import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseRickAiMemories } from '../src/rick-ai/client.mjs';

const clientSource = await readFile(new URL('../src/rick-ai/client.mjs', import.meta.url), 'utf8');

test('parseRickAiMemories normaliza apenas registros válidos', () => {
  assert.deepEqual(parseRickAiMemories([
    { id: 'a', category: 'goal', content: '  Minha meta é aprender React.  ', created_at: '2026-11-03T00:00:00Z' },
    { id: 'b', category: 'decision', content: 'Decidi manter o OS em React.', created_at: null },
    { id: '', category: 'goal', content: 'ignorar', created_at: null },
    { id: 'c', category: 'x', content: '', created_at: null },
  ]), [
    { id: 'a', category: 'goal', content: 'Minha meta é aprender React.', createdAt: '2026-11-03T00:00:00Z' },
    { id: 'b', category: 'decision', content: 'Decidi manter o OS em React.', createdAt: null },
  ]);
});

test('cliente oferece listagem, save e delete escopados ao owner autenticado', () => {
  assert.match(clientSource, /export async function listRickAiMemories/);
  assert.match(clientSource, /export async function saveRickAiMemory/);
  assert.match(clientSource, /export async function deleteRickAiMemory/);
  assert.match(clientSource, /from\(['"]rick_ai_memories['"]\)/);
  assert.match(clientSource, /eq\(['"]owner_id['"], user\.id\)/);
  assert.match(clientSource, /normalized_key/);
});
