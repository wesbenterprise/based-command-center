'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { agents } from '../../data/agents';

// ─── Types ───────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agentId?: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function relativeTimeFull(iso: string): string {
  const rel = relativeTime(iso);
  const abs = new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return `${rel} (${abs})`;
}

// ─── Message Bubble ───────────────────────────────────────────
function MessageBubble({ msg, agent }: { msg: ChatMessage; agent: typeof agents[0] | undefined }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: 10,
      alignItems: 'flex-start',
      marginBottom: 12,
    }}>
      {!isUser && agent && (
        <div style={{
          width: 36, height: 36, flexShrink: 0,
          borderRadius: '50%', overflow: 'hidden',
          border: '1px solid rgba(0,255,0,0.3)',
        }}>
          <Image src={agent.avatar} alt={agent.name} width={36} height={36} style={{ objectFit: 'cover' }} />
        </div>
      )}
      {isUser && (
        <div style={{
          width: 36, height: 36, flexShrink: 0,
          borderRadius: '50%',
          background: 'rgba(255,0,255,0.15)',
          border: '1px solid rgba(255,0,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
        }}>
          👤
        </div>
      )}

      <div style={{ maxWidth: '72%' }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          marginBottom: 4,
          flexDirection: isUser ? 'row-reverse' : 'row',
        }}>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-heading)', color: isUser ? 'var(--accent-magenta)' : 'var(--accent-green)' }}>
            {isUser ? 'Wesley' : (agent ? `${agent.emoji} ${agent.name}` : 'Agent')}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }} title={relativeTimeFull(msg.timestamp)}>
            {relativeTime(msg.timestamp)}
          </span>
        </div>

        <div style={{
          background: isUser ? 'rgba(255,0,255,0.12)' : 'rgba(0,255,0,0.08)',
          border: `1px solid ${isUser ? 'rgba(255,0,255,0.3)' : 'rgba(0,255,0,0.2)'}`,
          borderRadius: isUser ? '12px 3px 12px 12px' : '3px 12px 12px 12px',
          padding: '10px 14px',
          fontSize: 14,
          color: 'var(--text-primary)',
          lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
        }}>
          {msg.content}
        </div>
      </div>
    </div>
  );
}

