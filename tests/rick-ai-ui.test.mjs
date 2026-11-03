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
  assert.doesNotMatch(panel, /transcribeRickAiAudio|speakRickAiText/);
});

test('launcher da Rick IA fica no canto inferior esquerdo', () => {
  assert.match(styles, /\.rick-ai-root\{position:fixed;left:24px;bottom:24px/);
  assert.match(styles, /\.rick-ai-panel\{position:absolute;left:0;bottom:70px/);
});

test('painel carrega histórico e mantém conversationId', () => {
  assert.match(panel, /loadRickAiHistory/);
  assert.match(panel, /const \[conversationId, setConversationId\] = useState\(null\)/);
  assert.match(panel, /setConversationId\(history\.conversationId\)/);
  assert.match(panel, /saveRickAiExchange\(\{[\s\S]*conversationId,/);
});

test('painel oferece nova conversa sem apagar histórico salvo', () => {
  assert.match(panel, /function startNewConversation\(\)/);
  assert.match(panel, /setConversationId\(null\)/);
  assert.match(panel, /setMessages\(\[greeting\]\)/);
  assert.match(panel, /setPendingAction\(null\)/);
  assert.doesNotMatch(panel, /delete\(|rick_ai_conversations[^\n]*delete/);
});

test('painel lista e troca conversas recentes', () => {
  assert.match(panel, /listRickAiConversations/);
  assert.match(panel, /conversationListOpen/);
  assert.match(panel, /switchConversation/);
  assert.match(panel, /Histórico de conversas/);
  assert.match(panel, /Nova conversa/);
});

test('painel faz auto-scroll para a mensagem mais recente', () => {
  assert.match(panel, /messagesEndRef/);
  assert.match(panel, /scrollIntoView/);
});

test('painel calcula insights locais sem chamar a API automaticamente', () => {
  assert.match(panel, /buildRickAiInsights/);
  assert.match(panel, /const insights = useMemo/);
  assert.doesNotMatch(panel, /useEffect\([\s\S]{0,500}sendRickAiMessage/);
});

test('painel mostra cartão RICK IA NOTOU e permite dispensar o conjunto atual', () => {
  assert.match(panel, /RICK IA NOTOU/);
  assert.match(panel, /Dispensar/);
  assert.match(panel, /dismissedInsightSignature/);
  assert.match(panel, /currentInsightSignature/);
});

test('launcher mostra badge discreto quando há insights e painel está fechado', () => {
  assert.match(panel, /rick-ai-insight-badge/);
  assert.match(styles, /\.rick-ai-insight-badge\{/);
  assert.match(styles, /\.rick-ai-insight-card\{/);
});

test('painel mostra consciência do módulo atual', () => {
  assert.match(panel, /getRickAiModule/);
  assert.match(panel, /activeModule/);
  assert.match(panel, /rick-ai-module-context/);
  assert.match(panel, /activeModule\.label/);
  assert.match(panel, /activeModule\.focus/);
});

test('painel oferece sugestões rápidas do módulo no estado inicial', () => {
  assert.match(panel, /getRickAiSuggestions/);
  assert.match(panel, /showModuleSuggestions/);
  assert.match(panel, /rick-ai-suggestions/);
  assert.match(panel, /sendMessage\(suggestion\)/);
  assert.match(styles, /\.rick-ai-suggestions\{/);
  assert.match(styles, /\.rick-ai-suggestion-chip\{/);
});
