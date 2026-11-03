import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Check, History, LoaderCircle, MessageCircle, Plus, Send, X } from 'lucide-react';
import { applyConfirmedAction, buildRickAiSnapshot } from './contracts.mjs';
import { listRickAiConversations, loadRickAiHistory, saveRickAiExchange, sendRickAiMessage } from './client.mjs';
import { buildRickAiInsights } from './insights.mjs';
import { getRickAiModule, getRickAiSuggestions } from './modules.mjs';
import './rick-ai.css';

const greeting = { role: 'assistant', content: 'Tô por aqui, Rick. Manda o que você quer analisar 😏' };

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
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [dismissedInsightSignature, setDismissedInsightSignature] = useState('');
  const messagesEndRef = useRef(null);
  const snapshot = useMemo(() => buildRickAiSnapshot(data, page), [data, page]);
  const activeModule = useMemo(() => getRickAiModule(page), [page]);
  const moduleSuggestions = useMemo(() => getRickAiSuggestions(page), [page]);
  const insights = useMemo(() => role === 'admin' ? buildRickAiInsights(snapshot) : [], [snapshot, role]);
  const currentInsightSignature = useMemo(() => insights.map((item) => item.id).join('|'), [insights]);
  const insightsVisible = insights.length > 0 && currentInsightSignature !== dismissedInsightSignature;
  const showModuleSuggestions = role === 'admin'
    && !loading
    && !conversationId
    && messages.length === 1
    && messages[0]?.role === 'assistant'
    && messages[0]?.content === greeting.content;

  async function refreshConversations() {
    if (role !== 'admin') return;
    try { setConversations(await listRickAiConversations()); } catch { /* chat continua utilizável */ }
  }

  useEffect(() => {
    if (!open || role !== 'admin' || historyLoaded) return;
    let active = true;
    setLoading(true);
    Promise.all([loadRickAiHistory(), listRickAiConversations().catch(() => [])])
      .then(([history, recent]) => {
        if (!active) return;
        setConversationId(history.conversationId);
        setMessages(history.messages.length ? history.messages : [greeting]);
        setConversations(recent);
        setHistoryLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setHistoryLoaded(true);
        notify?.('Não consegui carregar o histórico da Rick IA, mas o chat continua disponível.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [open, role, historyLoaded, notify]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages, loading, pendingAction]);

  function startNewConversation() {
    if (loading) return;
    setConversationId(null);
    setMessages([greeting]);
    setPendingAction(null);
    setDraft('');
    setConversationListOpen(false);
  }

  async function switchConversation(id) {
    if (!id || loading || id === conversationId) { setConversationListOpen(false); return; }
    setLoading(true);
    setPendingAction(null);
    try {
      const history = await loadRickAiHistory(id);
      setConversationId(history.conversationId);
      setMessages(history.messages.length ? history.messages : [greeting]);
      setConversationListOpen(false);
    } catch {
      notify?.('Não consegui abrir essa conversa da Rick IA.');
    } finally { setLoading(false); }
  }

  async function sendMessage(message) {
    const cleanMessage = String(message || '').trim();
    if (!cleanMessage || loading) return;
    if (role !== 'admin') { notify?.('A Rick IA pessoal fica disponível apenas no modo ADM.'); return; }
    const recentConversation = messages.filter((item) => item?.role === 'user' || item?.role === 'assistant').slice(-12).map(({ role: messageRole, content }) => ({ role: messageRole, content }));
    setDraft('');
    setMessages((current) => [...current, { role: 'user', content: cleanMessage }]);
    setLoading(true);
    try {
      const reply = await sendRickAiMessage({ message: cleanMessage, page: activeModule.id, snapshot: { ...snapshot, rickAiRecentConversation: recentConversation }, conversationId });
      setMessages((current) => [...current, { role: 'assistant', content: reply.message }]);
      setPendingAction(reply.pendingAction);
      try {
        const savedConversationId = await saveRickAiExchange({ conversationId, userMessage: cleanMessage, assistantMessage: reply.message });
        setConversationId(savedConversationId);
        await refreshConversations();
      } catch { notify?.('A resposta funcionou, mas não consegui salvar essa conversa na memória.'); }
    } catch (error) {
      setMessages((current) => [...current, { role: 'assistant', content: error.message || 'Deu ruim aqui por um instante. Tenta de novo.' }]);
    } finally { setLoading(false); }
  }

  async function submit(event) { event?.preventDefault(); await sendMessage(draft); }

  function confirmAction() {
    if (!pendingAction || role !== 'admin') return;
    try {
      const next = applyConfirmedAction(data, pendingAction);
      const accepted = setData(next);
      if (accepted === false) return;
      setMessages((current) => [...current, { role: 'assistant', content: 'Feito. Agora sim eu alterei porque você confirmou 😏' }]);
      notify?.('Ação da Rick IA confirmada.');
      setPendingAction(null);
    } catch (error) { notify?.(error.message || 'Não foi possível aplicar a ação da Rick IA.'); }
  }

  return <div className="rick-ai-root">
    {open && <section className="rick-ai-panel" aria-label="Rick IA">
      <header className="rick-ai-header">
        <div><span className="rick-ai-orb"><Bot size={18}/></span><div><strong>RICK IA</strong><small>{loading ? 'pensando...' : conversationId ? 'memória ativa · online' : 'nova conversa · online'}</small></div></div>
        <div className="rick-ai-header-actions">
          <button className="rick-ai-icon" aria-label="Histórico de conversas" onClick={() => setConversationListOpen((value) => !value)}><History size={17}/></button>
          <button className="rick-ai-icon" aria-label="Nova conversa" onClick={startNewConversation}><Plus size={18}/></button>
          <button className="rick-ai-icon" aria-label="Fechar Rick IA" onClick={() => setOpen(false)}><X size={18}/></button>
        </div>
      </header>

      <div className="rick-ai-module-context">
        <strong>{activeModule.label}</strong>
        <span>{activeModule.focus}</span>
      </div>

      {conversationListOpen && <div className="rick-ai-conversation-list">
        <div className="rick-ai-conversation-list-title"><strong>Conversas recentes</strong><button type="button" onClick={startNewConversation}><Plus size={14}/> Nova</button></div>
        {conversations.length ? conversations.map((conversation) => <button type="button" key={conversation.id} className={conversation.id === conversationId ? 'active' : ''} onClick={() => switchConversation(conversation.id)}><span>{conversation.title}</span><small>{shortDate(conversation.updatedAt)}</small></button>) : <p>Nenhuma conversa salva ainda.</p>}
      </div>}

      {insightsVisible && <div className="rick-ai-insight-card">
        <div className="rick-ai-insight-card-head"><strong>RICK IA NOTOU</strong><button type="button" onClick={() => setDismissedInsightSignature(currentInsightSignature)}>Dispensar</button></div>
        {insights.map((insight) => <p key={insight.id}>{insight.message}</p>)}
      </div>}

      {showModuleSuggestions && <div className="rick-ai-suggestions" aria-label="Sugestões da Rick IA">
        {moduleSuggestions.map((suggestion) => <button type="button" className="rick-ai-suggestion-chip" key={suggestion} onClick={() => sendMessage(suggestion)}>{suggestion}</button>)}
      </div>}

      <div className="rick-ai-messages">
        {messages.map((messageItem, index) => <div key={`${messageItem.role}-${index}`} className={`rick-ai-message ${messageItem.role}`}>{messageItem.content}</div>)}
        {loading && <div className="rick-ai-message assistant loading"><LoaderCircle size={15} className="rick-ai-spin"/> pensando</div>}
        <div ref={messagesEndRef}/>
      </div>

      {pendingAction && <div className="rick-ai-action-card"><small>A RICK IA QUER ALTERAR O OS</small><strong>{pendingAction.preview}</strong><p>Nada foi alterado ainda.</p><div><button type="button" className="rick-ai-cancel" onClick={() => setPendingAction(null)}>Cancelar</button><button type="button" className="rick-ai-confirm" onClick={confirmAction}><Check size={15}/> Confirmar</button></div></div>}

      <form className="rick-ai-composer" onSubmit={submit}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={role === 'admin' ? `Pergunte sobre ${activeModule.label}...` : 'Disponível no modo ADM'} disabled={role !== 'admin' || loading} maxLength={4000} aria-label="Mensagem para Rick IA"/><button type="submit" aria-label="Enviar mensagem" disabled={!draft.trim() || loading || role !== 'admin'}><Send size={17}/></button></form>
    </section>}
    <button type="button" className={`rick-ai-launcher ${open ? 'active' : ''}`} aria-label={open ? 'Rick IA aberta' : 'Abrir Rick IA'} onClick={() => setOpen((value) => !value)}>{open ? <X size={22}/> : <MessageCircle size={23}/>} {!open && <span className="rick-ai-launcher-label">RICK IA</span>}{!open && insightsVisible && <span className="rick-ai-insight-badge">{insights.length}</span>}</button>
  </div>;
}
