/**
 * Session Route - Returns current session state
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOAuthConfig, fetchUserInfo } from "@/lib/chutesAuth";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("chutes_access_token")?.value || null;
  const storedUser = cookieStore.get("chutes_userinfo")?.value || null;

  if (!accessToken) {
    return NextResponse.json({ signedIn: false });
  }

  let user = null;
  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch {
      user = null;
    }
  }

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

