import { addTransaction, createId } from '../data.mjs';
import { awardCare } from '../dashboard.mjs';
import { normalizeData, today, validateRecord } from '../models.mjs';
export { buildRickAiSnapshot } from './context.mjs';

const SUPPORTED = new Set([
  'add_task',
  'update_task_progress',
  'complete_task',
  'add_project',
  'update_project_status',
  'add_transaction',
  'delete_transaction',
  'add_workout',
  'add_run',
  'mark_system_care',
]);

function object(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function cleanId(value, label = 'Registro') {
  const id = typeof value === 'string' ? value.trim() : '';
  if (!id || id.length > 100) throw Error(`${label} inválido.`);
  return id;
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
    return { type: raw.type, payload: record, preview: `Adicionar missão: ${record.title}` };
  }

  if (raw.type === 'update_task_progress') {
    const id = cleanId(payload.id, 'Missão');
    const progress = Number(payload.progress);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) throw Error('Progresso da missão inválido.');
    return { type: raw.type, payload: { id, progress }, preview: `Atualizar progresso da missão para ${progress}%` };
  }

  if (raw.type === 'complete_task') {
    const id = cleanId(payload.id, 'Missão');
    return { type: raw.type, payload: { id }, preview: 'Concluir missão selecionada' };
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
    return { type: raw.type, payload: record, preview: `Adicionar projeto: ${record.title}` };
  }

  if (raw.type === 'update_project_status') {
    const id = cleanId(payload.id, 'Projeto');
    const status = payload.status;
    if (!['doing', 'improve', 'later', 'done'].includes(status)) throw Error('Status do projeto inválido.');
    return { type: raw.type, payload: { id, status }, preview: `Alterar status do projeto para ${status}` };
  }

  if (raw.type === 'add_workout') {
    const title = String(payload.title || '').trim();
    if (!title || title.length > 140) throw Error('Treino sugerido pela Rick IA é inválido.');
    return { type: raw.type, payload: { id: createId(), title, done: false }, preview: `Adicionar treino: ${title}` };
  }

  if (raw.type === 'add_run') {
    let record;
    try {
      record = validateRecord('runs', {
        id: createId(),
        date: payload.date,
        distanceKm: payload.distanceKm,
        durationSeconds: payload.durationSeconds,
        type: payload.runType ?? payload.type,
        place: payload.place,
        effort: payload.effort,
        note: payload.note || '',
      });
    } catch {
      throw Error('Dados da corrida estão incompletos ou inválidos.');
    }
    return {
      type: raw.type,
      payload: record,
      preview: `Registrar corrida: ${record.distanceKm} km em ${Math.round(record.durationSeconds / 60)} min`,
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

  if (raw.type === 'delete_transaction') {
    const id = cleanId(payload.id, 'Lançamento');
    return { type: raw.type, payload: { id }, preview: 'Remover lançamento financeiro selecionado' };
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

function findIndexById(rows, id, label) {
  const index = Array.isArray(rows) ? rows.findIndex((item) => item?.id === id) : -1;
  if (index < 0) throw Error(`${label} não encontrada.`);
  return index;
}

export function applyConfirmedAction(data, rawAction) {
  const action = validatePendingAction(rawAction);
  let next;

  if (action.type === 'add_task') {
    next = { ...data, tasks: [...data.tasks, action.payload] };
  } else if (action.type === 'update_task_progress' || action.type === 'complete_task') {
    const index = findIndexById(data.tasks, action.payload.id, 'Missão');
    const current = data.tasks[index];
    const progress = action.type === 'complete_task' ? 100 : action.payload.progress;
    const updated = validateRecord('tasks', { ...current, progress, done: progress === 100 });
    next = { ...data, tasks: data.tasks.map((item, itemIndex) => itemIndex === index ? updated : item) };
  } else if (action.type === 'add_project') {
    next = { ...data, projects: [...data.projects, action.payload] };
  } else if (action.type === 'update_project_status') {
    const index = findIndexById(data.projects, action.payload.id, 'Projeto');
    const updated = validateRecord('projects', { ...data.projects[index], status: action.payload.status });
    next = { ...data, projects: data.projects.map((item, itemIndex) => itemIndex === index ? updated : item) };
  } else if (action.type === 'add_workout') {
    next = { ...data, workouts: [...data.workouts, action.payload] };
  } else if (action.type === 'add_run') {
    next = { ...data, runs: [...data.runs, action.payload] };
  } else if (action.type === 'mark_system_care') {
    next = { ...data, systemProgress: awardCare(data.systemProgress, action.payload.kind, today()) };
  } else if (action.type === 'delete_transaction') {
    findIndexById(data.transactions, action.payload.id, 'Lançamento');
    next = { ...data, transactions: data.transactions.filter((item) => item.id !== action.payload.id) };
  } else {
    next = { ...data, transactions: addTransaction(data.transactions, action.payload) };
  }

  return normalizeData(next);
}
