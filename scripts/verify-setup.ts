#!/usr/bin/env npx tsx
/**
 * Verify Setup Script
 *
 * Validates your Chutes OAuth configuration by checking:
 * - Required environment variables are set
 * - OAuth client credentials are valid
 * - API endpoints are reachable
 *
 * Usage:
 *   npx tsx scripts/verify-setup.ts
 *   npx tsx scripts/verify-setup.ts --env-file=.env.local
 */

import * as fs from "fs";
import * as path from "path";

// ============================================================================
// Constants
// ============================================================================

const CHUTES_API_URL = "https://api.chutes.ai";

// ============================================================================
// Types
// ============================================================================

interface VerificationResult {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
}

// ============================================================================
// Environment Loading
// ============================================================================

function loadEnvFile(envPath: string): Record<string, string> {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const content = fs.readFileSync(envPath, "utf-8");
  const env: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

// ============================================================================
// Verification Checks
// ============================================================================

async function checkEnvVar(
  name: string,
  env: Record<string, string>,
  required: boolean = true
): Promise<VerificationResult> {
  const value = env[name] || process.env[name];

  if (!value) {
    return {
      name: `Environment: ${name}`,
      status: required ? "fail" : "warn",
      message: required ? "Not set (required)" : "Not set (optional)",
    };
  }

  // Basic format validation
  if (name === "CHUTES_OAUTH_CLIENT_ID" && !value.startsWith("cid_")) {
    return {
      name: `Environment: ${name}`,
      status: "warn",
      message: `Value doesn't start with 'cid_' - may be invalid`,
    };
  }

  if (name === "CHUTES_OAUTH_CLIENT_SECRET" && !value.startsWith("csc_")) {
    return {
      name: `Environment: ${name}`,
      status: "warn",
      message: `Value doesn't start with 'csc_' - may be invalid`,
    };
  }

  return {
    name: `Environment: ${name}`,
    status: "pass",
    message: `Set (${value.slice(0, 10)}...)`,
  };
}

async function checkApiReachable(): Promise<VerificationResult> {
  try {
    // Use the public health endpoint or IDP discovery URL
    const response = await fetch(`https://idp.chutes.ai/.well-known/openid-configuration`, {
      method: "GET",
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      return {
        name: "API Connectivity",
        status: "pass",
        message: "Chutes IDP is reachable",
      };
    }

    return {
      name: "API Connectivity",
      status: "fail",
      message: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      name: "API Connectivity",
      status: "fail",
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

async function checkClientCredentials(
  clientId: string,
  clientSecret: string
): Promise<VerificationResult> {
  // We can't fully verify credentials without a code exchange,
  // but we can check if they're in the right format
  
  if (!clientId || !clientSecret) {
    return {
      name: "Client Credentials",
      status: "fail",
      message: "Missing client ID or secret",
    };
  }

  if (!clientId.startsWith("cid_")) {
    return {
      name: "Client Credentials",
      status: "warn",
      message: "Client ID format looks incorrect",
    };
  }

  if (!clientSecret.startsWith("csc_")) {
    return {
      name: "Client Credentials",
      status: "warn",
      message: "Client secret format looks incorrect",
    };
  }

  return {
    name: "Client Credentials",
    status: "pass",
    message: "Format looks correct",
  };
}

async function checkRedirectUri(env: Record<string, string>): Promise<VerificationResult> {
  const appUrl = env["NEXT_PUBLIC_APP_URL"] || process.env["NEXT_PUBLIC_APP_URL"];
  const redirectUri = env["CHUTES_OAUTH_REDIRECT_URI"] || process.env["CHUTES_OAUTH_REDIRECT_URI"];

  const effectiveUri = redirectUri || (appUrl ? `${appUrl}/api/auth/chutes/callback` : null);

  if (!effectiveUri) {
    return {
      name: "Redirect URI",
      status: "warn",
      message: "Not explicitly set - will use request origin",
    };
  }

  try {
    new URL(effectiveUri);
    return {
      name: "Redirect URI",
      status: "pass",
      message: effectiveUri,
    };
  } catch {
    return {
      name: "Redirect URI",
      status: "fail",
      message: `Invalid URL: ${effectiveUri}`,
    };
  }
}

async function checkFilesExist(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = [];

  const requiredFiles = [
    { path: "src/lib/chutesAuth.ts", name: "chutesAuth.ts" },
    { path: "src/lib/serverAuth.ts", name: "serverAuth.ts" },
    { path: "src/hooks/useChutesSession.ts", name: "useChutesSession.ts" },
    { path: "src/app/api/auth/chutes/login/route.ts", name: "login route" },
    { path: "src/app/api/auth/chutes/callback/route.ts", name: "callback route" },
    { path: "src/app/api/auth/chutes/logout/route.ts", name: "logout route" },
    { path: "src/app/api/auth/chutes/session/route.ts", name: "session route" },
  ];

  for (const file of requiredFiles) {
    const exists = fs.existsSync(file.path);
    results.push({
      name: `File: ${file.name}`,
      status: exists ? "pass" : "warn",
      message: exists ? "Found" : `Not found at ${file.path}`,
    });
  }

  return results;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║           🔍 Sign in with Chutes - Verify Setup            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("\n");

  // Parse args for env file
  let envPath = ".env.local";
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--env-file=")) {
      envPath = arg.slice("--env-file=".length);
    }
  }

  // Load environment
  console.log(`Loading environment from: ${envPath}`);
  const env = loadEnvFile(envPath);
  console.log("");

  // Run checks
  const results: VerificationResult[] = [];

  // Environment checks
  results.push(await checkEnvVar("CHUTES_OAUTH_CLIENT_ID", env, true));
  results.push(await checkEnvVar("CHUTES_OAUTH_CLIENT_SECRET", env, true));
  results.push(await checkEnvVar("CHUTES_OAUTH_SCOPES", env, false));
  results.push(await checkEnvVar("NEXT_PUBLIC_APP_URL", env, false));

  // API connectivity
  results.push(await checkApiReachable());

  // Credential format
  const clientId = env["CHUTES_OAUTH_CLIENT_ID"] || process.env["CHUTES_OAUTH_CLIENT_ID"] || "";
  const clientSecret = env["CHUTES_OAUTH_CLIENT_SECRET"] || process.env["CHUTES_OAUTH_CLIENT_SECRET"] || "";
  results.push(await checkClientCredentials(clientId, clientSecret));

  // Redirect URI
  results.push(await checkRedirectUri(env));

  // File checks (only if in a project directory)
  if (fs.existsSync("package.json")) {
    const fileResults = await checkFilesExist();
    results.push(...fileResults);
  }

  // Print results
  console.log("Verification Results:");
  console.log("─".repeat(60));

  let hasErrors = false;
  let hasWarnings = false;

  for (const result of results) {
    const icon = result.status === "pass" ? "✅" : result.status === "warn" ? "⚠️ " : "❌";
    console.log(`${icon} ${result.name}`);
    console.log(`   ${result.message}`);
    
    if (result.status === "fail") hasErrors = true;
    if (result.status === "warn") hasWarnings = true;
  }

  console.log("");
  console.log("─".repeat(60));

  if (hasErrors) {
    console.log("❌ Verification failed. Please fix the errors above.");
    process.exit(1);
  } else if (hasWarnings) {
    console.log("⚠️  Verification passed with warnings. Review the warnings above.");
    process.exit(0);
  } else {
    console.log("✅ All checks passed! Your setup looks good.");
    process.exit(0);
  }
}

main();

