import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const clean = username.toLowerCase().trim();
  return {
    title: `@${clean} — Verified Candidate Profile & Video Pitch`,
    description: `Watch @${clean}'s 30-second video elevator pitch, verified career timeline, and skill credentials on Belooga.`,
    alternates: { canonical: `/public/${clean}` },
    openGraph: {
      title: `@${clean} — Verified Candidate Profile | Belooga`,
      description: `Watch @${clean}'s 30-second video elevator pitch and verified career timeline on Belooga.`,
      url: `/public/${clean}`,
    },
  };
}

export default function PublicProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
