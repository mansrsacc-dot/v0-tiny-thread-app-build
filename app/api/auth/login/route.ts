import { NextRequest, NextResponse } from "next/server";

// New customer accounts — Customer Account API client (Headless channel). Client ID from
// Settings → Headless → Customer Account API; set SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID in Vercel.
const CLIENT_ID = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID!;
const REDIRECT_URI = "https://app.tinythread.lv/api/auth/callback";
// Endpoints are the store's account domain (NOT shopify.com) — from the Customer Account API page.
const AUTH_URL = "https://account.tinythread.shop/authentication/oauth/authorize";

function base64URLEncode(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...Array.from(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function sha256(plain: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(plain);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
}

export async function GET(req: NextRequest) {
  if (!CLIENT_ID) {
    console.error("[AUTH] SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID is not set");
    return NextResponse.redirect(
      "https://app.tinythread.lv?auth_error=config",
    );
  }

  const email = req.nextUrl.searchParams.get("email") ?? "";
  // Silent SSO: the app auto-starts this on load. prompt=none returns a code with no UI if a
  // Shopify customer-account session exists, or error=login_required (no UI) if not — which the
  // callback turns into ?auth_error=login_required so the app falls back to the email gate.
  const silent = req.nextUrl.searchParams.get("silent") === "1";

  // PKCE: code_verifier → code_challenge
  const codeVerifier = base64URLEncode(crypto.getRandomValues(new Uint8Array(32)));
  const codeChallenge = base64URLEncode(await sha256(codeVerifier));

  // CSRF token — stored in cookie, validated in callback
  const csrfToken = base64URLEncode(crypto.getRandomValues(new Uint8Array(16)));

  // Encode code_verifier in state so cross-device magic-link clicks still work
  // (cookie won't be available on a different browser, but the verifier will be in the URL)
  const state = base64URLEncode(
    new TextEncoder().encode(JSON.stringify({ csrf: csrfToken, cv: codeVerifier }))
  );

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: "openid email customer-account-api:full",
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    state,
    nonce: base64URLEncode(crypto.getRandomValues(new Uint8Array(16))),
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  if (email) params.set("login_hint", email);
  if (silent) params.set("prompt", "none");

  const res = NextResponse.redirect(`${AUTH_URL}?${params.toString()}`);
  res.cookies.set("auth_csrf", csrfToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 900,
    path: "/",
  });
  return res;
}
