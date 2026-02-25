import Image from "next/image";
import { categories, AppEntry } from "../apps.config";

function StatusBadge({ status }: { status: AppEntry["status"] }) {
  const map = {
    ONLINE: { label: "● ONLINE", cls: "status-online" },
    "IN PROGRESS": { label: "◐ IN PROGRESS", cls: "status-in-progress" },
    "COMING SOON": { label: "COMING SOON", cls: "status-coming-soon" },
  } as const;
  const s = map[status];
  return <span className={`app-status ${s.cls}`}>{s.label}</span>;
}

function AppCard({ app }: { app: AppEntry }) {
  const cardClass =
    app.status === "ONLINE"
      ? "app-card live"
      : app.status === "IN PROGRESS"
      ? "app-card in-progress"
      : "app-card coming-soon";

  const inner = (
    <div className={cardClass}>
      <div className="app-icon">{app.icon}</div>
      <div className="app-name">{app.name}</div>
      <div className="app-description">{app.description}</div>
      <StatusBadge status={app.status} />
    </div>
  );

  if (app.url) {
    return (
      <a href={app.url} target="_blank" rel="noopener noreferrer" className="app-link">
        {inner}
      </a>
    );
  }
  return inner;
}

function HeartbeatHeader() {
  const onlineCount = categories.reduce(
    (sum, cat) => sum + cat.apps.filter((a) => a.status === "ONLINE").length,
    0
  );
  const totalCount = categories.reduce((sum, cat) => sum + cat.apps.length, 0);

  return (
    <div className="heartbeat-header">
      <div className="heartbeat-row">
        <span className="heartbeat-dot" />
        <span className="heartbeat-status">ALL SYSTEMS NOMINAL</span>
        <span className="heartbeat-separator">·</span>
        <span className="heartbeat-detail">{onlineCount}/{totalCount} apps online</span>
        <span className="heartbeat-separator">·</span>
        <span className="heartbeat-detail">▶ RUN ready</span>
      </div>
      <div className="heartbeat-sub">
        Last sync: just now · Next scheduled task: Morning Brief
      </div>
    </div>
  );
}

function MorningBriefCard() {
  return (
    <div className="morning-brief">
      <div className="morning-brief-label">☀ MORNING BRIEF</div>
      <div className="morning-brief-body">
        All systems operational. No proposals pending review. Daily task batch ready to execute.
        The command center is standing by for orders.
      </div>
      <div className="morning-brief-action">
        <span className="run-badge">▶ RUN DAILY BATCH</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <div className="grid-bg" />
      <div className="horizon" />
      <div className="scanlines" />

      <div className="corner corner-tl" />
      <div className="corner corner-tr" />
      <div className="corner corner-bl" />
      <div className="corner corner-br" />

      <div className="container">
        <div className="title-container">
          <Image
            src="/based-logo.png"
            alt="BASeD Logo"
            width={180}
            height={180}
            className="based-logo"
            priority
          />
          <h1 className="title">BASeD COMMAND CENTER</h1>
          <div className="subtitle">BARNETT ADVISORY SERVICES &amp; ENTERPRISE DEVELOPMENT</div>
          <HeartbeatHeader />
        </div>

        <MorningBriefCard />

        {categories.map((cat) => (
          <div key={cat.name} className="category-section">
            <div className="category-header">
              {cat.emoji} {cat.name}
            </div>
            <div className="apps-grid">
              {cat.apps.map((app) => (
                <AppCard key={app.name} app={app} />
              ))}
            </div>
          </div>
        ))}

        <div className="footer">
          <div className="footer-text">[ BASeD COMMAND CENTER v2.0 ]</div>
          <a href="#" className="team-link">
            meet the party
          </a>
        </div>
      </div>
    </>
  );
}
