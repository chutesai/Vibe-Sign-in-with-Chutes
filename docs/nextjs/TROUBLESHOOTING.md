# Troubleshooting: Sign in with Chutes (Next.js)

Common issues and solutions when integrating Chutes OAuth.

---

## Authentication Issues

### "Missing Chutes OAuth credentials" Error

**Symptom:** Error when clicking sign in button.

**Cause:** Environment variables not set.

**Solution:**
1. Check that `.env.local` exists in your project root
2. Verify these variables are set:
   ```bash
   CHUTES_OAUTH_CLIENT_ID=cid_xxx
   CHUTES_OAUTH_CLIENT_SECRET=csc_xxx
   ```
3. Restart your dev server after adding env vars

---

### "Invalid state" Error on Callback

**Symptom:** After authorizing, you see "Invalid state" error.

**Cause:** The state cookie was lost or doesn't match.

**Solutions:**
1. Make sure cookies are enabled in your browser
2. Check that `sameSite: "lax"` is set (default)
3. If testing across domains, you may need to adjust cookie settings
4. Clear all cookies and try again

---

### "Missing PKCE verifier" Error

**Symptom:** Callback fails with PKCE verifier missing.

**Cause:** The PKCE cookie expired or wasn't set.

**Solutions:**
1. Complete the login within 5 minutes (cookie TTL)
2. Make sure cookies are enabled
3. Check for cookie-blocking browser extensions

---

### "No access token returned" Error

**Symptom:** Token exchange succeeded but no token received.

**Cause:** Usually indicates an issue with the OAuth app registration.

**Solutions:**
1. Verify your `client_id` and `client_secret` are correct
2. Check that the redirect URI matches exactly
3. Re-register your OAuth app with the setup script

---

### Redirect URI Mismatch

**Symptom:** "redirect_uri_mismatch" error from Chutes.

**Cause:** The callback URL doesn't match what's registered.

**Solutions:**
1. Check your registered redirect URIs:
   ```bash
   curl https://api.chutes.ai/idp/apps \
     -H "Authorization: Bearer $CHUTES_API_KEY"
   ```
2. Make sure your `NEXT_PUBLIC_APP_URL` is correct
3. For local development, use `http://localhost:3000` (not `127.0.0.1`)
4. Re-register the app with the correct callback URL

---

## Session Issues

### Session Not Persisting

**Symptom:** User appears signed out after page refresh.

**Cause:** Cookie not being set or read correctly.

**Solutions:**
1. Check browser dev tools → Application → Cookies
2. Look for `chutes_access_token` cookie
3. Verify it's set with correct path (`/`)
4. Check for cookie size limits (cookies > 4KB may fail)

---

### Session Lost After Deploy

**Symptom:** Works locally but not in production.

**Cause:** Cookie security settings or URL mismatch.

**Solutions:**
1. Ensure `NODE_ENV=production` is set
2. Verify `NEXT_PUBLIC_APP_URL` points to your production URL
3. Make sure you're using HTTPS in production
4. Re-register OAuth app with production redirect URI

---

### "signedIn: false" Despite Valid Token

**Symptom:** Session API returns false even with token cookie present.

**Cause:** Token may be expired or invalid.

**Solutions:**
1. Check token expiry (usually 1 hour)
2. Implement token refresh logic
3. Clear cookies and re-authenticate
4. Check for clock skew between client and server

---

## API Call Issues

### "Not authenticated" from Protected API Routes

**Symptom:** API routes return 401 even when signed in.

**Cause:** Token not being read correctly.

**Solutions:**
1. Verify `getServerAccessToken()` is returning a value
2. Check that cookies are being sent with the request
3. Make sure the API route is using the correct import path
4. Test the session endpoint: `GET /api/auth/chutes/session`

---

### AI API Calls Failing After Auth

**Symptom:** Authenticated but AI calls return errors.

**Cause:** Missing `chutes:invoke` scope or insufficient credits.

**Solutions:**
1. Check that your app was registered with `chutes:invoke` scope
2. Verify the user has credits in their Chutes account
3. Check the error response for details:
   ```typescript
   if (!response.ok) {
     const error = await response.json();
     console.log(error);
   }
   ```

---

## Development Issues

### Changes Not Reflecting

**Symptom:** Code changes aren't working.

**Solutions:**
1. Restart the dev server: `npm run dev`
2. Clear `.next` cache: `rm -rf .next && npm run dev`
3. Hard refresh browser: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)

---

### TypeScript Path Errors

**Symptom:** `Cannot find module '@/lib/chutesAuth'`

**Cause:** Path aliases not configured.

**Solutions:**
1. Check `tsconfig.json` has paths configured:
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```
2. Restart TypeScript server (VS Code: Cmd+Shift+P → "Restart TS Server")

---

### Import Errors in API Routes

**Symptom:** `next/headers` or other imports failing.

**Cause:** Wrong Next.js version or incorrect file location.

**Solutions:**
1. Ensure you're on Next.js 13+ with App Router
2. API routes must be in `app/api/` directory
3. File must be named `route.ts` (not `index.ts`)

---

## Verification

### Test Your Setup

Run the verification script:

```bash
npx tsx scripts/verify-setup.ts
```

This checks:
- Environment variables are set
- API connectivity
- Credential format
- File existence

### Manual API Tests

**Check OpenID Configuration:**
```bash
curl https://idp.chutes.ai/.well-known/openid-configuration | jq .
```

**Verify Your App Registration:**
```bash
curl https://api.chutes.ai/idp/apps \
  -H "Authorization: Bearer YOUR_API_KEY" | jq .
```

**Test Token with UserInfo:**
```bash
curl https://api.chutes.ai/idp/userinfo \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

---

## Getting Help

If you're still stuck:

1. Check the [Chutes Documentation](https://docs.chutes.ai)
2. Review the [Architecture](../../ARCHITECTURE.md) doc
3. Look at the [working example](../../examples/nextjs-minimal/)
4. Open an issue on GitHub with:
   - Error message
   - Relevant code snippets
   - Environment (local/production)
   - Next.js version

