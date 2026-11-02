import { addTransaction, createId } from '../data.mjs';
import { normalizeData, validateRecord } from '../models.mjs';
export { buildRickAiSnapshot } from './context.mjs';

const SUPPORTED = new Set(['add_task', 'add_project', 'add_transaction']);

function object(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

export function validatePendingAction(raw) {
  if (!object(raw)) throw Error('Ação da Rick IA inválida.');
  if (!SUPPORTED.has(raw.type)) throw Error('Ação da Rick IA não suportada.');
  const payload = object(raw.payload);
  if (!payload) throw Error('Ação da Rick IA sem dados válidos.');

  if (raw.type === 'add_task') {
    const record = validateRecord('tasks', {
      id: createId(),
      title: payload.title,
      description: payload.description || '',
      tag: payload.tag || 'Pessoal',
      module: payload.module || 'study',
      progress: payload.progress ?? 0,
      done: false,
    });
    return {
      type: raw.type,
      payload: record,
      preview: `Adicionar missão: ${record.title}`,
    };
  }

  if (raw.type === 'add_project') {
    const record = validateRecord('projects', {
      id: createId(),
      title: payload.title,
      description: payload.description || '',
      tech: payload.tech || '',
      url: payload.url || '',
      status: payload.status || 'doing',
    });
    return {
      type: raw.type,
      payload: record,
      preview: `Adicionar projeto: ${record.title}`,
    };
  }

  const title = String(payload.title || '').trim();
  const amount = Number(payload.amount);
  const type = payload.type;
  if (!title || !Number.isFinite(amount) || amount <= 0 || !['income', 'expense'].includes(type)) {
    throw Error('Transação sugerida pela Rick IA é inválida.');
  }
  return {
    type: raw.type,
    payload: { title, amount, type },
    preview: `${type === 'income' ? 'Adicionar entrada' : 'Adicionar gasto'}: ${title} — R$ ${amount.toFixed(2)}`,
  };
}

export function applyConfirmedAction(data, rawAction) {
  const action = validatePendingAction(rawAction);
  let next;

  if (action.type === 'add_task') {
    next = { ...data, tasks: [...data.tasks, action.payload] };
  } else if (action.type === 'add_project') {
    next = { ...data, projects: [...data.projects, action.payload] };
  } else {
    next = {
      ...data,
      transactions: addTransaction(data.transactions, action.payload),
    };
  }

  return normalizeData(next);
}
