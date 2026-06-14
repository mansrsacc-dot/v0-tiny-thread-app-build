import { NextRequest, NextResponse } from "next/server";
import { resolveCustomerByEmail } from "@/lib/customer-lookup";
import { signSession, SESSION_COOKIE, SESSION_COOKIE_OPTS } from "@/lib/session";

const CLIENT_ID = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID!;
const REDIRECT_URI = "https://app.tinythread.lv/api/auth/callback";
// Token endpoint on the store's account domain (from the Customer Account API page).
const TOKEN_URL = "https://account.tinythread.shop/authentication/oauth/token";
const APP_URL = "https://app.tinythread.lv";

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

    // Resolve the customer and set the first-party session cookie directly — OAuth success no
    // longer depends on a follow-up client POST, and no email is exposed in the URL. The app
    // reads this cookie via GET /api/session on load.
    const customer = await resolveCustomerByEmail(email);
    const token = await signSession({
      id: customer.id, email: customer.email,
      firstName: customer.firstName, lastName: customer.lastName,
    });

    const res = NextResponse.redirect(APP_URL);
    res.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTS);
    res.cookies.delete("auth_csrf");
    return res;
  } catch (e) {
    console.error("[AUTH CALLBACK] Unexpected error:", e);
    return NextResponse.redirect(`${APP_URL}?auth_error=callback_failed`);
  }
}
