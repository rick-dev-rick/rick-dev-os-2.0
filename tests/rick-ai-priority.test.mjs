import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRickAiPriorities } from '../src/rick-ai/priority.mjs';

const now = new Date('2026-11-03T12:00:00-03:00');

function snapshot(overrides = {}) {
  return {
    home: { tasks: [] },
    study: { tasks: [] },
    finance: { balance: 0, transactions: [] },
    lab: { projects: [] },
    system: { backupDays: [], diagnosticDays: [] },
    ...overrides,
  };
}

test('saldo negativo vence tarefa quase concluída e manutenção atrasada', () => {
  const result = buildRickAiPriorities(snapshot({
    finance: { balance: -120, transactions: [] },
    study: { tasks: [{ id: 't1', title: 'Portfólio', progress: 95, done: false }] },
    system: { backupDays: ['2026-10-20'], diagnosticDays: [] },
  }), [], now);

  assert.equal(result[0].module, 'finance');
  assert.match(result[0].title, /saldo|finance/i);
  assert.equal(result[0].bucket, 'agora');
});

test('memória de prioridade reforça projeto real citado sem criar item fantasma', () => {
  const memories = [{ category: 'priority', content: 'Minha prioridade é terminar o Portfólio antes de outro projeto.' }];
  const result = buildRickAiPriorities(snapshot({
    lab: { projects: [
      { id: 'p1', title: 'Portfólio', status: 'doing' },
      { id: 'p2', title: 'NØVA STREET', status: 'doing' },
    ] },
  }), memories, now);

  assert.match(result[0].title, /Portfólio/);
  assert.match(result[0].reason, /prioridade|memória/i);

  const ghost = buildRickAiPriorities(snapshot({ lab: { projects: [] } }), memories, now);
  assert.equal(ghost.some((item) => /Portfólio/.test(item.title)), false);
});

test('tarefas concluídas são ignoradas e progresso alto ganha peso', () => {
  const result = buildRickAiPriorities(snapshot({
    home: { tasks: [
      { id: 'a', title: 'Feita', progress: 100, done: true },
      { id: 'b', title: 'Quase lá', progress: 88, done: false },
      { id: 'c', title: 'Começando', progress: 20, done: false },
    ] },
  }), [], now);

  assert.equal(result.some((item) => item.title === 'Feita'), false);
  assert.equal(result[0].title, 'Quase lá');
});

test('backup atrasado entra no ranking e data inválida é ignorada', () => {
  const stale = buildRickAiPriorities(snapshot({ system: { backupDays: ['2026-10-20'], diagnosticDays: [] } }), [], now);
  assert.equal(stale.some((item) => item.module === 'system' && /backup/i.test(item.title)), true);

  const invalid = buildRickAiPriorities(snapshot({ system: { backupDays: ['banana'], diagnosticDays: ['data ruim'] } }), [], now);
  assert.equal(invalid.some((item) => item.module === 'system'), false);
});

test('saída tem no máximo três itens, buckets estáveis e estado vazio real', () => {
  const result = buildRickAiPriorities(snapshot({
    home: { tasks: [{ id: 'h1', title: 'Home', progress: 10, done: false }] },
    study: { tasks: [{ id: 's1', title: 'Study', progress: 10, done: false }] },
    lab: { projects: [{ id: 'p1', title: 'Lab', status: 'doing' }] },
    system: { backupDays: ['2026-10-01'], diagnosticDays: ['2026-10-01'] },
  }), [], now);

  assert.equal(result.length, 3);
  assert.deepEqual(result.map((item) => item.bucket), ['agora', 'depois', 'pode_esperar']);
  assert.deepEqual(buildRickAiPriorities(snapshot(), [], now), []);
});
