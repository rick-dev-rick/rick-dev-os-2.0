const KEY_PREFIX = 'rick-ai-change-baseline:';
const MAX_CHANGES = 4;

const list = (value) => Array.isArray(value) ? value : [];
const byId = (rows) => new Map(list(rows).filter((item) => item?.id).map((item) => [item.id, item]));
const money = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const km = (value) => Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const push = (changes, id, message) => { if (changes.length < MAX_CHANGES) changes.push({ id, message }); };

export function buildRickAiChangeSnapshot(snapshot, moduleId = 'home') {
  const id = ['home', 'study', 'fit', 'finance', 'lab', 'system'].includes(moduleId) ? moduleId : 'home';
  const source = snapshot?.[id] || {};

  if (id === 'home') {
    return { tasks: list(source.tasks).map(({ id: taskId, title, progress, done }) => ({ id: taskId, title, progress: Number(progress || 0), done: done === true })) };
  }
  if (id === 'study') {
    return {
      tasks: list(source.tasks).map(({ id: taskId, title, progress, done }) => ({ id: taskId, title, progress: Number(progress || 0), done: done === true })),
      topics: list(source.topics).map(({ id: topicId, title, done }) => ({ id: topicId, title, done: done === true })),
    };
  }
  if (id === 'fit') {
    return {
      runs: list(source.runs).map(({ id: runId, date, distanceKm }) => ({ id: runId, date, distanceKm: Number(distanceKm || 0) })),
      workouts: list(source.workouts).map(({ id: workoutId, title, done }) => ({ id: workoutId, title, done: done === true })),
      body: list(source.body).map(({ id: bodyId, date, weight }) => ({ id: bodyId, date, weight: weight == null ? null : Number(weight) })),
    };
  }
  if (id === 'finance') {
    return {
      balance: Number(source.balance || 0),
      transactions: list(source.transactions).map(({ id: transactionId, title, amount, type, date }) => ({ id: transactionId, title, amount: Number(amount || 0), type, date })),
    };
  }
  if (id === 'lab') {
    return { projects: list(source.projects).map(({ id: projectId, title, status }) => ({ id: projectId, title, status })) };
  }
  return {
    backupDays: [...list(source.backupDays)],
    diagnosticDays: [...list(source.diagnosticDays)],
  };
}

function taskChanges(beforeRows, afterRows, changes, prefix = 'task') {
  const before = byId(beforeRows);
  for (const task of list(afterRows)) {
    const old = before.get(task.id);
    if (!old) {
      push(changes, `${prefix}-new-${task.id}`, `Nova missão: ${task.title}.`);
      continue;
    }
    if (!old.done && task.done) {
      push(changes, `${prefix}-done-${task.id}`, `Missão concluída: ${task.title}.`);
      continue;
    }
    if (Number(task.progress || 0) > Number(old.progress || 0)) {
      push(changes, `${prefix}-progress-${task.id}`, `${task.title} avançou de ${Number(old.progress || 0)}% para ${Number(task.progress || 0)}%.`);
    }
  }
}

export function diffRickAiChanges(previous, current, moduleId = 'home') {
  if (!previous || !current) return [];
  const id = ['home', 'study', 'fit', 'finance', 'lab', 'system'].includes(moduleId) ? moduleId : 'home';
  const changes = [];

  if (id === 'home') {
    taskChanges(previous.tasks, current.tasks, changes, 'home');
    return changes;
  }

  if (id === 'study') {
    taskChanges(previous.tasks, current.tasks, changes, 'study');
    const oldTopics = byId(previous.topics);
    for (const topic of list(current.topics)) {
      const old = oldTopics.get(topic.id);
      if (old && !old.done && topic.done) push(changes, `topic-done-${topic.id}`, `Tópico concluído: ${topic.title}.`);
    }
    return changes;
  }

  if (id === 'fit') {
    const oldRuns = byId(previous.runs);
    const newRuns = list(current.runs).filter((run) => !oldRuns.has(run.id));
    if (newRuns.length) {
      const distance = newRuns.reduce((sum, run) => sum + Number(run.distanceKm || 0), 0);
      push(changes, 'fit-runs', `${newRuns.length} nova${newRuns.length > 1 ? 's' : ''} corrida${newRuns.length > 1 ? 's' : ''}: +${km(distance)} km.`);
    }
    const oldWorkouts = byId(previous.workouts);
    for (const workout of list(current.workouts)) {
      const old = oldWorkouts.get(workout.id);
      if (old && !old.done && workout.done) push(changes, `workout-done-${workout.id}`, `Treino concluído: ${workout.title}.`);
    }
    const beforeWeight = [...list(previous.body)].reverse().find((item) => Number.isFinite(item.weight))?.weight;
    const afterWeight = [...list(current.body)].reverse().find((item) => Number.isFinite(item.weight))?.weight;
    if (Number.isFinite(beforeWeight) && Number.isFinite(afterWeight) && beforeWeight !== afterWeight) {
      push(changes, 'fit-weight', `Último peso mudou de ${km(beforeWeight)} kg para ${km(afterWeight)} kg.`);
    }
    return changes;
  }

  if (id === 'finance') {
    if (Number(previous.balance || 0) !== Number(current.balance || 0)) {
      const delta = Number(current.balance || 0) - Number(previous.balance || 0);
      push(changes, 'finance-balance', `Saldo mudou ${delta >= 0 ? '+' : ''}${money(delta)} e agora está em ${money(current.balance)}.`);
    }
    const oldTransactions = byId(previous.transactions);
    const fresh = list(current.transactions).filter((transaction) => !oldTransactions.has(transaction.id));
    for (const transaction of fresh.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))) {
      push(changes, `finance-transaction-${transaction.id}`, `${transaction.type === 'income' ? 'Nova entrada' : 'Novo gasto'}: ${transaction.title} — ${money(transaction.amount)}.`);
    }
    return changes;
  }

  if (id === 'lab') {
    const oldProjects = byId(previous.projects);
    for (const project of list(current.projects)) {
      const old = oldProjects.get(project.id);
      if (!old) {
        push(changes, `project-new-${project.id}`, `Novo projeto: ${project.title}.`);
        continue;
      }
      if (old.status !== project.status) push(changes, `project-status-${project.id}`, `${project.title} mudou de ${old.status} para ${project.status}.`);
    }
    return changes;
  }

  const oldBackups = new Set(list(previous.backupDays));
  const oldDiagnostics = new Set(list(previous.diagnosticDays));
  const newBackups = list(current.backupDays).filter((day) => !oldBackups.has(day));
  const newDiagnostics = list(current.diagnosticDays).filter((day) => !oldDiagnostics.has(day));
  if (newBackups.length) push(changes, 'system-backup', `Backup registrado em ${newBackups.at(-1)}.`);
  if (newDiagnostics.length) push(changes, 'system-diagnostic', `Diagnóstico registrado em ${newDiagnostics.at(-1)}.`);
  return changes;
}

export function loadRickAiChangeBaseline(moduleId, storage = globalThis.localStorage) {
  try {
    if (!storage?.getItem) return null;
    const raw = storage.getItem(`${KEY_PREFIX}${moduleId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function saveRickAiChangeBaseline(moduleId, snapshot, storage = globalThis.localStorage) {
  try {
    if (!storage?.setItem) return false;
    storage.setItem(`${KEY_PREFIX}${moduleId}`, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}
