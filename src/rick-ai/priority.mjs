const BUCKETS = ['agora', 'depois', 'pode_esperar'];
const MEMORY_WEIGHTS = { priority: 45, goal: 24, decision: 18, project: 18, routine: 6, preference: 4 };

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function memoryBoost(title, memories = []) {
  const needle = normalizeText(title);
  if (!needle) return { score: 0, category: null };
  let score = 0;
  let category = null;
  for (const memory of Array.isArray(memories) ? memories : []) {
    const weight = MEMORY_WEIGHTS[memory?.category] || 0;
    if (!weight) continue;
    const haystack = normalizeText(memory?.content);
    if (!haystack || !haystack.includes(needle)) continue;
    if (weight > score) {
      score = weight;
      category = memory.category;
    }
  }
  return { score, category };
}

function validDate(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(`${value.trim()}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysSince(value, now) {
  const date = validDate(value);
  if (!date || !(now instanceof Date) || Number.isNaN(now.getTime())) return null;
  return Math.floor((now.getTime() - date.getTime()) / 86400000);
}

function taskCandidate(task, module, memories, order) {
  if (!task || task.done) return null;
  const title = String(task.title || '').trim();
  if (!title) return null;
  const progress = Math.max(0, Math.min(99, Number(task.progress) || 0));
  const boost = memoryBoost(title, memories);
  const nearDone = progress >= 80;
  return {
    id: `${module}-task-${task.id || order}`,
    title,
    reason: boost.category === 'priority'
      ? `Você marcou isso como prioridade na memória e a missão está em ${progress}%.`
      : nearDone
        ? `A missão já está em ${progress}% e está perto de concluir.`
        : boost.score
          ? `Essa missão aparece nas suas memórias e está com ${progress}% de progresso.`
          : `Missão aberta com ${progress}% de progresso.`,
    module,
    score: 36 + (progress * 0.42) + boost.score,
    source: boost.score ? `memory:${boost.category}` : 'task',
    order,
  };
}

function projectCandidate(project, memories, order) {
  if (!project || project.status === 'done') return null;
  const title = String(project.title || '').trim();
  if (!title) return null;
  const boost = memoryBoost(title, memories);
  return {
    id: `lab-project-${project.id || order}`,
    title,
    reason: boost.category === 'priority'
      ? 'Esse projeto foi citado em uma memória de prioridade e continua ativo.'
      : boost.score
        ? 'Esse projeto ativo também aparece nas suas memórias de longo prazo.'
        : 'Projeto ativo no RICK_LAB.',
    module: 'lab',
    score: 58 + boost.score,
    source: boost.score ? `memory:${boost.category}` : 'project',
    order,
  };
}

function maintenanceCandidate(kind, values, now, order) {
  if (!Array.isArray(values) || !values.length) return null;
  const valid = values.map((value) => ({ value, date: validDate(value) })).filter((item) => item.date);
  if (!valid.length) return null;
  valid.sort((a, b) => a.date - b.date);
  const latest = valid[valid.length - 1].value;
  const days = daysSince(latest, now);
  if (days === null || days < 7) return null;
  const label = kind === 'backup' ? 'Backup atrasado' : 'Diagnóstico atrasado';
  return {
    id: `system-${kind}-stale`,
    title: label,
    reason: `O último ${kind === 'backup' ? 'backup' : 'diagnóstico'} registrado foi há ${days} dias.`,
    module: 'system',
    score: 54 + Math.min(days - 7, 20),
    source: 'system',
    order,
  };
}

export function buildRickAiPriorities(snapshot = {}, memories = [], now = new Date()) {
  const candidates = [];
  let order = 0;
  const balance = Number(snapshot?.finance?.balance);
  if (Number.isFinite(balance) && balance < 0) {
    candidates.push({
      id: 'finance-negative-balance',
      title: 'Saldo financeiro negativo',
      reason: `Seu saldo está negativo em R$ ${Math.abs(balance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}; vale estabilizar isso antes de prioridades menos urgentes.`,
      module: 'finance',
      score: 130,
      source: 'finance',
      order: order++,
    });
  }

  for (const task of snapshot?.home?.tasks || []) {
    const candidate = taskCandidate(task, 'home', memories, order++);
    if (candidate) candidates.push(candidate);
  }
  for (const task of snapshot?.study?.tasks || []) {
    const candidate = taskCandidate(task, 'study', memories, order++);
    if (candidate) candidates.push(candidate);
  }
  for (const project of snapshot?.lab?.projects || []) {
    const candidate = projectCandidate(project, memories, order++);
    if (candidate) candidates.push(candidate);
  }

  const backup = maintenanceCandidate('backup', snapshot?.system?.backupDays, now, order++);
  const diagnostic = maintenanceCandidate('diagnostic', snapshot?.system?.diagnosticDays, now, order++);
  if (backup) candidates.push(backup);
  if (diagnostic) candidates.push(diagnostic);

  return candidates
    .sort((a, b) => (b.score - a.score) || (a.order - b.order))
    .slice(0, 3)
    .map(({ order: _order, ...item }, index) => ({ ...item, bucket: BUCKETS[index] }));
}
