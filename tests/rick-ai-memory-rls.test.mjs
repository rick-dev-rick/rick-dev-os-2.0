import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile(new URL('../supabase/rick_ai_private.sql', import.meta.url), 'utf8');

test('SQL versionado cria tabela privada de memórias com deduplicação', () => {
  assert.match(sql, /create table if not exists public\.rick_ai_memories/i);
  assert.match(sql, /unique\s*\(owner_id,\s*normalized_key\)/i);
  assert.match(sql, /category text not null check/i);
});

test('memórias têm RLS, grant autenticado e anon revogado', () => {
  assert.match(sql, /alter table public\.rick_ai_memories enable row level security/i);
  assert.match(sql, /grant select, insert, update, delete on table public\.rick_ai_memories to authenticated/i);
  assert.match(sql, /revoke all on table public\.rick_ai_memories from anon/i);
  assert.match(sql, /create policy ["']rick_ai_memories_admin_own["']/i);
  assert.match(sql, /owner_id = \(select auth\.uid\(\)\)/i);
});
