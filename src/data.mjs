export function createId(api = globalThis.crypto) {
  return api.randomUUID
    ? api.randomUUID()
    : Array.from(api.getRandomValues(new Uint8Array(16)), (n) =>
        n.toString(16).padStart(2, "0"),
      ).join("");
}
export const balance = (rows) =>
  Math.round(
    rows.reduce((n, r) => n + (r.type === "income" ? r.amount : -r.amount), 0) *
      100,
  ) / 100;
export function addTransaction(rows, r) {
  if (
    !r.title?.trim() ||
    !Number.isFinite(r.amount) ||
    r.amount <= 0 ||
    !["income", "expense"].includes(r.type)
  )
    throw Error("Informe uma descrição e um valor maior que zero.");
  return [
    ...rows,
    {
      ...r,
      title: r.title.trim(),
      id: createId(),
      date: new Date().toISOString(),
    },
  ];
}
export function validateBackup(d) {
  return (
    !!d &&
    d.version === 2 &&
    (d.name === undefined || typeof d.name === "string") &&
    (d.notes === undefined || typeof d.notes === "string") &&
    (d.focusCount === undefined ||
      (Number.isInteger(d.focusCount) && d.focusCount >= 0)) &&
    Array.isArray(d.tasks) &&
    d.tasks.every(
      (t) =>
        typeof t.id === "string" &&
        typeof t.title === "string" &&
        typeof t.done === "boolean" &&
        (t.tag === undefined || typeof t.tag === "string") &&
        ["study", "home"].includes(t.module),
    ) &&
    Array.isArray(d.workouts) &&
    d.workouts.every(
      (w) =>
        typeof w.id === "string" &&
        typeof w.title === "string" &&
        typeof w.done === "boolean",
    ) &&
    Array.isArray(d.transactions) &&
    d.transactions.every(
      (t) =>
        typeof t.id === "string" &&
        typeof t.title === "string" &&
        Number.isFinite(t.amount) &&
        t.amount > 0 &&
        ["income", "expense"].includes(t.type),
    )
  );
}
