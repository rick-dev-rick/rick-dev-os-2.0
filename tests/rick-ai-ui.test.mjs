import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const main = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8');
const panel = await readFile(new URL('../src/rick-ai/RickAiPanel.jsx', import.meta.url), 'utf8');
const styles = await readFile(new URL('../src/rick-ai/rick-ai.css', import.meta.url), 'utf8');

test('App importa e renderiza RickAiPanel com o estado vivo do OS', () => {
  assert.match(main, /import RickAiPanel from ["']\.\/rick-ai\/RickAiPanel\.jsx["']/);
  assert.match(main, /<RickAiPanel[\s\S]*data=\{data\}[\s\S]*page=\{page\}[\s\S]*role=\{role\}[\s\S]*setData=\{setData\}[\s\S]*notify=\{notify\}/);
});

test('painel exige confirmação explícita antes de aplicar ação', () => {
  assert.match(panel, /applyConfirmedAction\(data, pendingAction\)/);
  assert.match(panel, /onClick=\{confirmAction\}/);
  assert.match(panel, /Nada foi alterado ainda\./);
  assert.doesNotMatch(panel, /setData\([^)]*reply\.pendingAction/);
});

test('modo convidado não consegue enviar mensagens privadas', () => {
  assert.match(panel, /role !== ['"]admin['"]/);
  assert.match(panel, /Disponível no modo ADM/);
});

test('painel fica em modo texto sem controles ou chamadas de voz', () => {
  assert.doesNotMatch(panel, /MediaRecorder/);
  assert.doesNotMatch(panel, /navigator\.mediaDevices\.getUserMedia/);
  assert.doesNotMatch(panel, /\bMic\b|\bMicOff\b/);
  assert.doesNotMatch(panel, /Volume2|VolumeX/);
  assert.doesNotMatch(panel, /transcribeRickAiAudio/);
  assert.doesNotMatch(panel, /speakRickAiText/);
  assert.doesNotMatch(panel, /rick-ai-mic/);
  assert.doesNotMatch(panel, /rick-ai-voice-note/);
});

test('launcher da Rick IA fica no canto inferior esquerdo', () => {
  assert.match(styles, /\.rick-ai-root\{position:fixed;left:24px;bottom:24px/);
  assert.match(styles, /\.rick-ai-panel\{position:absolute;left:0;bottom:70px/);
  assert.match(styles, /@media\(max-width:640px\)\{\.rick-ai-root\{left:14px;bottom:14px\}/);
});

test('painel carrega histórico e mantém conversationId', () => {
  assert.match(panel, /loadRickAiHistory/);
  assert.match(panel, /const \[conversationId, setConversationId\] = useState\(null\)/);
  assert.match(panel, /setConversationId\(history\.conversationId\)/);
  assert.match(panel, /conversationId\s*\}/);
});

test('painel faz auto-scroll para a mensagem mais recente', () => {
  assert.match(panel, /messagesEndRef/);
  assert.match(panel, /scrollIntoView/);
});
