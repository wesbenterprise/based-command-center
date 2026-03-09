'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { agents, Agent } from '../data/agents';
import { gatewayFetch } from '../lib/gateway';

// ─── Types ──────────────────────────────────────────────────
interface TickerEvent {
  id: string;
  agentEmoji: string;
  agentName: string;
  text: string;
  ts: string;
}

interface TaskFlow {
  agentId: string;
  emoji: string;
  name: string;
  stage: 'queued' | 'in_progress' | 'completed';
}

// ─── Helpers ────────────────────────────────────────────────
function getAgentRingStatus(agent: Agent, heartbeats: Record<string, string>): 'active' | 'recent' | 'dormant' | 'error' | 'planned' {
  if (agent.status === 'planned') return 'planned';
  const lastActive = heartbeats[agent.id] || agent.lastActive;
  if (!lastActive) return 'dormant';
  const diff = Date.now() - new Date(lastActive).getTime();
  const mins = diff / 60000;
  if (mins < 5) return 'active';
  if (mins < 60) return 'recent';
  return 'dormant';
}

const ringColors: Record<string, string> = {
  active: 'var(--accent-green)',
  recent: 'var(--accent-amber)',
  dormant: 'rgba(100,100,100,0.5)',
  error: 'var(--accent-red)',
  planned: 'rgba(80,80,80,0.3)',
};

