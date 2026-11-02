function validDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(older, newer) {
  const ms = newer.getTime() - older.getTime();
  return Math.floor(ms / 86400000);
}

function latestValidDate(values = []) {
  const dates = Array.isArray(values) ? values.map(validDate).filter(Boolean) : [];
  if (!dates.length) return null;
  return dates.sort((a, b) => b.getTime() - a.getTime())[0];
}

export function buildRickAiInsights(snapshot = {}, now = new Date()) {
  const insights = [];

  const balance = Number(snapshot?.finance?.balance);
  if (Number.isFinite(balance) && balance < 0) {
    insights.push({
      id: 'finance-negative-balance',
      type: 'finance',
      priority: 100,
      message: 'Rick, seu saldo no Finance ficou negativo. Melhor olhar isso antes de assumir outro gasto 👀',
    });
  }

  const tasks = [
    ...(Array.isArray(snapshot?.home?.tasks) ? snapshot.home.tasks : []),
    ...(Array.isArray(snapshot?.study?.tasks) ? snapshot.study.tasks : []),
  ];

  const almostDone = tasks
    .filter((task) => task && !task.done && Number(task.progress) >= 80 && Number(task.progress) < 100)
    .sort((a, b) => Number(b.progress) - Number(a.progress))[0];

  if (almostDone) {
    insights.push({
      id: `task-almost-done-${almostDone.id || almostDone.title || 'task'}`,
      type: 'task',
      priority: 70,
      message: `“${almostDone.title || 'Essa tarefa'}” já tá em ${Number(almostDone.progress)}%. Tá praticamente pedindo pra ser finalizada 😏`,
    });
  }

  const maintenance = [
    ['backup', 'backupDays', 'backup', 60],
    ['diagnostic', 'diagnosticDays', 'diagnóstico', 55],
  ];

  for (const [key, field, label, priority] of maintenance) {
    const latest = latestValidDate(snapshot?.system?.[field]);
    if (!latest) continue;
    const age = daysBetween(latest, now);
    if (age >= 7) {
      insights.push({
        id: `system-${key}-stale`,
        type: 'system',
        priority,
        message: `Seu último ${label} do sistema foi há ${age} dias. Tá na hora de dar uma conferida nisso.`,
      });
    }
  }

  return insights.sort((a, b) => b.priority - a.priority).slice(0, 3);
}
