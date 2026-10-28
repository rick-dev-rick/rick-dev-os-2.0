import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parsePrice,
  shoppingSummary,
  runningSummary,
  validateRecord,
  normalizeData,
  safeUrl,
  mediaUrl,
} from "../src/models.mjs";
test("planejamento soma centavos e separa itens comprados", () => {
  assert.equal(parsePrice("1.299,90"), 129990);
  assert.equal(parsePrice("129.90"), 12990);
  assert.throws(() => parsePrice("-1"));
  assert.deepEqual(
    shoppingSummary([
      { priceCents: 129990, purchased: true },
      { priceCents: 10010, purchased: false },
    ]),
    {
      total: 2,
      purchased: 1,
      budgetCents: 140000,
      spentCents: 129990,
      percent: 50,
    },
  );
});
test("corrida usa ritmo ponderado e filtra mês", () => {
  const s = runningSummary(
    [
      { date: "2026-10-01", distanceKm: 5, durationSeconds: 1800 },
      { date: "2026-10-02", distanceKm: 10, durationSeconds: 3000 },
      { date: "2026-09-01", distanceKm: 99, durationSeconds: 1 },
    ],
    "2026-10",
    20,
  );
  assert.equal(s.distanceKm, 15);
  assert.equal(s.durationSeconds, 4800);
  assert.equal(s.paceSeconds, 320);
  assert.equal(s.percent, 75);
  assert.equal(runningSummary([], "2026-10", 0).paceSeconds, null);
});
test("registros rejeitam duração zero, data impossível e campos vazios", () => {
  assert.throws(() =>
    validateRecord("runs", {
      date: "2026-02-30",
      distanceKm: 5,
      hours: 0,
      minutes: 30,
      seconds: 0,
      type: "run",
      place: "street",
      effort: "light",
    }),
  );
  assert.throws(() =>
    validateRecord("runs", {
      date: "2026-10-01",
      distanceKm: 5,
      hours: 0,
      minutes: 0,
      seconds: 0,
      type: "run",
      place: "street",
      effort: "light",
    }),
  );
  assert.throws(() => validateRecord("pc", { title: "   ", price: "100" }));
});
test("links de biblioteca e player rejeitam protocolos perigosos", () => {
  assert.throws(() => safeUrl("javascript:alert(1)"));
  assert.throws(() => mediaUrl("https://evil.com/a"));
  assert.equal(
    mediaUrl("https://open.spotify.com/playlist/123").provider,
    "spotify",
  );
  assert.equal(
    mediaUrl("https://soundcloud.com/artist/sets/list").provider,
    "soundcloud",
  );
});
test("backup antigo ganha coleções novas sem perder transações", () => {
  const d = normalizeData({
    version: 2,
    tasks: [],
    workouts: [],
    transactions: [{ id: "a", title: "x", amount: 12, type: "income" }],
  });
  assert.deepEqual(d.pc, []);
  assert.equal(d.transactions[0].amount, 12);
  assert.throws(() =>
    normalizeData({
      ...d,
      pc: [{ id: "a", title: "x", priceCents: -1, purchased: false }],
    }),
  );
  assert.throws(() => normalizeData({ ...d, runningGoals: { "2026-10": -2 } }));
  assert.throws(() =>
    normalizeData({
      ...d,
      projects: [{ id: "a", title: "x", description: 123 }],
    }),
  );
});
test("restauração rejeita preço nulo e flags de compra com tipo incorreto", () => {
  const base = normalizeData({
    version: 2,
    tasks: [],
    workouts: [],
    transactions: [],
  });
  for (const patch of [
    { priceCents: null },
    { purchased: "true" },
    { priceCents: "123" },
    { done: "yes" },
  ]) {
    const key = "done" in patch ? "topics" : "pc";
    const item =
      key === "topics"
        ? { id: "t", title: "React", done: true, ...patch }
        : {
            id: "p",
            title: "Peça",
            priceCents: 500,
            purchased: true,
            ...patch,
          };
    assert.throws(() => normalizeData({ ...base, [key]: [item] }));
  }
});
test("dados locais inválidos ficam preservados e não podem ser sobrescritos automaticamente", async () => {
  const { loadWorkspace, persistWorkspace } =
    await import("../src/persistence.mjs");
  const raw = '{"version":2,"tasks":"invalid"}';
  const state = loadWorkspace(raw);
  assert.equal(state.recoveryRaw, raw);
  const storage = new Map([["rick-os-v2", raw]]);
  const adapter = { setItem: (k, v) => storage.set(k, v) };
  assert.equal(persistWorkspace(adapter, state.data, state.recoveryRaw), false);
  assert.equal(storage.get("rick-os-v2"), raw);
});
test("editar matéria preserva conclusão e editar corrida não conserva duração anterior", async () => {
  const { editorRecord } = await import("../src/models.mjs");
  assert.equal(
    editorRecord(
      "topics",
      { id: "t", title: "Antigo", done: true },
      { title: "Novo" },
    ).done,
    true,
  );
  const r = editorRecord(
    "runs",
    { id: "r", durationSeconds: 999 },
    {
      date: "2026-10-01",
      distanceKm: 5,
      hours: 0,
      minutes: 30,
      seconds: 0,
      type: "run",
      place: "street",
      effort: "light",
    },
  );
  assert.equal(r.durationSeconds, 1800);
});
test("guest não altera dados nem cópia preventiva durante restauração", async () => {
  const { restoreWorkspace } = await import("../src/persistence.mjs");
  const store = new Map([["rick-os-v2-before-import", "original"]]);
  const adapter = { setItem: (k, v) => store.set(k, v) };
  const d = normalizeData({
    version: 2,
    tasks: [],
    workouts: [],
    transactions: [],
  });
  assert.throws(() => restoreWorkspace(adapter, d, d, "guest"));
  assert.equal(store.get("rick-os-v2-before-import"), "original");
});
