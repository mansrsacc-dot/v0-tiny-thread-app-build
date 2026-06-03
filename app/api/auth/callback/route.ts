import { NextRequest, NextResponse } from "next/server";

const SHOP = process.env.SHOPIFY_STORE!;
const CLIENT_ID = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID!;
const EMAIL_SECRET = process.env.EMAIL_SECRET!;
const REDIRECT_URI = "https://app.tinythread.lv/api/auth/callback";
const TOKEN_URL = `https://shopify.com/authentication/${SHOP}/oauth/token`;
const APP_URL = "https://app.tinythread.lv";

// Reproduce the same HMAC used by the Shopify Liquid theme and /api/customer
async function hashEmail(email: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(EMAIL_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(email));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

function decodeJWTPayload(token: string): Record<string, unknown> {
  const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64.padEnd(b64.length + (4 - (b64.length % 4)) % 4, "=");
  return JSON.parse(atob(padded));
}

function base64URLDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/")
    .padEnd(str.length + (4 - (str.length % 4)) % 4, "=");
  return atob(padded);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const error = searchParams.get("error");
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");

  if (error) {
    console.error("[AUTH CALLBACK] Shopify error:", error, searchParams.get("error_description"));
    return NextResponse.redirect(`${APP_URL}?auth_error=${encodeURIComponent(error)}`);
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(`${APP_URL}?auth_error=missing_params`);
  }

  // Decode state to get csrf token + code_verifier
  let csrf: string;
  let codeVerifier: string;
  try {
    const decoded = JSON.parse(base64URLDecode(stateParam));
    csrf = decoded.csrf;
    codeVerifier = decoded.cv;
  } catch {
    return NextResponse.redirect(`${APP_URL}?auth_error=invalid_state`);
  }

  // CSRF check — only enforced if cookie is present (same-device flow)
  const storedCsrf = req.cookies.get("auth_csrf")?.value;
  if (storedCsrf && storedCsrf !== csrf) {
    return NextResponse.redirect(`${APP_URL}?auth_error=csrf_mismatch`);
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        code,
        code_verifier: codeVerifier,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      console.error("[AUTH CALLBACK] Token exchange failed:", tokenRes.status, body);
      return NextResponse.redirect(`${APP_URL}?auth_error=token_exchange`);
    }

    const tokens = await tokenRes.json();

    if (!tokens.id_token) {
      console.error("[AUTH CALLBACK] No id_token in response:", tokens);
      return NextResponse.redirect(`${APP_URL}?auth_error=no_token`);
    }

    const payload = decodeJWTPayload(tokens.id_token as string);
    const email = payload.email as string | undefined;

    if (!email) {
      console.error("[AUTH CALLBACK] No email in id_token payload:", payload);
      return NextResponse.redirect(`${APP_URL}?auth_error=no_email`);
    }

    // Generate the same HMAC signature used by the Shopify theme & /api/customer
    // so the existing URL-params auto-login in app/page.tsx handles the session
    const sig = await hashEmail(email);
    const returnURL = new URL(APP_URL);
    returnURL.searchParams.set("customer_email", email);
    returnURL.searchParams.set("customer_sig", sig);

    const res = NextResponse.redirect(returnURL.toString());
    res.cookies.delete("auth_csrf");
    return res;
  } catch (e) {
    console.error("[AUTH CALLBACK] Unexpected error:", e);
    return NextResponse.redirect(`${APP_URL}?auth_error=callback_failed`);
  }
}
