import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePendingAction, applyConfirmedAction } from '../src/rick-ai/contracts.mjs';

function baseData() {
  return {
    name: 'Rick', focusCount: 0, focusSeconds: 1500,
    tasks: [
      { id: 'task-1', title: 'Estudar React', description: '', tag: 'Estudo', module: 'study', progress: 40, done: false },
      { id: 'task-2', title: 'Organizar OS', description: '', tag: 'Pessoal', module: 'home', progress: 20, done: false },
    ],
    topics: [], resources: [], runs: [], body: [], workouts: [], runningGoals: {},
    transactions: [
      { id: 'tx-1', title: 'Almoço', amount: 38, type: 'expense', date: '2026-11-03' },
      { id: 'tx-2', title: 'Salário', amount: 2000, type: 'income', date: '2026-11-03' },
    ],
    pc: [], style: [], projects: [
      { id: 'project-1', title: 'NØVA STREET', description: '', tech: 'React', url: '', status: 'doing' },
    ],
    evolution: [], media: [], snippets: [],
    systemProgress: { backupDays: [], diagnosticDays: [] },
  };
}

test('update_task_progress altera somente a missão alvo e mantém confirmação estruturada', () => {
  const action = validatePendingAction({ type: 'update_task_progress', payload: { id: 'task-1', progress: 90 } });
  assert.match(action.preview, /90%/);
  const next = applyConfirmedAction(baseData(), action);
  assert.equal(next.tasks.find((task) => task.id === 'task-1').progress, 90);
  assert.equal(next.tasks.find((task) => task.id === 'task-2').progress, 20);
});

test('complete_task conclui missão existente em 100%', () => {
  const next = applyConfirmedAction(baseData(), { type: 'complete_task', payload: { id: 'task-1' } });
  const task = next.tasks.find((item) => item.id === 'task-1');
  assert.equal(task.progress, 100);
  assert.equal(task.done, true);
});

test('ação sobre missão inexistente falha sem inventar alvo', () => {
  assert.throws(() => applyConfirmedAction(baseData(), { type: 'complete_task', payload: { id: 'missing' } }), /não encontrada/i);
});

test('delete_transaction remove somente o lançamento pelo ID', () => {
  const next = applyConfirmedAction(baseData(), { type: 'delete_transaction', payload: { id: 'tx-1' } });
  assert.deepEqual(next.transactions.map((item) => item.id), ['tx-2']);
});

test('add_run exige payload completo e adiciona corrida validada', () => {
  const action = validatePendingAction({ type: 'add_run', payload: {
    date: '2026-11-03', distanceKm: 5, durationSeconds: 2400,
    runType: 'mixed', place: 'street', effort: 'moderate', note: 'Treino leve',
  } });
  const next = applyConfirmedAction(baseData(), action);
  assert.equal(next.runs.length, 1);
  assert.equal(next.runs[0].distanceKm, 5);
  assert.equal(next.runs[0].type, 'mixed');
});

test('add_run incompleta é rejeitada antes de aplicar', () => {
  assert.throws(() => validatePendingAction({ type: 'add_run', payload: { distanceKm: 5 } }), /corrida/i);
});

test('update_project_status altera somente projeto existente e valida status', () => {
  const next = applyConfirmedAction(baseData(), { type: 'update_project_status', payload: { id: 'project-1', status: 'done' } });
  assert.equal(next.projects[0].status, 'done');
  assert.throws(() => validatePendingAction({ type: 'update_project_status', payload: { id: 'project-1', status: 'banana' } }), /status/i);
});
