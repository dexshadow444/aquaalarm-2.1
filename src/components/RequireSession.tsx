"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMounted, useSession } from "@/lib/store";

/**
 * Login gate: renders children only when a session exists, and redirects
 * to /login otherwise. Guards against hydration mismatches by rendering
 * nothing until the first client render (useMounted).
 */
export function RequireSession({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const mounted = useMounted();
  const router = useRouter();

  useEffect(() => {
    if (mounted && !session) router.replace("/login");
  }, [mounted, session, router]);

  if (!mounted || !session) return null;
  return <>{children}</>;
}
