# Quick Start: Sign in with Chutes (Next.js)

Add "Sign in with Chutes" to your Next.js app in 5 minutes.

## Prerequisites

- A Next.js app (App Router)
- A [Chutes.ai](https://chutes.ai) account
- A Chutes API key ([get one here](https://chutes.ai/app/api-keys))

---

## Step 1: Register Your OAuth App

Run the setup wizard from this repository:

```bash
git clone https://github.com/chutesai/sign-in-with-chutes.git
cd sign-in-with-chutes
npm install
npx tsx scripts/setup-chutes-app.ts
```

Follow the prompts to register your app. You'll receive:

- `CHUTES_OAUTH_CLIENT_ID`
- `CHUTES_OAUTH_CLIENT_SECRET`

---

## Step 2: Copy Integration Files

Copy these files to your project:

| Source                                        | Destination                                 |
| --------------------------------------------- | ------------------------------------------- |
| `packages/nextjs/lib/chutesAuth.ts`           | `src/lib/chutesAuth.ts`                     |
| `packages/nextjs/lib/serverAuth.ts`           | `src/lib/serverAuth.ts`                     |
| `packages/nextjs/hooks/useChutesSession.ts`   | `src/hooks/useChutesSession.ts`             |
| `packages/nextjs/api/auth/chutes/login.ts`    | `src/app/api/auth/chutes/login/route.ts`    |
| `packages/nextjs/api/auth/chutes/callback.ts` | `src/app/api/auth/chutes/callback/route.ts` |
| `packages/nextjs/api/auth/chutes/session.ts`  | `src/app/api/auth/chutes/session/route.ts`  |
| `packages/nextjs/api/auth/chutes/logout.ts`   | `src/app/api/auth/chutes/logout/route.ts`   |

Or copy all at once:

```bash
# From your project root
cp -r /path/to/sign-in-with-chutes/packages/nextjs/lib/* src/lib/
cp -r /path/to/sign-in-with-chutes/packages/nextjs/hooks/* src/hooks/

mkdir -p src/app/api/auth/chutes/login
mkdir -p src/app/api/auth/chutes/callback
mkdir -p src/app/api/auth/chutes/session
mkdir -p src/app/api/auth/chutes/logout

cp /path/to/sign-in-with-chutes/packages/nextjs/api/auth/chutes/login.ts src/app/api/auth/chutes/login/route.ts
cp /path/to/sign-in-with-chutes/packages/nextjs/api/auth/chutes/callback.ts src/app/api/auth/chutes/callback/route.ts
cp /path/to/sign-in-with-chutes/packages/nextjs/api/auth/chutes/session.ts src/app/api/auth/chutes/session/route.ts
cp /path/to/sign-in-with-chutes/packages/nextjs/api/auth/chutes/logout.ts src/app/api/auth/chutes/logout/route.ts
```

---

## Step 3: Set Environment Variables

Create `.env.local` in your project root:

```bash
CHUTES_OAUTH_CLIENT_ID=cid_your_client_id
CHUTES_OAUTH_CLIENT_SECRET=csc_your_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 4: Add Sign In Button

```tsx
"use client";

import { useChutesSession } from "@/hooks/useChutesSession";

export default function LoginPage() {
  const { isSignedIn, user, loginUrl, logout, loading } = useChutesSession();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (isSignedIn) {
    return (
      <div>
        <p>Welcome, {user?.username || user?.email}!</p>
        <button onClick={logout}>Sign Out</button>
      </div>
    );
  }

  return <a href={loginUrl}>Sign in with Chutes</a>;
}
```

---

## Step 5: Make Authenticated API Calls

After the user signs in, you can make API calls on their behalf:

```typescript
// src/app/api/ai/route.ts
import { NextResponse } from "next/server";
import { getServerAccessToken } from "@/lib/serverAuth";

export async function POST(req: Request) {
  const token = await getServerAccessToken();

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { message } = await req.json();

  const response = await fetch("https://api.chutes.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-ai/DeepSeek-V3-0324",
      messages: [{ role: "user", content: message }],
    }),
  });

  const data = await response.json();
  return NextResponse.json({ text: data.choices[0].message.content });
}
```

---

## That's It!

Your users can now sign in with their Chutes account and you can make AI API calls on their behalf.

## Next Steps

- Read the [Full Guide](./FULL-GUIDE.md) for customization options
- Check [Troubleshooting](./TROUBLESHOOTING.md) if you run into issues
- See the [Architecture](../../ARCHITECTURE.md) doc to understand the OAuth flow