function modelBadgeClass(model: string): string {
  const m = model.toLowerCase();
  if (m.includes('opus')) return 'model-badge model-opus';
  if (m.includes('sonnet')) return 'model-badge model-sonnet';
  if (m.includes('flash')) return 'model-badge model-flash';
  if (m.includes('gpt')) return 'model-badge model-gpt';
  if (m.includes('gemini')) return 'model-badge model-gemini';
  return 'model-badge model-default';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Deterministic sparkline data per agent based on recentActivity count
function generateSparkline(agent: Agent): number[] {
  const seed = agent.id.charCodeAt(0) + agent.id.charCodeAt(agent.id.length - 1);
  const points: number[] = [];
  let val = 20 + (seed % 30);
  for (let i = 0; i < 24; i++) {
    const delta = ((seed * (i + 1) * 37) % 20) - 10;
    val = Math.max(5, Math.min(95, val + delta));
    points.push(val);
  }
  if (agent.recentActivity.length > 0) {
    points[22] = Math.min(95, points[22] + 25);
    points[23] = Math.min(95, points[23] + 30);
  }
  return points;
}

function Sparkline({ points, color }: { points: number[]; color: string }) {
  const w = 80, h = 28;
  const min = Math.min(...points), max = Math.max(...points);
  const range = max - min || 1;
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map(p => h - ((p - min) / range) * (h - 4) - 2);
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const fillD = `${d} L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} className="sparkline-wrap" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sg-${color.replace(/[^a-z]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#sg-${color.replace(/[^a-z]/gi, '')})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── Mock ticker events derived from agent activity ──────────
function buildTickerEvents(): TickerEvent[] {
  const events: TickerEvent[] = [];
  agents.forEach(a => {
    a.recentActivity.slice(0, 2).forEach(act => {
      events.push({
        id: act.id,
        agentEmoji: a.emoji,
        agentName: a.name,
        text: act.description,
        ts: act.timestamp,
      });
    });
  });
  events.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  return events.slice(0, 10);
}

// ─── Mock task flow data ──────────────────────────────────────
function buildTaskFlow(): TaskFlow[] {
  // TODO: replace with gateway API call to GET /api/sessions?kind=main
  return [
    { agentId: 'ace', emoji: '♠️', name: 'Ace', stage: 'in_progress' },
    { agentId: 'astra', emoji: '⚡', name: 'Astra', stage: 'completed' },
    { agentId: 'dezayas', emoji: '🔧', name: 'Dezayas', stage: 'in_progress' },
    { agentId: 'rybo', emoji: '🎭', name: 'Rybo', stage: 'queued' },
    { agentId: 'julius', emoji: '🌉', name: 'Julius', stage: 'completed' },
    { agentId: 'cid', emoji: '🎮', name: 'Cid', stage: 'queued' },
  ];
}

// ─── Sub-components ──────────────────────────────────────────

function LiveTicker({ events }: { events: TickerEvent[] }) {
  const items = [...events, ...events]; // duplicate for seamless loop
  return (
    <div style={{
      overflow: 'hidden',
      background: 'rgba(0,0,0,0.4)',
      borderTop: '1px solid rgba(255,0,255,0.2)',
      borderBottom: '1px solid rgba(255,0,255,0.2)',
      padding: '8px 0',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 48,
        background: 'linear-gradient(90deg, rgba(10,10,10,1), transparent)',
        zIndex: 2, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 48,
        background: 'linear-gradient(270deg, rgba(10,10,10,1), transparent)',
        zIndex: 2, pointerEvents: 'none',
      }} />
      <div className="ticker-track">
        {items.map((ev, i) => (
          <span key={`${ev.id}-${i}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            paddingRight: 48,
            fontSize: 13,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.04em',
            color: 'var(--text-secondary)',
          }}>
            <span style={{ color: 'var(--accent-magenta)' }}>▸</span>
            <span>{ev.agentEmoji}</span>
            <span style={{ color: 'var(--accent-cyan)' }}>{ev.agentName}</span>
            <span>{ev.text}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>· {relativeTime(ev.ts)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function AgentHeatmap({ heartbeats }: { heartbeats: Record<string, string> }) {
  const activeAgents = agents.filter(a => a.status !== 'planned');
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.12em', marginBottom: 12, textTransform: 'uppercase' }}>
        Activity Heatmap
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {activeAgents.map(agent => {
          const status = getAgentRingStatus(agent, heartbeats);
          const color = ringColors[status];
          const isActive = status === 'active';
          const isError = status === 'error';
          return (
            <Link key={agent.id} href={`/agent/${agent.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 64 }}>
                <div style={{
                  position: 'relative',
                  width: 52, height: 52,
                }}>
                  {/* Pulse rings */}
                  {isActive && (
                    <>
                      <span className="pulse-ring" style={{ color, inset: -5, borderWidth: 2 }} />
                      <span className="pulse-ring pulse-ring-2" style={{ color, inset: -5, borderWidth: 2 }} />
                    </>
                  )}
                  {isError && (
                    <span className="pulse-ring error-pulse" style={{ color, inset: -4 }} />
                  )}
                  {/* Avatar with ring border */}
                  <div style={{
                    width: 52, height: 52,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: `2px solid ${color}`,
                    boxShadow: isActive ? `0 0 12px ${color}40` : 'none',
                    transition: 'all 0.3s ease',
                  }}>
                    <Image src={agent.avatar} alt={agent.name} width={52} height={52} style={{ objectFit: 'cover', display: 'block' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)', letterSpacing: '0.04em', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {agent.name}
                  </div>
                  <div style={{ fontSize: 10, color }}>
                    {status === 'active' ? 'LIVE' : status === 'recent' ? 'RECENT' : status === 'error' ? 'ERROR' : 'IDLE'}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        {[
          { label: 'Active <5m', color: 'var(--accent-green)' },
          { label: 'Active <1h', color: 'var(--accent-amber)' },
          { label: 'Dormant', color: 'rgba(100,100,100,0.6)' },
          { label: 'Needs Attention', color: 'var(--accent-red)' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, display: 'inline-block', boxShadow: `0 0 4px ${l.color}` }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskFlowPipeline({ flows }: { flows: TaskFlow[] }) {
  const stages: Array<{ key: TaskFlow['stage']; label: string; color: string }> = [
    { key: 'queued', label: 'Queued', color: 'var(--text-muted)' },
    { key: 'in_progress', label: 'In Progress', color: 'var(--accent-amber)' },
    { key: 'completed', label: 'Completed', color: 'var(--accent-green)' },
  ];
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.12em', marginBottom: 12, textTransform: 'uppercase' }}>
        Task Flow
      </div>
      <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
        {stages.map((stage, si) => {
          const items = flows.filter(f => f.stage === stage.key);
          return (
            <div key={stage.key} style={{ flex: 1, position: 'relative' }}>
              {/* Arrow connector */}
              {si > 0 && (
                <div style={{
                  position: 'absolute', left: -1, top: '50%', transform: 'translateY(-50%)',
                  width: 0, height: 0,
                  borderTop: '8px solid transparent', borderBottom: '8px solid transparent',
                  borderLeft: '8px solid rgba(255,0,255,0.2)',
                  zIndex: 2,
                }} />
              )}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                border: `1px solid ${stage.color}30`,
                borderRadius: 4,
                padding: '10px 12px',
                minHeight: 80,
                marginLeft: si > 0 ? 8 : 0,
              }}>
                <div style={{ fontSize: 10, color: stage.color, fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>
                  {stage.label} ({items.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {items.map(item => (
                    <Link key={item.agentId} href={`/agent/${item.agentId}`} style={{ textDecoration: 'none' }}>
                      <div title={item.name} style={{
                        width: 32, height: 32,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${stage.color}60`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: stage.key === 'in_progress' ? `0 0 8px ${stage.color}40` : 'none',
                      }}>
                        {item.emoji}
                      </div>
                    </Link>
                  ))}
                  {items.length === 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>clear</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PulseGraphs({ heartbeats }: { heartbeats: Record<string, string> }) {
  const activeAgents = agents.filter(a => a.status !== 'planned').slice(0, 8);
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.12em', marginBottom: 12, textTransform: 'uppercase' }}>
        24h Pulse
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
        {activeAgents.map(agent => {
          const status = getAgentRingStatus(agent, heartbeats);
          const color = ringColors[status];
          const points = generateSparkline(agent);
          const lastActive = heartbeats[agent.id] || agent.lastActive;
          return (
            <Link key={agent.id} href={`/agent/${agent.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 4,
                padding: '8px 10px',
                transition: 'border-color 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-heading)', color: 'var(--text-secondary)' }}>
                    {agent.emoji} {agent.name}
                  </span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 4px ${color}` }} />
                </div>
                <Sparkline points={points} color={color} />
                {lastActive && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                    {relativeTime(lastActive)}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Fleet Status Bar ──────────────────────────────────────
function FleetStatusBar({ heartbeats }: { heartbeats: Record<string, string> }) {
  const statuses = agents.map(a => getAgentRingStatus(a, heartbeats));
  const active = statuses.filter(s => s === 'active').length;
  const recent = statuses.filter(s => s === 'recent').length;
  const dormant = statuses.filter(s => s === 'dormant').length;
  const planned = agents.filter(a => a.status === 'planned').length;
  const errors = statuses.filter(s => s === 'error').length;

  return (
    <div style={{
      display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap',
      padding: '10px 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      marginBottom: 16,
    }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em' }}>
        FLEET STATUS
      </div>
      {[
        { label: 'LIVE', count: active, color: 'var(--accent-green)' },
        { label: 'RECENT', count: recent, color: 'var(--accent-amber)' },
        { label: 'IDLE', count: dormant, color: 'var(--text-muted)' },
        { label: 'PLANNED', count: planned, color: 'rgba(100,100,100,0.6)' },
        ...(errors > 0 ? [{ label: 'ERROR', count: errors, color: 'var(--accent-red)' }] : []),
      ].map(({ label, count, color }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 5px ${color}` }} />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color, letterSpacing: '0.06em' }}>
            {count} {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main OpsPulse Component ─────────────────────────────────
export default function OpsPulse({ heartbeats }: { heartbeats: Record<string, string> }) {
  const [tickerEvents] = useState<TickerEvent[]>(buildTickerEvents);
  const [taskFlows] = useState<TaskFlow[]>(buildTaskFlow);
  // TODO: replace with gateway API call to GET /api/sessions?kind=main&messageLimit=3

  return (
    <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: '1px solid rgba(255,0,255,0.15)',
        background: 'rgba(255,0,255,0.03)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 20 }}>📡</span>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, letterSpacing: '0.12em', color: 'var(--accent-magenta)', textTransform: 'uppercase' }}>
            Ops Pulse
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Real-time fleet activity overview</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="pulse-dot" />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>LIVE</span>
        </div>
      </div>

      {/* Live Ticker */}
      <LiveTicker events={tickerEvents} />

      {/* Main Content */}
      <div style={{ padding: '20px' }}>
        <FleetStatusBar heartbeats={heartbeats} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {/* Left col: Heatmap + Task Flow */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <AgentHeatmap heartbeats={heartbeats} />
            <TaskFlowPipeline flows={taskFlows} />
          </div>
          {/* Right col: Pulse Graphs */}
          <PulseGraphs heartbeats={heartbeats} />
        </div>
      </div>
    </div>
  );
}
