import React, { useMemo, useState } from 'react';
import {
  Bot,
  Check,
  LoaderCircle,
  MessageCircle,
  Send,
  X,
} from 'lucide-react';
import { applyConfirmedAction, buildRickAiSnapshot } from './contracts.mjs';
import { sendRickAiMessage } from './client.mjs';
import './rick-ai.css';

export default function RickAiPanel({ data, page, role, setData, notify }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Tô por aqui, Rick. Manda o que você quer analisar 😏',
    },
  ]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const snapshot = useMemo(() => buildRickAiSnapshot(data, page), [data, page]);

  async function sendMessage(message) {
    const cleanMessage = String(message || '').trim();
    if (!cleanMessage || loading) return;
    if (role !== 'admin') {
      notify?.('A Rick IA pessoal fica disponível apenas no modo ADM.');
      return;
    }

    setDraft('');
    setMessages((current) => [...current, { role: 'user', content: cleanMessage }]);
    setLoading(true);
    try {
      const reply = await sendRickAiMessage({ message: cleanMessage, page, snapshot });
      setMessages((current) => [...current, { role: 'assistant', content: reply.message }]);
      setPendingAction(reply.pendingAction);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: error.message || 'Deu ruim aqui por um instante. Tenta de novo.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function submit(event) {
    event?.preventDefault();
    await sendMessage(draft);
  }

  function confirmAction() {
    if (!pendingAction || role !== 'admin') return;
    try {
      const next = applyConfirmedAction(data, pendingAction);
      const accepted = setData(next);
      if (accepted === false) return;
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: 'Feito. Agora sim eu alterei porque você confirmou 😏' },
      ]);
      notify?.('Ação da Rick IA confirmada.');
      setPendingAction(null);
    } catch (error) {
      notify?.(error.message || 'Não foi possível aplicar a ação da Rick IA.');
    }
  }

  return (
    <div className="rick-ai-root">
      {open && (
        <section className="rick-ai-panel" aria-label="Rick IA">
          <header className="rick-ai-header">
            <div>
              <span className="rick-ai-orb"><Bot size={18} /></span>
              <div>
                <strong>RICK IA</strong>
                <small>{loading ? 'pensando...' : 'assistente pessoal · online'}</small>
              </div>
            </div>
            <div className="rick-ai-header-actions">
              <button className="rick-ai-icon" aria-label="Fechar Rick IA" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="rick-ai-messages">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`rick-ai-message ${message.role}`}>
                {message.content}
              </div>
            ))}
            {loading && (
              <div className="rick-ai-message assistant loading">
                <LoaderCircle size={15} className="rick-ai-spin" /> pensando
              </div>
            )}
          </div>

          {pendingAction && (
            <div className="rick-ai-action-card">
              <small>A RICK IA QUER ALTERAR O OS</small>
              <strong>{pendingAction.preview}</strong>
              <p>Nada foi alterado ainda.</p>
              <div>
                <button type="button" className="rick-ai-cancel" onClick={() => setPendingAction(null)}>
                  Cancelar
                </button>
                <button type="button" className="rick-ai-confirm" onClick={confirmAction}>
                  <Check size={15} /> Confirmar
                </button>
              </div>
            </div>
          )}

          <form className="rick-ai-composer" onSubmit={submit}>
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={role === 'admin' ? 'Fala comigo...' : 'Disponível no modo ADM'}
              disabled={role !== 'admin' || loading}
              maxLength={4000}
              aria-label="Mensagem para Rick IA"
            />
            <button type="submit" aria-label="Enviar mensagem" disabled={!draft.trim() || loading || role !== 'admin'}>
              <Send size={17} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className={`rick-ai-launcher ${open ? 'active' : ''}`}
        aria-label={open ? 'Rick IA aberta' : 'Abrir Rick IA'}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={22} /> : <MessageCircle size={23} />}
        {!open && <span className="rick-ai-launcher-label">RICK IA</span>}
      </button>
    </div>
  );
}
