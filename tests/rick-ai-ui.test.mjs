import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const main = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8');
const panel = await readFile(new URL('../src/rick-ai/RickAiPanel.jsx', import.meta.url), 'utf8');
const styles = await readFile(new URL('../src/rick-ai/rick-ai.css', import.meta.url), 'utf8');
const briefingStyles = await readFile(new URL('../src/rick-ai/briefing.css', import.meta.url), 'utf8');

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

test('painel oferece voz opcional sem exigir gravação contínua', () => {
  assert.match(panel, /toggleVoiceInput/);
  assert.match(panel, /SpeechRecognition/);
  assert.match(panel, /aria-label=\{listening \? "Parar ditado" : "Ditar mensagem"\}/);
  assert.match(panel, /readAloud/);
  assert.match(panel, /speakRickAiText/);
  assert.match(panel, /audioUrl/);
  assert.match(panel, /role !== "admin"/);
  assert.doesNotMatch(panel, /MediaRecorder/);
  assert.doesNotMatch(panel, /navigator\.mediaDevices\.getUserMedia/);
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

test('painel mostra cartão RICK AI NOTOU e permite dispensar o conjunto atual', () => {
  assert.match(panel, /RICK AI NOTOU/);
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

test('painel oferece ações rápidas contextuais apenas no ADM', () => {
  assert.match(panel, /getRickAiModuleActions/);
  assert.match(panel, /AÇÕES RÁPIDAS/);
  assert.match(panel, /role === ['"]admin['"]/);
  assert.match(panel, /rick-ai-quick-actions/);
  assert.match(styles, /\.rick-ai-quick-actions\{/);
});

test('ação rápida cria pendingAction local e ainda exige confirmação', () => {
  assert.match(panel, /buildRickAiLocalAction/);
  assert.match(panel, /setPendingAction\(action\)/);
  assert.match(panel, /quickActionForm/);
  assert.match(panel, /submitQuickAction/);
  assert.match(styles, /\.rick-ai-quick-form\{/);
});

test('trocar módulo ou conversa fecha formulário rápido pendente', () => {
  assert.match(panel, /useEffect\(\(\) => \{[\s\S]*setQuickActionForm\(null\)[\s\S]*\}, \[page\]\)/);
  assert.match(panel, /startNewConversation[\s\S]*setQuickActionForm\(null\)/);
  assert.match(panel, /switchConversation[\s\S]*setQuickActionForm\(null\)/);
});

test('painel oferece resumo local do módulo sem chamar a API', () => {
  assert.match(panel, /buildRickAiModuleSummary/);
  assert.match(panel, /const \[summaryOpen, setSummaryOpen\] = useState\(false\)/);
  assert.match(panel, /const moduleSummary = useMemo/);
  assert.match(panel, /RESUMO DO MÓDULO/);
  assert.match(panel, />Resumo</);
  assert.match(styles, /\.rick-ai-summary-card\{/);
  assert.match(styles, /\.rick-ai-summary-row\{/);
  assert.doesNotMatch(panel, /function openSummary[\s\S]{0,300}sendRickAiMessage/);
});

test('trocar de módulo fecha o resumo local aberto', () => {
  assert.match(panel, /useEffect\(\(\) => \{[\s\S]*setSummaryOpen\(false\)[\s\S]*\}, \[page\]\)/);
});

test('painel compara mudanças locais por módulo sem chamar a API', () => {
  assert.match(panel, /buildRickAiChangeSnapshot/);
  assert.match(panel, /diffRickAiChanges/);
  assert.match(panel, /loadRickAiChangeBaseline/);
  assert.match(panel, /saveRickAiChangeBaseline/);
  assert.match(panel, /const \[changesOpen, setChangesOpen\] = useState\(false\)/);
  assert.match(panel, /MUDOU DESDE A ÚLTIMA VEZ/);
  assert.match(panel, />Mudanças/);
  assert.match(styles, /\.rick-ai-changes-card\{/);
  assert.doesNotMatch(panel, /function reviewChanges[\s\S]{0,500}sendRickAiMessage/);
});

test('mudanças exibem badge e revisão atualiza a referência local', () => {
  assert.match(panel, /rick-ai-changes-badge/);
  assert.match(panel, /reviewChanges/);
  assert.match(panel, /setReviewedChanges/);
  assert.match(panel, /saveRickAiChangeBaseline\(activeModule\.id, currentChangeSnapshot\)/);
  assert.match(styles, /\.rick-ai-changes-badge\{/);
});

test('primeira visita cria baseline local sem gerar alerta', () => {
  assert.match(panel, /if \(!baseline\)[\s\S]*saveRickAiChangeBaseline/);
});

test('trocar de módulo fecha mudanças e carrega baseline separado', () => {
  assert.match(panel, /useEffect\(\(\) => \{[\s\S]*setChangesOpen\(false\)[\s\S]*\}, \[page\]\)/);
  assert.match(panel, /loadRickAiChangeBaseline\(activeModule\.id\)/);
});

test('painel oferece prioridade inteligente local usando snapshot e memórias', () => {
  assert.match(panel, /buildRickAiPriorities/);
  assert.match(panel, /const \[priorityOpen, setPriorityOpen\] = useState\(false\)/);
  assert.match(panel, /const priorities = useMemo/);
  assert.match(panel, /PRIORIDADE AGORA/);
  assert.match(panel, />Prioridade</);
  assert.match(panel, /rick-ai-priority-card/);
  assert.match(styles, /\.rick-ai-priority-card\{/);
  assert.doesNotMatch(panel, /function[^\n]*Priority[\s\S]{0,500}sendRickAiMessage/);
});

test('prioridade mostra Agora, Depois e Pode esperar quando houver candidatos', () => {
  assert.match(panel, /Agora/);
  assert.match(panel, /Depois/);
  assert.match(panel, /Pode esperar/);
  assert.match(styles, /\.rick-ai-priority-row/);
});

test('trocar de módulo fecha o card de prioridade', () => {
  assert.match(panel, /useEffect\(\(\) => \{[\s\S]*setPriorityOpen\(false\)[\s\S]*\}, \[page\]\)/);
});

test('painel oferece briefing manual local sem chamar a API', () => {
  assert.match(panel, /buildRickAiBriefing/);
  assert.match(panel, /const \[briefingOpen, setBriefingOpen\] = useState\(false\)/);
  assert.match(panel, /const briefing = useMemo/);
  assert.match(panel, /BRIEFING DA RICK AI/);
  assert.match(panel, />Briefing</);
  assert.match(panel, /rick-ai-briefing-card/);
  assert.match(briefingStyles, /\.rick-ai-briefing-card\{/);
  assert.doesNotMatch(panel, /function[^\n]*Briefing[\s\S]{0,500}sendRickAiMessage/);
});

test('briefing mostra foco, sinais e mudanças quando existirem', () => {
  assert.match(panel, /briefing\.focus/);
  assert.match(panel, /briefing\.signals/);
  assert.match(panel, /briefing\.changes/);
  assert.match(panel, /FOCO AGORA/);
  assert.match(panel, /SINAIS/);
  assert.match(panel, /MUDANÇAS RECENTES/);
});

test('trocar de módulo fecha o briefing', () => {
  assert.match(panel, /useEffect\(\(\) => \{[\s\S]*setBriefingOpen\(false\)[\s\S]*\}, \[page\]\)/);
});

test('identidade pública da assistente é RICK AI', () => {
  assert.match(panel, /<strong>RICK AI<\/strong>/);
  assert.match(panel, /aria-label="RICK AI"/);
  assert.match(panel, /Conversa com RICK AI/);
  assert.match(panel, /RICK AI \/ \{activeModule\.label\}/);
});

test('painel envia contexto de identidade Douglas ou Rick ao backend', () => {
  assert.match(panel, /inferRickIdentityContext/);
  assert.match(panel, /rickAiIdentityContext/);
  assert.match(panel, /recentConversation/);
  assert.match(panel, /activeModule\.id/);
});
