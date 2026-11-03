import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Layers3, Check, History, LoaderCircle, MessageCircle, Plus, Send, Trash2, X } from 'lucide-react';
import { applyConfirmedAction, buildRickAiSnapshot } from './contracts.mjs';
import { deleteRickAiMemory, listRickAiConversations, listRickAiMemories, loadRickAiHistory, saveRickAiExchange, saveRickAiMemory, sendRickAiMessage } from './client.mjs';
import { buildRickAiInsights } from './insights.mjs';
import { buildRickAiLocalAction, getRickAiModuleActions } from './module-actions.mjs';
import { buildRickAiModuleSummary } from './module-summary.mjs';
import { buildRickAiChangeSnapshot, diffRickAiChanges, loadRickAiChangeBaseline, saveRickAiChangeBaseline } from './changes.mjs';
import { extractRickAiMemoryCandidate } from './memory.mjs';
import { getRickAiModule, getRickAiSuggestions } from './modules.mjs';
import { buildRickAiPriorities } from './priority.mjs';
import { buildRickAiBriefing } from './briefing.mjs';
import { inferRickIdentityContext } from './identity-context.mjs';
import core from './assets/core.mjs';
import './rick-ai.css';
import './briefing.css';

const greeting = { role: 'assistant', content: 'Tô por aqui. Manda o que você quer trocar ideia ou resolver 😏' };
const memoryLabels = { preference: 'Preferência', goal: 'Meta', decision: 'Decisão', priority: 'Prioridade', routine: 'Rotina', project: 'Projeto' };
const priorityLabels = { agora: 'Agora', depois: 'Depois', pode_esperar: 'Pode esperar' };

function shortDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function RickAiPanel({ data, page, role, setData, notify }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([greeting]);
  const [conversationId, setConversationId] = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [conversationListOpen, setConversationListOpen] = useState(false);
  const [memories, setMemories] = useState([]);
  const [memoryListOpen, setMemoryListOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [quickActionForm, setQuickActionForm] = useState(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [changeBaseline, setChangeBaseline] = useState(null);
  const [reviewedChanges, setReviewedChanges] = useState([]);
  const [dismissedInsightSignature, setDismissedInsightSignature] = useState('');
  const messagesEndRef = useRef(null);
  const snapshot = useMemo(() => buildRickAiSnapshot(data, page), [data, page]);
  const activeModule = useMemo(() => getRickAiModule(page), [page]);
  const moduleSuggestions = useMemo(() => getRickAiSuggestions(page), [page]);
  const moduleActions = useMemo(() => getRickAiModuleActions(page), [page]);
  const moduleSummary = useMemo(() => buildRickAiModuleSummary(snapshot), [snapshot]);
  const currentChangeSnapshot = useMemo(() => buildRickAiChangeSnapshot(snapshot, activeModule.id), [snapshot, activeModule.id]);
  const pendingChanges = useMemo(() => changeBaseline ? diffRickAiChanges(changeBaseline, currentChangeSnapshot, activeModule.id) : [], [changeBaseline, currentChangeSnapshot, activeModule.id]);
  const insights = useMemo(() => role === 'admin' ? buildRickAiInsights(snapshot) : [], [snapshot, role]);
  const currentInsightSignature = useMemo(() => insights.map((item) => item.id).join('|'), [insights]);
  const insightsVisible = insights.length > 0 && currentInsightSignature !== dismissedInsightSignature;
  const longTermMemory = useMemo(() => memories.slice(0, 20).map((memory) => ({ category: memory.category, content: memory.content })), [memories]);
  const priorities = useMemo(() => role === 'admin' ? buildRickAiPriorities(snapshot, longTermMemory) : [], [snapshot, longTermMemory, role]);
  const briefing = useMemo(() => buildRickAiBriefing(snapshot, priorities, insights, pendingChanges), [snapshot, priorities, insights, pendingChanges]);
  const showModuleSuggestions = role === 'admin' && !loading && !conversationId && messages.length === 1 && messages[0]?.role === 'assistant' && messages[0]?.content === greeting.content;

  async function refreshConversations() {
    if (role !== 'admin') return;
    try { setConversations(await listRickAiConversations()); } catch { /* chat continua utilizável */ }
  }

  async function refreshMemories() {
    if (role !== 'admin') return;
    try { setMemories(await listRickAiMemories()); } catch { /* memória é opcional */ }
  }

  useEffect(() => {
    if (!open || role !== 'admin' || historyLoaded) return;
    let active = true;
    setLoading(true);
    Promise.all([loadRickAiHistory(), listRickAiConversations().catch(() => []), listRickAiMemories().catch(() => [])])
      .then(([history, recent, savedMemories]) => {
        if (!active) return;
        setConversationId(history.conversationId);
        setMessages(history.messages.length ? history.messages : [greeting]);
        setConversations(recent);
        setMemories(savedMemories);
        setHistoryLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setHistoryLoaded(true);
        notify?.('Não consegui carregar todo o histórico da RICK AI, mas o chat continua disponível.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [open, role, historyLoaded, notify]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' }); }, [messages, loading, pendingAction, quickActionForm]);

  useEffect(() => {
    setQuickActionForm(null);
    setSummaryOpen(false);
    setChangesOpen(false);
    setPriorityOpen(false);
    setBriefingOpen(false);
    setReviewedChanges([]);
  }, [page]);

  useEffect(() => {
    if (role !== 'admin') return;
    const baseline = loadRickAiChangeBaseline(activeModule.id);
    if (!baseline) {
      saveRickAiChangeBaseline(activeModule.id, currentChangeSnapshot);
      setChangeBaseline(currentChangeSnapshot);
      return;
    }
    setChangeBaseline(baseline);
  }, [activeModule.id, role]);

  function startNewConversation() {
    if (loading) return;
    setConversationId(null);
    setMessages([greeting]);
    setPendingAction(null);
    setQuickActionForm(null);
    setDraft('');
    setConversationListOpen(false);
  }

  async function switchConversation(id) {
    setQuickActionForm(null);
    if (!id || loading || id === conversationId) { setConversationListOpen(false); return; }
    setLoading(true);
    setPendingAction(null);
    try {
      const history = await loadRickAiHistory(id);
      setConversationId(history.conversationId);
      setMessages(history.messages.length ? history.messages : [greeting]);
      setConversationListOpen(false);
    } catch { notify?.('Não consegui abrir essa conversa da RICK AI.'); }
    finally { setLoading(false); }
  }

  async function sendMessage(message) {
    const cleanMessage = String(message || '').trim();
    if (!cleanMessage || loading) return;
    if (role !== 'admin') { notify?.('A RICK AI pessoal fica disponível apenas no modo ADM.'); return; }
    const recentConversation = messages.filter((item) => item?.role === 'user' || item?.role === 'assistant').slice(-12).map(({ role: messageRole, content }) => ({ role: messageRole, content }));
    const identityContext = inferRickIdentityContext({ message: cleanMessage, recentConversation, activeModule: activeModule.id });
    setDraft('');
    setMessages((current) => [...current, { role: 'user', content: cleanMessage }]);
    setLoading(true);
    try {
      const reply = await sendRickAiMessage({ message: cleanMessage, page: activeModule.id, snapshot: { ...snapshot, rickAiRecentConversation: recentConversation, rickAiLongTermMemory: longTermMemory, rickAiIdentityContext: identityContext }, conversationId });
      setMessages((current) => [...current, { role: 'assistant', content: reply.message }]);
      setPendingAction(reply.pendingAction);
      try {
        const savedConversationId = await saveRickAiExchange({ conversationId, userMessage: cleanMessage, assistantMessage: reply.message });
        setConversationId(savedConversationId);
        await refreshConversations();
      } catch { notify?.('A resposta funcionou, mas não consegui salvar essa conversa no histórico.'); }
      const candidate = extractRickAiMemoryCandidate(cleanMessage);
      if (candidate) {
        const alreadyKnown = memories.some((memory) => memory.category === candidate.category && memory.content.toLowerCase() === candidate.content.toLowerCase());
        if (!alreadyKnown) {
          try {
            await saveRickAiMemory(candidate);
            await refreshMemories();
            notify?.(`Memória salva: ${memoryLabels[candidate.category] || 'Memória'}.`);
          } catch { /* falha de memória não bloqueia a resposta */ }
        }
      }
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', content: error.message || 'Deu ruim aqui por um instante. Tenta de novo.' }]);
    } finally { setLoading(false); }
  }

  async function removeMemory(id) {
    if (role !== 'admin') return;
    if (typeof window !== 'undefined' && !window.confirm('Excluir memória da RICK AI?')) return;
    try {
      await deleteRickAiMemory(id);
      setMemories((current) => current.filter((memory) => memory.id !== id));
      notify?.('Memória excluída.');
    } catch (error) { notify?.(error.message || 'Não consegui excluir essa memória.'); }
  }

  async function submit(event) { event?.preventDefault(); await sendMessage(draft); }

  function reviewChanges() {
    if (role !== 'admin') return;
    if (changesOpen) { setChangesOpen(false); return; }
    setReviewedChanges(pendingChanges);
    setChangesOpen(true);
    saveRickAiChangeBaseline(activeModule.id, currentChangeSnapshot);
    setChangeBaseline(currentChangeSnapshot);
  }

  function openQuickAction(actionDefinition) {
    if (role !== 'admin' || pendingAction) return;
    if (!actionDefinition.fields?.length) {
      try {
        const action = buildRickAiLocalAction(actionDefinition.id, {}, activeModule.id);
        setPendingAction(action);
        setQuickActionForm(null);
      } catch (error) { notify?.(error.message || 'Não consegui preparar essa ação.'); }
      return;
    }
    setQuickActionForm(actionDefinition);
  }

  function submitQuickAction(event) {
    event.preventDefault();
    if (!quickActionForm || role !== 'admin') return;
    try {
      const formData = new FormData(event.currentTarget);
      const fields = Object.fromEntries(formData.entries());
      const action = buildRickAiLocalAction(quickActionForm.id, fields, activeModule.id);
      setPendingAction(action);
      setQuickActionForm(null);
    } catch (error) { notify?.(error.message || 'Confira os dados dessa ação.'); }
  }

  function confirmAction() {
    if (!pendingAction || role !== 'admin') return;
    try {
      const next = applyConfirmedAction(data, pendingAction);
      const accepted = setData(next);
      if (accepted === false) return;
      setMessages((current) => [...current, { role: 'assistant', content: 'Feito. Agora sim eu alterei porque você confirmou 😏' }]);
      notify?.('Ação da RICK AI confirmada.');
      setPendingAction(null);
    } catch (error) { notify?.(error.message || 'Não foi possível aplicar a ação da RICK AI.'); }
  }

  return <div className="rick-ai-root">
    {open && <section className="rick-ai-panel" aria-label="RICK AI">
      <header className="rick-ai-header">
        <div className="rick-ai-identity"><span className="rick-ai-orb" aria-hidden="true"><img src={core} alt="" width="38" height="38"/></span><div><strong>RICK AI</strong><small><span className="rick-ai-status-dot"/>{loading ? 'pensando...' : conversationId ? 'memória ativa · online' : 'nova conversa · online'}</small></div></div>
        <div className="rick-ai-header-actions">
          <button className="rick-ai-icon" aria-label="Memórias" aria-expanded={memoryListOpen} onClick={() => setMemoryListOpen((value) => !value)}><Layers3 size={19}/><span>Memórias</span></button>
          <button className="rick-ai-icon" aria-label="Histórico de conversas" aria-expanded={conversationListOpen} onClick={() => setConversationListOpen((value) => !value)}><History size={19}/><span>Histórico</span></button>
          <button className="rick-ai-icon" aria-label="Nova conversa" onClick={startNewConversation}><Plus size={19}/><span>Nova conversa</span></button>
          <button className="rick-ai-icon" aria-label="Fechar RICK AI" onClick={() => setOpen(false)}><X size={19}/><span>Fechar</span></button>
        </div>
      </header>

      <div className="rick-ai-module-context">
        <strong>{activeModule.label}</strong><span title={activeModule.focus}>{activeModule.focus}</span>
        {role === 'admin' && <button type="button" className={summaryOpen ? 'active' : ''} aria-expanded={summaryOpen} onClick={() => setSummaryOpen((value) => !value)}>Resumo</button>}
        {role === 'admin' && <button type="button" className={changesOpen ? 'active' : ''} aria-expanded={changesOpen} onClick={reviewChanges}>Mudanças{pendingChanges.length > 0 && <b className="rick-ai-changes-badge">{pendingChanges.length}</b>}</button>}
        {role === 'admin' && <button type="button" className={priorityOpen ? 'active' : ''} aria-expanded={priorityOpen} onClick={() => setPriorityOpen((value) => !value)}>Prioridade</button>}
        {role === 'admin' && <button type="button" className={briefingOpen ? 'active' : ''} aria-expanded={briefingOpen} onClick={() => setBriefingOpen((value) => !value)}>Briefing</button>}
      </div>

      <div className="rick-ai-body">
      {memoryListOpen && role === 'admin' && <div className="rick-ai-memory-list">
        <div className="rick-ai-memory-list-title"><strong>Memórias</strong><span>{memories.length}/20</span></div>
        {memories.length ? memories.map((memory) => <div className="rick-ai-memory-item" key={memory.id}><div><small>{memoryLabels[memory.category] || memory.category}</small><p>{memory.content}</p></div><button type="button" aria-label="Excluir memória" onClick={() => removeMemory(memory.id)}><Trash2 size={14}/></button></div>) : <p className="rick-ai-memory-empty">Nenhuma memória seletiva salva ainda.</p>}
      </div>}

      {summaryOpen && role === 'admin' && <div className="rick-ai-summary-card"><div className="rick-ai-summary-head"><strong>RESUMO DO MÓDULO</strong><span>{activeModule.label}</span></div>{moduleSummary.map((summaryItem) => <div className={`rick-ai-summary-row ${summaryItem.tone}`} key={summaryItem.id}><small>{summaryItem.label}</small><strong>{summaryItem.value}</strong></div>)}</div>}
      {changesOpen && role === 'admin' && <div className="rick-ai-changes-card"><div className="rick-ai-changes-head"><strong>MUDOU DESDE A ÚLTIMA VEZ</strong><span>{activeModule.label}</span></div>{reviewedChanges.length ? reviewedChanges.map((change) => <p key={change.id}>{change.message}</p>) : <p>Nada novo por aqui desde a última revisão.</p>}</div>}
      {priorityOpen && role === 'admin' && <div className="rick-ai-priority-card">
        <div className="rick-ai-priority-head"><strong>PRIORIDADE AGORA</strong><span>local · sem API</span></div>
        {priorities.length ? priorities.map((item) => <div className={`rick-ai-priority-row ${item.bucket}`} key={item.id}><small>{priorityLabels[item.bucket]}</small><div><strong>{item.title}</strong><p>{item.reason}</p></div></div>) : <p className="rick-ai-priority-empty">Nada urgente o bastante pra virar prioridade agora.</p>}
      </div>}
      {briefingOpen && role === 'admin' && <div className="rick-ai-briefing-card">
        <div className="rick-ai-briefing-head"><strong>BRIEFING DA RICK AI</strong><span>leitura local do OS</span></div>
        <div className="rick-ai-briefing-section"><small>FOCO AGORA</small>{briefing.focus ? <div className="rick-ai-briefing-focus"><strong>{briefing.focus.title}</strong>{briefing.focus.reason && <p>{briefing.focus.reason}</p>}<span>{briefing.focus.module}</span></div> : <p className="rick-ai-briefing-empty">Nenhum foco urgente apareceu agora.</p>}</div>
        {briefing.signals.length > 0 && <div className="rick-ai-briefing-section"><small>SINAIS</small>{briefing.signals.map((signal) => <p className="rick-ai-briefing-signal" key={signal.id}>{signal.text}</p>)}</div>}
        {briefing.changes.length > 0 && <div className="rick-ai-briefing-section"><small>MUDANÇAS RECENTES</small>{briefing.changes.map((change) => <p className="rick-ai-briefing-change" key={change.id}>{change.text}</p>)}</div>}
        <p className="rick-ai-briefing-conclusion">{briefing.conclusion}</p>
      </div>}

      {conversationListOpen && <div className="rick-ai-conversation-list"><div className="rick-ai-conversation-list-title"><strong>Conversas recentes</strong><button type="button" onClick={startNewConversation}><Plus size={14}/> Nova</button></div>{conversations.length ? conversations.map((conversation) => <button type="button" key={conversation.id} className={conversation.id === conversationId ? 'active' : ''} onClick={() => switchConversation(conversation.id)}><span>{conversation.title}</span><small>{shortDate(conversation.updatedAt)}</small></button>) : <p>Nenhuma conversa salva ainda.</p>}</div>}

      {insightsVisible && <div className="rick-ai-insight-card"><div className="rick-ai-insight-card-head"><strong>RICK AI NOTOU</strong><button type="button" onClick={() => setDismissedInsightSignature(currentInsightSignature)}>Dispensar</button></div>{insights.map((insight) => <p key={insight.id}>{insight.message}</p>)}</div>}
      {showModuleSuggestions && <div className="rick-ai-suggestions" aria-label="Sugestões da RICK AI">{moduleSuggestions.map((suggestion) => <button type="button" className="rick-ai-suggestion-chip" key={suggestion} onClick={() => sendMessage(suggestion)}>{suggestion}</button>)}</div>}

      <div className="rick-ai-transcript-label">CONVERSA <span>RICK AI / {activeModule.label}</span></div>
      <div className="rick-ai-messages" role="log" aria-label="Conversa com RICK AI" aria-live="polite" aria-busy={loading}>{messages.map((messageItem, index) => <div key={`${messageItem.role}-${index}`} className={`rick-ai-message ${messageItem.role}`}><span className="rick-ai-message-author">{messageItem.role === 'assistant' ? <><img src={core} alt="" width="16" height="16"/> RICK AI</> : 'VOCÊ'}</span><div>{messageItem.content}</div></div>)}{loading && <div className="rick-ai-message assistant loading"><LoaderCircle size={15} className="rick-ai-spin"/> pensando</div>}</div>

      {role === 'admin' && !pendingAction && <div className="rick-ai-quick-actions"><strong>AÇÕES RÁPIDAS</strong><div>{moduleActions.map((actionDefinition) => <button type="button" key={actionDefinition.id} onClick={() => openQuickAction(actionDefinition)}>{actionDefinition.label}</button>)}</div></div>}
      {quickActionForm && !pendingAction && <form className="rick-ai-quick-form" onSubmit={submitQuickAction}><div><strong>{quickActionForm.label}</strong><button type="button" aria-label="Cancelar ação rápida" onClick={() => setQuickActionForm(null)}><X size={14}/></button></div>{quickActionForm.fields.includes('title') && <input name="title" placeholder={quickActionForm.id === 'add_project' ? 'Nome do projeto' : quickActionForm.id === 'add_workout' ? 'Nome do treino' : 'Título'} maxLength={140} required/>}{quickActionForm.fields.includes('amount') && <input name="amount" inputMode="decimal" placeholder="Valor (ex.: 32,50)" required/>}<button type="submit"><Check size={14}/> Preparar confirmação</button></form>}
      {pendingAction && <div className="rick-ai-action-card"><small>A RICK AI QUER ALTERAR O OS</small><strong>{pendingAction.preview}</strong><p>Nada foi alterado ainda.</p><div><button type="button" className="rick-ai-cancel" onClick={() => setPendingAction(null)}>Cancelar</button><button type="button" className="rick-ai-confirm" onClick={confirmAction}><Check size={15}/> Confirmar</button></div></div>}
      <div ref={messagesEndRef}/>
      </div>
      <form className="rick-ai-composer" onSubmit={submit}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={role === 'admin' ? `Pergunte sobre ${activeModule.label}...` : 'Disponível no modo ADM'} disabled={role !== 'admin' || loading} maxLength={4000} aria-label="Mensagem para RICK AI"/><button type="submit" aria-label="Enviar mensagem" disabled={!draft.trim() || loading || role !== 'admin'}><Send size={17}/></button></form>
    </section>}
    <button type="button" className={`rick-ai-launcher ${open ? 'active' : ''}`} aria-label={open ? 'RICK AI aberta' : 'Abrir RICK AI'} onClick={() => setOpen((value) => !value)}>{open ? <X size={22}/> : <MessageCircle size={23}/>} {!open && <span className="rick-ai-launcher-label">RICK AI</span>}{!open && insightsVisible && <span className="rick-ai-insight-badge">{insights.length}</span>}</button>
  </div>;
}
