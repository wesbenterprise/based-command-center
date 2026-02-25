export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Logo mark */}
      <div className="mb-8 flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20">
        <span className="text-3xl font-black text-white tracking-tighter">B</span>
      </div>

      {/* Title */}
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-center">
        BASeD <span className="text-emerald-400">Command Center</span>
      </h1>

      {/* Subtitle */}
      <p className="mt-4 text-lg text-zinc-400 text-center max-w-xl">
        Barnett Advisory Services &amp; Enterprise Development
      </p>
      <p className="mt-1 text-sm text-zinc-500 text-center">
        Operational Hub
      </p>

      {/* Status indicator */}
      <div className="mt-12 flex items-center gap-2 text-sm text-zinc-500">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        Systems Online
      </div>

      {/* Module grid placeholder */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
        {[
          { title: "Projects", desc: "Active workstreams & status" },
          { title: "Team", desc: "Agent operations & dispatch" },
          { title: "Intel", desc: "Market data & research feeds" },
        ].map((mod) => (
          <div
            key={mod.title}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-emerald-500/30 transition-colors"
          >
            <h3 className="font-semibold text-zinc-200">{mod.title}</h3>
            <p className="mt-1 text-sm text-zinc-500">{mod.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-20 mb-8 text-xs text-zinc-600">
        © {new Date().getFullYear()} Barnett Family Partners
      </footer>
    </main>
  );
}
