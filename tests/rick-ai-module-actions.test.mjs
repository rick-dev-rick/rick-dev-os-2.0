import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialData, today } from '../src/models.mjs';
import { applyConfirmedAction, validatePendingAction } from '../src/rick-ai/contracts.mjs';
import { buildRickAiLocalAction, getRickAiModuleActions } from '../src/rick-ai/module-actions.mjs';

test('contrato valida treino simples antes de confirmar', () => {
  const action = validatePendingAction({ type: 'add_workout', payload: { title: 'Mobilidade 20 min' } });
  assert.equal(action.type, 'add_workout');
  assert.equal(action.payload.title, 'Mobilidade 20 min');
  assert.equal(action.payload.done, false);
  assert.match(action.preview, /Adicionar treino/);
});

test('contrato registra cuidado do System sem duplicar o mesmo dia', () => {
  const currentDay = today();
  const base = {
    ...initialData,
    systemProgress: { backupDays: [currentDay], diagnosticDays: [] },
  };
  const action = validatePendingAction({ type: 'mark_system_care', payload: { kind: 'backupDays' } });
  assert.equal(action.payload.kind, 'backupDays');
  const next = applyConfirmedAction(base, action);
  assert.deepEqual(next.systemProgress.backupDays, [currentDay]);
});

test('contrato rejeita cuidado desconhecido do System', () => {
  assert.throws(
    () => validatePendingAction({ type: 'mark_system_care', payload: { kind: 'hackDays' } }),
    /inválid|suportad/i,
  );
});

test('cada módulo oferece ações rápidas coerentes e no máximo três', () => {
  const expected = {
    home: ['add_task'],
    study: ['add_task'],
    fit: ['add_workout'],
    finance: ['add_expense', 'add_income'],
    lab: ['add_project'],
    system: ['mark_backup', 'mark_diagnostic'],
  };

  for (const [page, ids] of Object.entries(expected)) {
    const actions = getRickAiModuleActions(page);
    assert.ok(actions.length > 0 && actions.length <= 3);
    assert.deepEqual(actions.map((item) => item.id), ids);
  }
});

test('catálogo usa home como fallback seguro', () => {
  assert.deepEqual(getRickAiModuleActions('desconhecido').map((item) => item.id), ['add_task']);
});

test('builder cria pendingAction local usando o módulo atual', () => {
  const studyTask = buildRickAiLocalAction('add_task', { title: 'Revisar React' }, 'study');
  assert.equal(studyTask.type, 'add_task');
  assert.equal(studyTask.payload.module, 'study');

  const expense = buildRickAiLocalAction('add_expense', { title: 'Uber', amount: '32.50' }, 'finance');
  assert.equal(expense.type, 'add_transaction');
  assert.equal(expense.payload.type, 'expense');
  assert.equal(expense.payload.amount, 32.5);

  const backup = buildRickAiLocalAction('mark_backup', {}, 'system');
  assert.equal(backup.type, 'mark_system_care');
  assert.equal(backup.payload.kind, 'backupDays');
});
