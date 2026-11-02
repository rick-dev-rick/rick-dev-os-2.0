import test from 'node:test';
import assert from 'node:assert/strict';
import { initialData } from '../src/models.mjs';
import {
  buildRickAiSnapshot,
  validatePendingAction,
  applyConfirmedAction,
} from '../src/rick-ai/contracts.mjs';

function fixture() {
  return {
    ...structuredClone(initialData),
    name: 'Rick',
    tasks: [
      { id: 't1', title: 'Estudar React', description: 'Hooks', tag: 'ADS', module: 'study', progress: 25, done: false },
    ],
    projects: [
      { id: 'p1', title: 'RICK_DEV OS 2.0', description: 'Sistema pessoal', tech: 'React', url: '', status: 'doing' },
    ],
    transactions: [
      { id: 'm1', title: 'Salário', amount: 2000, type: 'income', date: '2026-11-01T12:00:00.000Z' },
      { id: 'm2', title: 'Mercado', amount: 100, type: 'expense', date: '2026-11-01T13:00:00.000Z' },
    ],
    notes: 'texto privado grande que não deve ir no snapshot padrão',
    snippets: [{ id: 's1', title: 'Segredo', language: 'js', category: '', description: '', code: 'private()', notes: '', favorite: false }],
  };
}

test('buildRickAiSnapshot exposes useful module context without raw notes or snippet code', () => {
  const snapshot = buildRickAiSnapshot(fixture(), 'finance');
  assert.equal(snapshot.page, 'finance');
  assert.equal(snapshot.profile.name, 'Rick');
  assert.equal(snapshot.finance.balance, 1900);
  assert.equal(snapshot.study.tasks[0].title, 'Estudar React');
  assert.equal(snapshot.lab.projects[0].title, 'RICK_DEV OS 2.0');
  assert.equal('notes' in snapshot, false);
  assert.equal(JSON.stringify(snapshot).includes('private()'), false);
});

test('validatePendingAction rejects unsupported action types', () => {
  assert.throws(
    () => validatePendingAction({ type: 'delete_everything', payload: {} }),
    /não suportada/i,
  );
});

test('applyConfirmedAction adds a task without mutating the original state', () => {
  const data = fixture();
  const action = validatePendingAction({
    type: 'add_task',
    payload: {
      title: 'Revisar React',
      description: '30 minutos',
      tag: 'ADS',
      module: 'study',
      progress: 0,
    },
  });
  const next = applyConfirmedAction(data, action);
  assert.equal(data.tasks.length, 1);
  assert.equal(next.tasks.length, 2);
  assert.equal(next.tasks.at(-1).title, 'Revisar React');
});

test('applyConfirmedAction adds a project through existing validation rules', () => {
  const data = fixture();
  const action = validatePendingAction({
    type: 'add_project',
    payload: {
      title: 'Rick IA',
      description: 'Assistente do OS',
      tech: 'React + Supabase',
      url: '',
      status: 'doing',
    },
  });
  const next = applyConfirmedAction(data, action);
  assert.equal(next.projects.at(-1).title, 'Rick IA');
  assert.equal(next.projects.at(-1).status, 'doing');
});

test('applyConfirmedAction adds a finance transaction only after explicit application', () => {
  const data = fixture();
  const action = validatePendingAction({
    type: 'add_transaction',
    payload: { title: 'Gasolina', amount: 35, type: 'expense' },
  });
  assert.equal(data.transactions.length, 2);
  const next = applyConfirmedAction(data, action);
  assert.equal(data.transactions.length, 2);
  assert.equal(next.transactions.length, 3);
  assert.equal(next.transactions.at(-1).title, 'Gasolina');
});
