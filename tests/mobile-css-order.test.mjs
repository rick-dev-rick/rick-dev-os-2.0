import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Regressão: mobile.css precisa vencer os estilos gerais no bundle final.
const entry = await readFile(new URL('../src/entry.jsx', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('mobile.css é importado por último no entry', () => {
  const style = entry.indexOf('import "./style.css"');
  const modern = entry.indexOf('import "./modern.css"');
  const mobile = entry.indexOf('import "./mobile.css"');

  assert.ok(style >= 0, 'style.css precisa ser importado');
  assert.ok(modern > style, 'modern.css deve vir depois de style.css');
  assert.ok(mobile > modern, 'mobile.css deve ser o último override visual');
});

test('index não carrega mobile.css antes do bundle do React', () => {
  assert.doesNotMatch(index, /<link[^>]+mobile\.css/);
});
