'use client';

import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      {/* Main content area offset by sidebar */}
      <div className="app-main">
        {children}
      </div>
    </>
  );
}
