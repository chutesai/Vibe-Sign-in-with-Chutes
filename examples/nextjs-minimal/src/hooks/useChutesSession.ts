/**
 * Chutes Session Hook
 * Copy from: packages/nextjs/hooks/useChutesSession.ts
 */

"use client";

import { useCallback, useEffect, useState } from "react";

export type ChutesUser = {
  sub?: string;
  username?: string;
  email?: string;
  name?: string;
  created_at?: string;
  [key: string]: unknown;
};

type ChutesSession = {
  signedIn: boolean;
  user?: ChutesUser | null;
};

export function useChutesSession() {
  const [session, setSession] = useState<ChutesSession>({ signedIn: false });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/chutes/session", {
        cache: "no-store",
      });
      if (!res.ok) {
        setSession({ signedIn: false });
      } else {
        const data = (await res.json()) as ChutesSession;
        setSession({ signedIn: Boolean(data.signedIn), user: data.user });
      }
    } catch {
      setSession({ signedIn: false });
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/chutes/logout", { method: "POST" });
    } finally {
      await refresh();
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    isSignedIn: session.signedIn,
    user: session.user,
    loading,
    loginUrl: "/api/auth/chutes/login",
    refresh,
    logout,
  };
}
