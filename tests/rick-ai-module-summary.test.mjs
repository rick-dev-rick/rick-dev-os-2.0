import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRickAiModuleSummary } from '../src/rick-ai/module-summary.mjs';

function snapshot(page, overrides = {}) {
  return {
    page,
    home: { tasks: [], completedTasks: 0 },
    study: { tasks: [], topics: [], resources: [] },
    fit: { runs: [], body: [], workouts: [], runningGoals: {} },
    finance: { balance: 0, transactions: [], pc: [], style: [] },
    lab: { projects: [], evolution: [], media: [], snippetSummary: [] },
    system: { backupDays: [], diagnosticDays: [] },
    ...overrides,
  };
}

for (const page of ['home', 'study', 'fit', 'finance', 'lab', 'system']) {
  test(`${page} retorna resumo seguro com no máximo três itens`, () => {
    const result = buildRickAiModuleSummary(snapshot(page));
    assert.ok(Array.isArray(result));
    assert.ok(result.length > 0 && result.length <= 3);
    for (const item of result) {
      assert.equal(typeof item.id, 'string');
      assert.equal(typeof item.label, 'string');
      assert.equal(typeof item.value, 'string');
      assert.ok(['neutral', 'good', 'attention'].includes(item.tone));
    }
  });
}

test('finance resume saldo, fluxo e maior gasto recente', () => {
  const result = buildRickAiModuleSummary(snapshot('finance', {
    finance: {
      balance: 850.5,
      transactions: [
        { id: '1', title: 'Salário', amount: 2000, type: 'income', date: '2026-11-01T10:00:00Z' },
        { id: '2', title: 'Aluguel', amount: 600, type: 'expense', date: '2026-11-02T10:00:00Z' },
        { id: '3', title: 'Mercado', amount: 549.5, type: 'expense', date: '2026-11-03T10:00:00Z' },
      ], pc: [], style: [],
    },
  }));
  assert.match(result[0].value, /R\$\s?850,50/);
  assert.ok(result.some((item) => /Entradas.*R\$\s?2\.000,00/.test(item.value) && /saídas.*R\$\s?1\.149,50/i.test(item.value)));
  assert.ok(result.some((item) => /Aluguel|Mercado/.test(item.value)));
});

test('study destaca progresso e missão mais avançada', () => {
  const result = buildRickAiModuleSummary(snapshot('study', {
    study: {
      tasks: [
        { id: '1', title: 'React', progress: 85, done: false },
        { id: '2', title: 'JS', progress: 100, done: true },
      ],
      topics: [{ id: 't1', title: 'Hooks', done: true }, { id: 't2', title: 'State', done: false }],
      resources: [],
    },
  }));
  assert.ok(result.some((item) => /1 aberta/.test(item.value)));
  assert.ok(result.some((item) => /1\/2/.test(item.value)));
  assert.ok(result.some((item) => /React.*85%/.test(item.value)));
});

test('fit soma distância recente e mostra pendências', () => {
  const result = buildRickAiModuleSummary(snapshot('fit', {
    fit: {
      runs: [
        { id: 'r1', date: '2026-11-01', distanceKm: 5 },
        { id: 'r2', date: '2026-11-02', distanceKm: 3.5 },
      ],
      body: [{ id: 'b1', date: '2026-11-02', weight: 109.4, activity: 'peso' }],
      workouts: [{ id: 'w1', title: 'Mobilidade', done: false }],
      runningGoals: {},
    },
  }));
  assert.ok(result.some((item) => /8,5 km/.test(item.value)));
  assert.ok(result.some((item) => /1 pendente/.test(item.value)));
  assert.ok(result.some((item) => /109,4 kg/.test(item.value)));
});

test('lab resume projetos ativos e prioridade', () => {
  const result = buildRickAiModuleSummary(snapshot('lab', {
    lab: {
      projects: [
        { id: 'p1', title: 'Rick IA', status: 'doing' },
        { id: 'p2', title: 'Portfólio', status: 'done' },
      ], evolution: [], media: [], snippetSummary: [],
    },
  }));
  assert.ok(result.some((item) => /1 ativo/.test(item.value)));
  assert.ok(result.some((item) => /Rick IA/.test(item.value)));
});
