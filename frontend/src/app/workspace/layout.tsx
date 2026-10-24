import React from "react";
import { WorkspaceNavStrip } from "@/components/layout/workspace-nav-strip";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1 min-h-screen bg-surface-page">
      <WorkspaceNavStrip />
      {children}
    </div>
  );
}
