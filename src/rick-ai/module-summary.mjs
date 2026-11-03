function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function km(value) {
  return `${Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} km`;
}

function daysSince(dateText) {
  if (!dateText) return null;
  const date = new Date(`${dateText}T12:00:00-03:00`);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86400000));
}

function item(id, label, value, tone = 'neutral') {
  return { id, label, value: String(value), tone };
}

function bestOpenTask(tasks = []) {
  return tasks
    .filter((task) => !task?.done)
    .slice()
    .sort((a, b) => Number(b?.progress || 0) - Number(a?.progress || 0))[0] || null;
}

function homeSummary(snapshot) {
  const tasks = snapshot.home?.tasks || [];
  const open = tasks.filter((task) => !task.done);
  const done = tasks.filter((task) => task.done).length;
  const best = bestOpenTask(tasks);
  return [
    item('home-tasks', 'Missões', `${open.length} aberta${open.length === 1 ? '' : 's'} · ${done} concluída${done === 1 ? '' : 's'}`, open.length ? 'neutral' : 'good'),
    best ? item('home-priority', 'Mais avançada', `${best.title} · ${Number(best.progress || 0)}%`, Number(best.progress || 0) >= 80 ? 'good' : 'neutral') : item('home-priority', 'Prioridade', 'Nenhuma missão aberta', 'good'),
    item('home-next', 'Próximo passo', best ? `Fechar ${best.title}` : 'Definir a próxima missão', best ? 'neutral' : 'attention'),
  ];
}

function studySummary(snapshot) {
  const tasks = snapshot.study?.tasks || [];
  const topics = snapshot.study?.topics || [];
  const open = tasks.filter((task) => !task.done);
  const doneTopics = topics.filter((topic) => topic.done).length;
  const best = bestOpenTask(tasks);
  return [
    item('study-tasks', 'Missões', `${open.length} aberta${open.length === 1 ? '' : 's'} · ${tasks.length - open.length} concluída${tasks.length - open.length === 1 ? '' : 's'}`, open.length ? 'neutral' : 'good'),
    item('study-topics', 'Tópicos', `${doneTopics}/${topics.length} concluídos`, topics.length && doneTopics === topics.length ? 'good' : 'neutral'),
    best ? item('study-priority', 'Prioridade', `${best.title} · ${Number(best.progress || 0)}%`, Number(best.progress || 0) >= 80 ? 'good' : 'neutral') : item('study-priority', 'Próximo passo', 'Escolher a próxima missão de estudo', 'attention'),
  ];
}

function fitSummary(snapshot) {
  const runs = snapshot.fit?.runs || [];
  const workouts = snapshot.fit?.workouts || [];
  const body = snapshot.fit?.body || [];
  const distance = runs.reduce((sum, run) => sum + Number(run?.distanceKm || 0), 0);
  const pending = workouts.filter((workout) => !workout.done).length;
  const lastWeight = body.slice().reverse().find((entry) => Number.isFinite(Number(entry?.weight)))?.weight;
  return [
    item('fit-runs', 'Corridas', `${runs.length} registro${runs.length === 1 ? '' : 's'} · ${km(distance)}`, runs.length ? 'good' : 'neutral'),
    item('fit-workouts', 'Treinos', `${pending} pendente${pending === 1 ? '' : 's'}`, pending ? 'attention' : 'good'),
    item('fit-body', 'Último peso', lastWeight != null ? `${Number(lastWeight).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg` : 'Sem registro', lastWeight != null ? 'neutral' : 'attention'),
  ];
}

function financeSummary(snapshot) {
  const transactions = snapshot.finance?.transactions || [];
  const income = transactions.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const expenseRows = transactions.filter((tx) => tx.type === 'expense');
  const expense = expenseRows.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const biggest = expenseRows.slice().sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))[0];
  const balance = Number(snapshot.finance?.balance || 0);
  return [
    item('finance-balance', 'Saldo', money(balance), balance < 0 ? 'attention' : 'good'),
    item('finance-flow', 'Fluxo recente', `Entradas ${money(income)} · saídas ${money(expense)}`, expense > income ? 'attention' : 'neutral'),
    biggest ? item('finance-biggest', 'Maior gasto', `${biggest.title} · ${money(biggest.amount)}`, 'neutral') : item('finance-biggest', 'Maior gasto', 'Nenhum gasto registrado', 'good'),
  ];
}

function labSummary(snapshot) {
  const projects = snapshot.lab?.projects || [];
  const active = projects.filter((project) => ['doing', 'improve'].includes(project.status));
  const done = projects.filter((project) => project.status === 'done').length;
  const priority = active[0] || projects.find((project) => project.status !== 'done');
  return [
    item('lab-projects', 'Projetos', `${active.length} ativo${active.length === 1 ? '' : 's'} · ${done} concluído${done === 1 ? '' : 's'}`, active.length ? 'neutral' : 'good'),
    item('lab-priority', 'Prioridade', priority ? priority.title : 'Nenhum projeto ativo', priority ? 'neutral' : 'attention'),
    item('lab-next', 'Próximo passo', priority ? `Avançar ${priority.title}` : 'Definir o próximo projeto', priority ? 'neutral' : 'attention'),
  ];
}

function systemSummary(snapshot) {
  const backupDays = snapshot.system?.backupDays || [];
  const diagnosticDays = snapshot.system?.diagnosticDays || [];
  const lastBackup = backupDays.at(-1) || null;
  const lastDiagnostic = diagnosticDays.at(-1) || null;
  const backupAge = daysSince(lastBackup);
  const diagnosticAge = daysSince(lastDiagnostic);
  const overdue = [backupAge, diagnosticAge].some((age) => age != null && age >= 7);
  return [
    item('system-backup', 'Último backup', lastBackup || 'Sem registro', backupAge != null && backupAge >= 7 ? 'attention' : lastBackup ? 'good' : 'attention'),
    item('system-diagnostic', 'Último diagnóstico', lastDiagnostic || 'Sem registro', diagnosticAge != null && diagnosticAge >= 7 ? 'attention' : lastDiagnostic ? 'good' : 'attention'),
    item('system-care', 'Manutenção', overdue ? 'Tem cuidado atrasado há 7+ dias' : lastBackup || lastDiagnostic ? 'Em dia' : 'Comece registrando um cuidado', overdue || (!lastBackup && !lastDiagnostic) ? 'attention' : 'good'),
  ];
}

export function buildRickAiModuleSummary(snapshot = {}) {
  switch (snapshot?.page) {
    case 'study': return studySummary(snapshot).slice(0, 3);
    case 'fit': return fitSummary(snapshot).slice(0, 3);
    case 'finance': return financeSummary(snapshot).slice(0, 3);
    case 'lab': return labSummary(snapshot).slice(0, 3);
    case 'system': return systemSummary(snapshot).slice(0, 3);
    case 'home':
    default: return homeSummary(snapshot).slice(0, 3);
  }
}
