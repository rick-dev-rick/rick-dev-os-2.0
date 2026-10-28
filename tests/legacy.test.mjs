import { test } from "node:test";
import assert from "node:assert/strict";
import { legacySystem } from "../src/legacy-cores.mjs";
import { importLegacy, fromLegacyData } from "../src/legacy.mjs";
const preferences = { tabWidth: 2, printWidth: 100, sidebarCollapsed: false };
const data = {
  "rick-dev-study-topics": JSON.stringify([{ id: "react", label: "React" }]),
  "rick-dev-studies": JSON.stringify(["react"]),
  "rick-dev-missions": JSON.stringify([
    { text: "Estudar", done: false, progress: 40, description: "Componentes" },
  ]),
  "rick-dev-pc-parts": JSON.stringify([
    {
      id: "gpu",
      name: "GPU",
      model: "Modelo",
      price: 1299.9,
      purchased: true,
      link: "",
    },
  ]),
  "rick-dev-style": JSON.stringify([
    {
      id: "shoe",
      name: "Tênis",
      category: "tenis",
      priceCents: 10050,
      purchased: false,
      url: "https://example.com/tenis",
    },
  ]),
};
test("importa backup 1.0 verificado sem perder preços, progresso ou matérias", async () => {
  const backup = await legacySystem.createBackup(data, preferences);
  const d = await importLegacy(backup);
  assert.equal(d.pc[0].priceCents, 129990);
  assert.equal(d.style[0].priceCents, 10050);
  assert.equal(d.topics[0].done, true);
  assert.equal(d.tasks[0].progress, 40);
  assert.equal(d.tasks[0].description, "Componentes");
});
test("checksum inválido não permite substituir os dados", async () => {
  const backup = await legacySystem.createBackup(data, preferences);
  backup.data["rick-dev-studies"] = "[]";
  await assert.rejects(() => importLegacy(backup));
});
test("dados desconhecidos ou malformados são rejeitados na importação", () =>
  assert.throws(() =>
    fromLegacyData({ "rick-dev-pc-parts": '[{"name":"x","price":-1}]' }),
  ));
