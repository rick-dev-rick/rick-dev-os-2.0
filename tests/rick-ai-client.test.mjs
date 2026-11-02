import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRickAiRequest, parseRickAiResponse } from '../src/rick-ai/client.mjs';

const snapshot = { page: 'finance', modules: { finance: { transactions: 2 } } };

test('buildRickAiRequest trims message and preserves scoped snapshot', () => {
  assert.deepEqual(buildRickAiRequest({ message: '  quanto gastei?  ', page: 'finance', snapshot }), {
    message: 'quanto gastei?',
    page: 'finance',
    snapshot,
  });
});

test('buildRickAiRequest rejects blank and oversized messages', () => {
  assert.throws(() => buildRickAiRequest({ message: '   ', page: 'home', snapshot: {} }), /mensagem válida/i);
  assert.throws(() => buildRickAiRequest({ message: 'x'.repeat(4001), page: 'home', snapshot: {} }), /mensagem válida/i);
});

test('parseRickAiResponse accepts a normal assistant reply', () => {
  assert.deepEqual(parseRickAiResponse({ message: '  Tá sob controle, Rick.  ' }), {
    message: 'Tá sob controle, Rick.',
    pendingAction: null,
    conversationId: null,
  });
});

test('parseRickAiResponse validates pending actions instead of trusting backend payloads', () => {
  assert.throws(
    () => parseRickAiResponse({ message: 'Posso fazer isso.', pendingAction: { type: 'delete_everything', payload: {} } }),
    /não suportada/i,
  );
});

test('parseRickAiResponse rejects malformed backend replies', () => {
  assert.throws(() => parseRickAiResponse(null), /resposta inválida/i);
  assert.throws(() => parseRickAiResponse({ message: '' }), /resposta inválida/i);
});