// ─── Chat Interface ───────────────────────────────────────────
function ChatInterface() {
  const searchParams = useSearchParams();
  const initialAgent = searchParams.get('agent') || 'ace';

  const [selectedAgentId, setSelectedAgentId] = useState(initialAgent);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<{ sessionKey?: string; total?: number }>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const activeAgents = agents.filter(a => a.status !== 'planned');

  // Fetch real message history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/gateway/chat/history?agent=${selectedAgentId}&limit=50`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        setSessionInfo({ sessionKey: data.sessionKey, total: data.total });
      }
      if (data.error) {
        setError(data.error);
      }
    } catch (e: any) {
      setError('Failed to fetch chat history');
    } finally {
      setLoading(false);
    }
  }, [selectedAgentId]);

  // Load history on agent change
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setError(null);
    fetchHistory();

    // Poll for new messages every 5 seconds
    pollingRef.current = setInterval(fetchHistory, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [selectedAgentId, fetchHistory]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    setError(null);

    // Optimistically add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch('/api/gateway/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgentId, message: content }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send message');
        return;
      }

      // Add agent response
      if (data.reply) {
        const agentMsg: ChatMessage = {
          id: `agent-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toISOString(),
          agentId: selectedAgentId,
        };
        setMessages(prev => [...prev, agentMsg]);
      }

      // Refresh full history after a short delay to sync
      setTimeout(fetchHistory, 2000);
    } catch (e: any) {
      setError('Failed to send message. Gateway may be offline.');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', gap: 16, maxHeight: 800 }}>
      {/* Agent Selector Sidebar */}
      <div style={{
        width: 200,
        flexShrink: 0,
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,0,255,0.15)',
        borderRadius: 6,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '10px 12px',
          borderBottom: '1px solid rgba(255,0,255,0.1)',
          fontSize: 11,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-heading)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Select Agent
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeAgents.map(agent => {
            const isActive = agent.id === selectedAgentId;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                style={{
                  width: '100%',
                  background: isActive ? 'rgba(255,0,255,0.12)' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '3px solid var(--accent-magenta)' : '3px solid transparent',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: 32, height: 32, flexShrink: 0,
                  borderRadius: '50%', overflow: 'hidden',
                  border: `1px solid ${isActive ? 'var(--accent-magenta)' : 'rgba(255,255,255,0.1)'}`,
                }}>
                  <Image src={agent.avatar} alt={agent.name} width={32} height={32} style={{ objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontFamily: 'var(--font-heading)' }}>{agent.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{agent.role}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Window */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,0,255,0.15)',
        borderRadius: 6,
        overflow: 'hidden',
      }}>
        {/* Chat Header */}
        {selectedAgent && (
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,0,255,0.1)',
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(255,0,255,0.03)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
              border: '2px solid rgba(0,255,0,0.4)',
              boxShadow: selectedAgent.status === 'active' ? '0 0 10px rgba(0,255,0,0.2)' : 'none',
            }}>
              <Image src={selectedAgent.avatar} alt={selectedAgent.name} width={40} height={40} style={{ objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>
                {selectedAgent.emoji} {selectedAgent.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: selectedAgent.status === 'active' ? 'var(--accent-green)' : 'var(--text-muted)', display: 'inline-block' }} />
                {selectedAgent.role} · {selectedAgent.model}
                {sessionInfo.total ? ` · ${sessionInfo.total} messages` : ''}
              </div>
            </div>
            <Link href={`/agent/${selectedAgent.id}`} style={{
              marginLeft: 'auto', fontSize: 11, color: 'var(--accent-cyan)',
              textDecoration: 'none', fontFamily: 'var(--font-heading)', letterSpacing: '0.05em',
            }}>
              View Profile →
            </Link>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 14, fontFamily: 'var(--font-heading)' }}>Loading conversation...</div>
            </div>
          )}
          {!loading && messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14 }}>
                No conversation history with {selectedAgent?.name || 'this agent'}
              </div>
              <div style={{ fontSize: 12, marginTop: 6 }}>Send a message to start</div>
            </div>
          )}
          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              agent={agents.find(a => a.id === (msg.agentId || selectedAgentId))}
            />
          ))}
          {sending && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(0,255,0,0.2)' }}>
                {selectedAgent && <Image src={selectedAgent.avatar} alt="" width={36} height={36} style={{ objectFit: 'cover' }} />}
              </div>
              <div style={{
                background: 'rgba(0,255,0,0.08)',
                border: '1px solid rgba(0,255,0,0.2)',
                borderRadius: '3px 12px 12px 12px',
                padding: '10px 14px',
                display: 'flex', gap: 4, alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, color: 'var(--accent-green)', fontFamily: 'var(--font-heading)' }}>
                  {selectedAgent?.name} is thinking...
                </span>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--accent-green)',
                    animation: 'pulse-green 1.2s ease infinite',
                    animationDelay: `${i * 0.2}s`,
                    display: 'inline-block',
                  }} />
                ))}
              </div>
            </div>
          )}
          {error && (
            <div style={{
              textAlign: 'center', padding: '8px 12px', marginBottom: 12,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 4, fontSize: 12, color: 'var(--accent-red)',
            }}>
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{
          borderTop: '1px solid rgba(255,0,255,0.1)',
          padding: '12px 16px',
          display: 'flex', gap: 10, alignItems: 'flex-end',
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${selectedAgent?.name || 'agent'}... (Enter to send, Shift+Enter for newline)`}
            rows={2}
            style={{
              flex: 1,
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6,
              padding: '10px 12px',
              color: 'var(--text-primary)',
              fontSize: 14,
              fontFamily: 'var(--font-body)',
              resize: 'none',
              outline: 'none',
              lineHeight: 1.5,
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,0,255,0.4)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            style={{
              background: input.trim() && !sending ? 'rgba(255,0,255,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${input.trim() && !sending ? 'var(--accent-magenta)' : 'rgba(255,255,255,0.1)'}`,
              color: input.trim() && !sending ? 'var(--accent-magenta)' : 'var(--text-muted)',
              borderRadius: 6,
              padding: '10px 18px',
              cursor: input.trim() && !sending ? 'pointer' : 'default',
              fontSize: 14,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.05em',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              height: 48,
            }}
          >
            {sending ? '...' : '▶ Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <main style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: 13 }}>
          ← Back to HQ
        </Link>
        <h1 style={{ margin: '8px 0 0', fontFamily: 'var(--font-heading)', fontSize: 22, letterSpacing: '0.08em', color: 'var(--accent-magenta)' }}>
          💬 Live Agent Chat
        </h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Real conversations with your agent fleet · Messages sent via OpenClaw Gateway
        </div>
      </div>
      <Suspense fallback={<div style={{ color: 'var(--text-muted)' }}>Loading chat...</div>}>
        <ChatInterface />
      </Suspense>
    </main>
  );
}
