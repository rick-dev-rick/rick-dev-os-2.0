import { validatePendingAction } from './contracts.mjs';

const ACTIONS = {
  home: [
    { id: 'add_task', label: 'Adicionar missão', fields: ['title'] },
  ],
  study: [
    { id: 'add_task', label: 'Nova missão de estudo', fields: ['title'] },
  ],
  fit: [
    { id: 'add_workout', label: 'Adicionar treino', fields: ['title'] },
  ],
  finance: [
    { id: 'add_expense', label: 'Registrar gasto', fields: ['title', 'amount'] },
    { id: 'add_income', label: 'Registrar entrada', fields: ['title', 'amount'] },
  ],
  lab: [
    { id: 'add_project', label: 'Adicionar projeto', fields: ['title'] },
  ],
  system: [
    { id: 'mark_backup', label: 'Registrar backup', fields: [] },
    { id: 'mark_diagnostic', label: 'Registrar diagnóstico', fields: [] },
  ],
};

export function getRickAiModuleActions(page = 'home') {
  return ACTIONS[page] || ACTIONS.home;
}

export function buildRickAiLocalAction(actionId, fields = {}, page = 'home') {
  if (actionId === 'add_task') {
    return validatePendingAction({
      type: 'add_task',
      payload: {
        title: fields.title,
        description: fields.description || '',
        tag: fields.tag || (page === 'study' ? 'Estudo' : 'Pessoal'),
        module: page === 'study' ? 'study' : 'home',
        progress: 0,
      },
    });
  }

  if (actionId === 'add_workout') {
    return validatePendingAction({ type: 'add_workout', payload: { title: fields.title } });
  }

  if (actionId === 'add_expense' || actionId === 'add_income') {
    return validatePendingAction({
      type: 'add_transaction',
      payload: {
        title: fields.title,
        amount: Number(String(fields.amount || '').replace(',', '.')),
        type: actionId === 'add_expense' ? 'expense' : 'income',
      },
    });
  }

  if (actionId === 'add_project') {
    return validatePendingAction({
      type: 'add_project',
      payload: {
        title: fields.title,
        description: fields.description || '',
        tech: fields.tech || '',
        url: fields.url || '',
        status: 'doing',
      },
    });
  }

  if (actionId === 'mark_backup' || actionId === 'mark_diagnostic') {
    return validatePendingAction({
      type: 'mark_system_care',
      payload: { kind: actionId === 'mark_backup' ? 'backupDays' : 'diagnosticDays' },
    });
  }

  throw Error('Ação rápida da Rick IA não suportada.');
}
