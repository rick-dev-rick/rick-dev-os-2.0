import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractRickAiMemoryCandidate, normalizeRickAiMemoryKey } from '../src/rick-ai/memory.mjs';

test('extrai preferência explícita e duradoura', () => {
  assert.deepEqual(extractRickAiMemoryCandidate('Eu prefiro usar React nos meus projetos.'), {
    category: 'preference',
    content: 'Eu prefiro usar React nos meus projetos.',
    normalizedKey: 'preference:eu-prefiro-usar-react-nos-meus-projetos',
  });
});

test('extrai meta, decisão, prioridade e rotina explícitas', () => {
  assert.equal(extractRickAiMemoryCandidate('Minha meta é fechar meu primeiro cliente freelancer.')?.category, 'goal');
  assert.equal(extractRickAiMemoryCandidate('Decidi que o RICK_DEV OS vai continuar em React.')?.category, 'decision');
  assert.equal(extractRickAiMemoryCandidate('Minha prioridade é terminar o portfólio antes de outro projeto.')?.category, 'priority');
  assert.equal(extractRickAiMemoryCandidate('Eu costumo estudar React toda semana.')?.category, 'routine');
});

test('ignora conversa casual e estado transitório', () => {
  assert.equal(extractRickAiMemoryCandidate('Tô cansado hoje.'), null);
  assert.equal(extractRickAiMemoryCandidate('Agora eu vou tomar banho.'), null);
  assert.equal(extractRickAiMemoryCandidate('kkkk isso ficou top'), null);
  assert.equal(extractRickAiMemoryCandidate('Isso vai ser top demais.'), null);
});

test('não memoriza automaticamente conteúdo sensível ou segredo', () => {
  assert.equal(extractRickAiMemoryCandidate('Minha senha é abc123 e eu prefiro não mudar.'), null);
  assert.equal(extractRickAiMemoryCandidate('Meu diagnóstico é ansiedade grave e minha prioridade é tratar isso.'), null);
  assert.equal(extractRickAiMemoryCandidate('Minha chave API é sk-teste e decidi guardar aqui.'), null);
});

test('normalização gera chave curta e estável', () => {
  assert.equal(normalizeRickAiMemoryKey('goal', '  Minha META é aprender React!!!  '), 'goal:minha-meta-e-aprender-react');
  assert.ok(normalizeRickAiMemoryKey('goal', 'x'.repeat(1000)).length <= 220);
});
