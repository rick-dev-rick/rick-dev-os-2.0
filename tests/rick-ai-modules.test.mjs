import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRickAiSnapshot } from '../src/rick-ai/context.mjs';
import { getRickAiModule, getRickAiSuggestions } from '../src/rick-ai/modules.mjs';

const ids = ['home', 'study', 'fit', 'finance', 'lab', 'system'];

test('Rick IA conhece os seis módulos do OS', () => {
  for (const id of ids) {
    const module = getRickAiModule(id);
    assert.equal(module.id, id);
    assert.ok(module.label);
    assert.ok(module.focus);
    assert.ok(Array.isArray(module.priorities));
    assert.ok(module.priorities.length > 0);
  }
});

test('módulo desconhecido cai em home com segurança', () => {
  assert.equal(getRickAiModule('nao-existe').id, 'home');
  assert.equal(getRickAiModule(null).id, 'home');
});

test('cada módulo oferece no máximo três sugestões contextuais', () => {
  for (const id of ids) {
    const suggestions = getRickAiSuggestions(id);
    assert.ok(suggestions.length > 0 && suggestions.length <= 3);
    assert.equal(new Set(suggestions).size, suggestions.length);
    assert.ok(suggestions.every((item) => typeof item === 'string' && item.trim().length > 0));
  }
});

test('snapshot expõe activeModule sem duplicar dados do módulo', () => {
  const snapshot = buildRickAiSnapshot({
    name: 'Rick',
    focusCount: 0,
    focusSeconds: 1500,
    tasks: [], projects: [], transactions: [], topics: [], resources: [], runs: [], body: [], workouts: [],
    runningGoals: {}, pc: [], style: [], evolution: [], media: [], snippets: [], systemProgress: {},
  }, 'finance');

  assert.deepEqual(snapshot.activeModule, {
    id: 'finance',
    label: 'RICK_FINANCE',
    focus: getRickAiModule('finance').focus,
    priorities: getRickAiModule('finance').priorities,
  });
  assert.equal('transactions' in snapshot.activeModule, false);
});
