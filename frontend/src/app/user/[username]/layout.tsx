"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/providers/auth-guard";

export default function CandidateProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const username = typeof params?.username === "string" ? params.username : undefined;

  return <ProtectedRoute requireOwnerUsername={username}>{children}</ProtectedRoute>;
}
