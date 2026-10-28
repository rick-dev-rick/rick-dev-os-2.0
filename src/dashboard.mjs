export function carePercent(p) {
  return Math.min(100, p.backupDays.length * 10 + p.diagnosticDays.length * 5);
}
export function awardCare(p, kind, day) {
  if (!["backupDays", "diagnosticDays"].includes(kind))
    throw Error("Tipo de cuidado inválido");
  return { ...p, [kind]: [...new Set([...p[kind], day])].slice(-20) };
}
export function focusDuration({ hours = 0, minutes = 0, seconds = 0 }) {
  const values = [
    Number(hours || 0),
    Number(minutes || 0),
    Number(seconds || 0),
  ];
  if (
    values.some((n) => !Number.isInteger(n) || n < 0) ||
    values[0] > 24 ||
    values[1] > 59 ||
    values[2] > 59
  )
    throw Error("Confira horas, minutos e segundos.");
  const total = values[0] * 3600 + values[1] * 60 + values[2];
  if (total < 1 || total > 86400)
    throw Error("Defina um foco entre 1 segundo e 24 horas.");
  return total;
}
export function missionPercent(tasks, projects) {
  return Math.min(
    100,
    (tasks.length
      ? tasks.reduce((s, t) => s + (t.done ? 100 : t.progress || 0), 0) /
        tasks.length
      : 0) +
      projects * 5,
  );
}
