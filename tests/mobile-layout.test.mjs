import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const mobile = await readFile(new URL('../src/mobile.css', import.meta.url), 'utf8');
const home = await readFile(new URL('../src/Home.jsx', import.meta.url), 'utf8');

test('carrega overrides mobile no documento', () => {
  assert.match(index, /<link rel="stylesheet" href="\/src\/mobile\.css"\s*\/>/);
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

test('launcher da assistente mantém folga real acima do player', () => {
  assert.match(mobile, /--mobile-player-clearance:\s*128px/);
  assert.match(mobile, /\.rick-ai-root[\s\S]*bottom:\s*calc\(var\(--mobile-player-clearance\) \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(mobile, /\.rick-ai-launcher[\s\S]*width:\s*54px/);
  assert.match(mobile, /\.rick-ai-launcher-label[\s\S]*display:\s*none/);
});

test('music dock ocupa largura segura sem estourar viewport', () => {
  assert.match(mobile, /\.music-dock[\s\S]*width:\s*calc\(100% - 24px\)/);
  assert.match(mobile, /\.music-dock[\s\S]*right:\s*12px/);
});

test('cards de continuidade usam CTA com ícone real em vez de seta textual', () => {
  assert.doesNotMatch(home, /↗/);
  assert.match(home, /className="next-card-action"[\s\S]*ArrowUpRight/);
  assert.match(mobile, /\.next-card-action[\s\S]*display:\s*inline-flex/);
});
