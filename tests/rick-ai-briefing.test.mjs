import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRickAiBriefing } from '../src/rick-ai/briefing.mjs';

const baseSnapshot = {
  page: 'home',
  finance: { balance: 100 },
  lab: { projects: [] },
  system: { backupDays: [], diagnosticDays: [] },
};

test('usa a prioridade principal como foco atual', () => {
  const result = buildRickAiBriefing(baseSnapshot, [
    { id: 'project-1', bucket: 'agora', title: 'Finalizar portfólio', reason: 'Projeto ativo e prioritário.', module: 'lab' },
    { id: 'task-2', bucket: 'depois', title: 'Estudar React', reason: 'Missão aberta.', module: 'study' },
  ], [], []);

  assert.equal(result.focus.title, 'Finalizar portfólio');
  assert.equal(result.focus.module, 'lab');
  assert.match(result.focus.reason, /prioritário/i);
  assert.ok(result.signals.some((item) => /Estudar React/.test(item.text)));
});

test('não duplica insight que representa a mesma prioridade', () => {
  const result = buildRickAiBriefing(baseSnapshot, [
    { id: 'finance-negative-balance', bucket: 'agora', title: 'Saldo financeiro negativo', reason: 'Estabilizar saldo.', module: 'finance' },
  ], [
    { id: 'finance-negative-balance', type: 'finance', priority: 100, message: 'Saldo negativo.' },
    { id: 'system-backup-stale', type: 'system', priority: 60, message: 'Backup atrasado.' },
  ], []);

  assert.equal(result.signals.some((item) => item.id === 'finance-negative-balance'), false);
  assert.equal(result.signals.some((item) => item.id === 'system-backup-stale'), true);
});

test('resume no máximo duas mudanças recentes', () => {
  const changes = [
    { id: 'c1', message: 'Missão A concluída.' },
    { id: 'c2', message: 'Novo gasto registrado.' },
    { id: 'c3', message: 'Projeto B mudou de status.' },
  ];
  const result = buildRickAiBriefing(baseSnapshot, [], [], changes);
  assert.equal(result.changes.length, 2);
  assert.deepEqual(result.changes.map((item) => item.id), ['c1', 'c2']);
  assert.equal(result.totalChanges, 3);
});

test('snapshot vazio não inventa foco ou alerta', () => {
  const result = buildRickAiBriefing({}, [], [], []);
  assert.equal(result.focus, null);
  assert.deepEqual(result.signals, []);
  assert.deepEqual(result.changes, []);
  assert.match(result.conclusion, /nenhuma prioridade urgente/i);
});

test('conclusão destaca o foco principal quando existe', () => {
  const result = buildRickAiBriefing(baseSnapshot, [
    { id: 'task-1', bucket: 'agora', title: 'Concluir missão React', reason: 'Está em 90%.', module: 'study' },
  ], [], []);
  assert.match(result.conclusion, /Concluir missão React/);
});
