import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const main = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8');
let mobile = '';
try { mobile = await readFile(new URL('../src/mobile.css', import.meta.url), 'utf8'); } catch {}

test('carrega overrides mobile depois do CSS principal', () => {
  assert.match(main, /import ["']\.\/style\.css["'];[\s\S]*import ["']\.\/mobile\.css["'];/);
});

test('mobile impede overflow horizontal e respeita safe area', () => {
  assert.match(mobile, /@media\s*\(max-width:\s*620px\)/);
  assert.match(mobile, /overflow-x:\s*hidden/);
  assert.match(mobile, /env\(safe-area-inset-top\)/);
});

test('home usa uma coluna nos blocos que apertavam no celular', () => {
  assert.match(mobile, /\.overview-metrics[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(mobile, /\.next-grid[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(mobile, /\.home-projects[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(mobile, /\.evolution-board[\s\S]*grid-template-columns:\s*1fr/);
});

test('launcher da assistente sobe acima do dock e fica compacto', () => {
  assert.match(mobile, /\.rick-ai-root[\s\S]*bottom:\s*96px/);
  assert.match(mobile, /\.rick-ai-launcher[\s\S]*width:\s*54px/);
  assert.match(mobile, /\.rick-ai-launcher-label[\s\S]*display:\s*none/);
});

test('music dock ocupa largura segura sem estourar viewport', () => {
  assert.match(mobile, /\.music-dock[\s\S]*width:\s*calc\(100% - 24px\)/);
  assert.match(mobile, /\.music-dock[\s\S]*right:\s*12px/);
});
