import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRickAiChangeSnapshot,
  diffRickAiChanges,
  loadRickAiChangeBaseline,
  saveRickAiChangeBaseline,
} from '../src/rick-ai/changes.mjs';

function snapshot() {
  return {
    home: { tasks: [{ id: 'h1', title: 'Arrumar quarto', progress: 20, done: false }] },
    study: {
      tasks: [{ id: 's1', title: 'React', progress: 40, done: false }],
      topics: [{ id: 't1', title: 'Hooks', done: false }],
    },
    fit: {
      runs: [{ id: 'r1', date: '2026-11-01', distanceKm: 5 }],
      workouts: [{ id: 'w1', title: 'Mobilidade', done: false }],
      body: [{ id: 'b1', date: '2026-11-01', weight: 110 }],
    },
    finance: {
      balance: 100,
      transactions: [{ id: 'f1', title: 'Salário', amount: 100, type: 'income', date: '2026-11-01T12:00:00Z' }],
    },
    lab: { projects: [{ id: 'p1', title: 'OS', status: 'doing' }] },
    system: { backupDays: ['2026-11-01'], diagnosticDays: [] },
  };
}

test('compacta apenas os dados necessários do módulo', () => {
  const current = snapshot();
  const compact = buildRickAiChangeSnapshot(current, 'finance');
  assert.deepEqual(compact, {
    balance: 100,
    transactions: [{ id: 'f1', title: 'Salário', amount: 100, type: 'income', date: '2026-11-01T12:00:00Z' }],
  });
  assert.equal('home' in compact, false);
});

test('detecta progresso e conclusão de missão em home', () => {
  const before = buildRickAiChangeSnapshot(snapshot(), 'home');
  const current = snapshot();
  current.home.tasks[0].progress = 100;
  current.home.tasks[0].done = true;
  const after = buildRickAiChangeSnapshot(current, 'home');
  const changes = diffRickAiChanges(before, after, 'home');
  assert.ok(changes.some((item) => /conclu/i.test(item.message)));
});

test('detecta tópico concluído em study', () => {
  const before = buildRickAiChangeSnapshot(snapshot(), 'study');
  const current = snapshot();
  current.study.topics[0].done = true;
  const after = buildRickAiChangeSnapshot(current, 'study');
  assert.ok(diffRickAiChanges(before, after, 'study').some((item) => /Hooks/.test(item.message)));
});

test('detecta nova corrida e distância adicionada em fit', () => {
  const before = buildRickAiChangeSnapshot(snapshot(), 'fit');
  const current = snapshot();
  current.fit.runs.push({ id: 'r2', date: '2026-11-02', distanceKm: 6.3 });
  const after = buildRickAiChangeSnapshot(current, 'fit');
  const changes = diffRickAiChanges(before, after, 'fit');
  assert.ok(changes.some((item) => /6,3|6\.3/.test(item.message)));
});

test('detecta variação de saldo e novo gasto em finance', () => {
  const before = buildRickAiChangeSnapshot(snapshot(), 'finance');
  const current = snapshot();
  current.finance.balance = 68;
  current.finance.transactions.push({ id: 'f2', title: 'Uber', amount: 32, type: 'expense', date: '2026-11-02T15:00:00Z' });
  const after = buildRickAiChangeSnapshot(current, 'finance');
  const changes = diffRickAiChanges(before, after, 'finance');
  assert.ok(changes.some((item) => /saldo/i.test(item.message)));
  assert.ok(changes.some((item) => /Uber/.test(item.message)));
});

test('detecta mudança de status e novo projeto em lab', () => {
  const before = buildRickAiChangeSnapshot(snapshot(), 'lab');
  const current = snapshot();
  current.lab.projects[0].status = 'done';
  current.lab.projects.push({ id: 'p2', title: 'NØVA', status: 'doing' });
  const after = buildRickAiChangeSnapshot(current, 'lab');
  const changes = diffRickAiChanges(before, after, 'lab');
  assert.ok(changes.some((item) => /OS/.test(item.message)));
  assert.ok(changes.some((item) => /NØVA/.test(item.message)));
});

test('detecta novo backup e diagnóstico em system', () => {
  const before = buildRickAiChangeSnapshot(snapshot(), 'system');
  const current = snapshot();
  current.system.backupDays.push('2026-11-02');
  current.system.diagnosticDays.push('2026-11-02');
  const after = buildRickAiChangeSnapshot(current, 'system');
  const changes = diffRickAiChanges(before, after, 'system');
  assert.ok(changes.some((item) => /backup/i.test(item.message)));
  assert.ok(changes.some((item) => /diagnóstico/i.test(item.message)));
});

test('retorna no máximo quatro mudanças relevantes', () => {
  const before = { balance: 100, transactions: [] };
  const after = {
    balance: 0,
    transactions: Array.from({ length: 8 }, (_, i) => ({ id: `x${i}`, title: `Gasto ${i}`, amount: 10 + i, type: 'expense', date: `2026-11-02T1${i}:00:00Z` })),
  };
  assert.ok(diffRickAiChanges(before, after, 'finance').length <= 4);
});

test('baseline local é separado por módulo e tolera JSON inválido', () => {
  const map = new Map();
  const storage = {
    getItem: (key) => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, value),
  };
  const base = { balance: 10, transactions: [] };
  saveRickAiChangeBaseline('finance', base, storage);
  assert.deepEqual(loadRickAiChangeBaseline('finance', storage), base);
  assert.equal(loadRickAiChangeBaseline('study', storage), null);
  map.set('rick-ai-change-baseline:finance', '{ruim');
  assert.equal(loadRickAiChangeBaseline('finance', storage), null);
});

test('storage indisponível não quebra a Rick IA', () => {
  const broken = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  assert.equal(loadRickAiChangeBaseline('home', broken), null);
  assert.equal(saveRickAiChangeBaseline('home', { tasks: [] }, broken), false);
});
