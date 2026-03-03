'use client';

interface CostStatCardProps {
  label: string;
  value: string;
  accent?: string;
  subLabel?: string;
}

export default function CostStatCard({ label, value, accent = 'var(--accent-cyan)', subLabel }: CostStatCardProps) {
  return (
    <div className="panel" style={{ textAlign: 'center', flex: 1, minWidth: 160 }}>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color: accent, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6, fontFamily: 'var(--font-heading)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </div>
      {subLabel && (
        <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{subLabel}</div>
      )}
    </div>
  );
}
