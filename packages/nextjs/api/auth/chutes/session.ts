/**
 * Session Route Handler
 *
 * Returns the current session state for the useChutesSession hook.
 * Copy this file to: src/app/api/auth/chutes/session/route.ts
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOAuthConfig, fetchUserInfo } from "@/lib/chutesAuth";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("chutes_access_token")?.value || null;
  const storedUser = cookieStore.get("chutes_userinfo")?.value || null;

  // Not signed in if no access token
  if (!accessToken) {
    return NextResponse.json({ signedIn: false });
  }

  // Try to parse cached user info
  let user = null;
  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch {
      user = null;
    }
  }

  // Fetch fresh user info if not cached
  if (!user) {
    try {
      const config = getOAuthConfig();
      user = await fetchUserInfo(config, accessToken);
    } catch {
      user = null;
    }
  }

  return NextResponse.json({
    signedIn: true,
    user,
  });
}

