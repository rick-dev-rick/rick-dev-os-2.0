import { addTransaction, createId } from '../data.mjs';
import { awardCare } from '../dashboard.mjs';
import { normalizeData, today, validateRecord } from '../models.mjs';
export { buildRickAiSnapshot } from './context.mjs';

const SUPPORTED = new Set(['add_task', 'add_project', 'add_transaction', 'add_workout', 'mark_system_care']);

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

  if (raw.type === 'add_workout') {
    const title = String(payload.title || '').trim();
    if (!title || title.length > 140) throw Error('Treino sugerido pela Rick IA é inválido.');
    return {
      type: raw.type,
      payload: { id: createId(), title, done: false },
      preview: `Adicionar treino: ${title}`,
    };
  }

  if (raw.type === 'mark_system_care') {
    const kind = payload.kind;
    if (!['backupDays', 'diagnosticDays'].includes(kind)) throw Error('Cuidado do System inválido.');
    return {
      type: raw.type,
      payload: { kind },
      preview: kind === 'backupDays' ? 'Registrar backup de hoje' : 'Registrar diagnóstico de hoje',
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
  } else if (action.type === 'add_workout') {
    next = { ...data, workouts: [...data.workouts, action.payload] };
  } else if (action.type === 'mark_system_care') {
    next = {
      ...data,
      systemProgress: awardCare(data.systemProgress, action.payload.kind, today()),
    };
  } else {
    next = {
      ...data,
      transactions: addTransaction(data.transactions, action.payload),
    };
  }

  return normalizeData(next);
}
