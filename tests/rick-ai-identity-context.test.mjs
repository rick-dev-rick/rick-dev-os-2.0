import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inferRickIdentityContext } from '../src/rick-ai/identity-context.mjs';

function infer(message, activeModule = 'home', recentConversation = []) {
  return inferRickIdentityContext({ message, activeModule, recentConversation });
}

test('conversa pessoal clara prefere Douglas', () => {
  const result = infer('Hoje o trabalho foi puxado e quero organizar as contas de casa', 'home');
  assert.equal(result.context, 'personal');
  assert.equal(result.preferredName, 'Douglas');
  assert.ok(result.confidence >= 0.6);
});

test('conversa dev clara prefere Rick', () => {
  const result = infer('Quero corrigir o React do meu portfólio e publicar no GitHub', 'lab');
  assert.equal(result.context, 'dev');
  assert.equal(result.preferredName, 'Rick');
  assert.ok(result.confidence >= 0.6);
});

test('mistura pessoal e dev reconhece contexto misto sem separar a pessoa', () => {
  const result = infer('Se eu pegar mais freela no rick_dev vou conseguir guardar mais dinheiro pras minhas férias', 'finance');
  assert.equal(result.context, 'mixed');
  assert.equal(result.preferredName, null);
});

test('mensagem ambígua fica neutra', () => {
  const result = infer('o que você acha disso?', 'home');
  assert.equal(result.context, 'neutral');
  assert.equal(result.preferredName, null);
  assert.ok(result.confidence < 0.6);
});

test('contexto recente pesa mais que palavra isolada', () => {
  const recentConversation = [
    { role: 'user', content: 'Tô ajustando meu portfólio e vendo cliente pro rick_dev' },
    { role: 'assistant', content: 'Beleza, vamos focar no projeto.' },
  ];
  const result = infer('e depois quero ver dinheiro', 'lab', recentConversation);
  assert.equal(result.context, 'dev');
  assert.equal(result.preferredName, 'Rick');
});
