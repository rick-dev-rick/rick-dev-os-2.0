import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRickAiInsights } from '../src/rick-ai/insights.mjs';

const now = new Date('2026-11-02T20:00:00-03:00');

function snapshot(overrides = {}) {
  return {
    home: { tasks: [] },
    study: { tasks: [] },
    finance: { balance: 100, transactions: [] },
    system: { backupDays: [], diagnosticDays: [] },
    ...overrides,
  };
}

test('saldo negativo gera insight financeiro prioritário', () => {
  const insights = buildRickAiInsights(snapshot({ finance: { balance: -25, transactions: [] } }), now);
  assert.equal(insights[0].type, 'finance');
  assert.match(insights[0].message, /saldo.*negativo/i);
});

test('tarefa quase concluída prioriza a maior porcentagem e ignora concluídas', () => {
  const insights = buildRickAiInsights(snapshot({
    study: { tasks: [
      { id: 'a', title: 'React', progress: 82, done: false },
      { id: 'b', title: 'Portfólio', progress: 95, done: false },
      { id: 'c', title: 'Feita', progress: 100, done: true },
    ] },
  }), now);
  const taskInsight = insights.find((item) => item.type === 'task');
  assert.match(taskInsight.message, /Portfólio/);
  assert.match(taskInsight.message, /95/);
});

test('manutenção só alerta com histórico válido e atraso de pelo menos 7 dias', () => {
  const insights = buildRickAiInsights(snapshot({
    system: { backupDays: ['2026-10-20'], diagnosticDays: ['2026-11-01'] },
  }), now);
  assert.equal(insights.some((item) => item.id === 'system-backup-stale'), true);
  assert.equal(insights.some((item) => item.id === 'system-diagnostic-stale'), false);

  const noHistory = buildRickAiInsights(snapshot({ system: { backupDays: [], diagnosticDays: [] } }), now);
  assert.equal(noHistory.some((item) => item.type === 'system'), false);
});

test('datas inválidas são ignoradas e saldo zero não vira alerta', () => {
  const insights = buildRickAiInsights(snapshot({
    finance: { balance: 0, transactions: [] },
    system: { backupDays: ['banana'], diagnosticDays: ['data ruim'] },
  }), now);
  assert.deepEqual(insights, []);
});

test('motor limita a saída a três insights ordenados por prioridade', () => {
  const insights = buildRickAiInsights(snapshot({
    finance: { balance: -10, transactions: [] },
    study: { tasks: [{ id: 'a', title: 'React', progress: 90, done: false }] },
    system: { backupDays: ['2026-10-01'], diagnosticDays: ['2026-10-01'] },
  }), now);
  assert.equal(insights.length, 3);
  assert.deepEqual([...insights].sort((a, b) => b.priority - a.priority), insights);
});
