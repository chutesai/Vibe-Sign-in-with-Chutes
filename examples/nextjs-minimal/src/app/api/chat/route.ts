/**
 * Chat API Route - Demo AI call using the authenticated user's token
 */

import { NextResponse } from "next/server";
import { getServerAccessToken } from "@/lib/serverAuth";

export async function POST(req: Request) {
  try {
    const token = await getServerAccessToken();

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated. Please sign in first." },
        { status: 401 }
      );
    }

    const { message } = await req.json();

    // Make AI call to Chutes API
    const response = await fetch("https://api.chutes.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3-0324",
        messages: [
          {
            role: "user",
            content: message || "Say hello!",
          },
        ],
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.message || `API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "No response";

    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

