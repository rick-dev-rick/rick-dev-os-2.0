import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile(new URL('../supabase/rick_ai_private.sql', import.meta.url), 'utf8');

test('private Rick IA tables grant Data API access only to authenticated users', () => {
  for (const table of ['rick_ai_profiles', 'rick_ai_conversations', 'rick_ai_messages']) {
    assert.match(sql, new RegExp(`grant\\s+(?:select|select,\\s*insert,\\s*update,\\s*delete)[^;]*on\\s+table\\s+public\\.${table}\\s+to\\s+authenticated`, 'i'));
  }
  assert.doesNotMatch(sql, /grant\s+[^;]+\s+to\s+anon/i);
});

test('all exposed Rick IA tables keep row level security enabled', () => {
  for (const table of ['rick_ai_profiles', 'rick_ai_conversations', 'rick_ai_messages']) {
    assert.match(sql, new RegExp(`alter\\s+table\\s+public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, 'i'));
  }
});
