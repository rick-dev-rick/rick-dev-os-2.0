import { test } from "node:test";
import assert from "node:assert/strict";
import { validateBackup, balance, addTransaction } from "../src/data.mjs";
test("saldo desconta despesas e aceita centavos", () =>
  assert.equal(
    balance([
      { type: "income", amount: 100.5 },
      { type: "expense", amount: 20.25 },
    ]),
    80.25,
  ));
test("lançamento rejeita zero e texto vazio", () => {
  assert.throws(() =>
    addTransaction([], { title: "", amount: 50, type: "income" }),
  );
  assert.throws(() =>
    addTransaction([], { title: "Teste", amount: 0, type: "income" }),
  );
});
test("backup inválido não pode substituir os dados", () => {
  assert.equal(
    validateBackup({ version: 2, tasks: [], workouts: [], transactions: [] }),
    true,
  );
  assert.equal(
    validateBackup({ version: 2, tasks: "x", workouts: [], transactions: [] }),
    false,
  );
  assert.equal(
    validateBackup({
      version: 2,
      tasks: [],
      workouts: [],
      transactions: [{ amount: -1 }],
    }),
    false,
  );
});
test("registros podem ser criados sem randomUUID no navegador HTTP", async () => {
  const { createId } = await import("../src/data.mjs");
  const a = createId({ getRandomValues: crypto.getRandomValues.bind(crypto) });
  const b = createId({ getRandomValues: crypto.getRandomValues.bind(crypto) });
  assert.equal(typeof a, "string");
  assert.notEqual(a, b);
});
test("backup rejeita campos opcionais com tipos inválidos antes de substituir dados", () => {
  const base = { version: 2, tasks: [], workouts: [], transactions: [] };
  for (const bad of [
    { name: 123 },
    { notes: {} },
    { focusCount: -1 },
    { focusCount: "1" },
    {
      tasks: [
        { id: "a", title: "React", done: false, module: "study", tag: {} },
      ],
    },
  ])
    assert.equal(validateBackup({ ...base, ...bad }), false);
  assert.equal(
    validateBackup({ ...base, name: "Douglas", notes: "", focusCount: 0 }),
    true,
  );
});
