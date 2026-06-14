// First-party signed session cookie for app.tinythread.lv. Survives mobile Safari ITP /
// in-app browsers far better than localStorage (which is the historical fragility). Signed with
// EMAIL_SECRET (HMAC-SHA256) — tamper-proof; no DB needed.
const SESSION_SECRET = process.env.EMAIL_SECRET!;

export const SESSION_COOKIE = "tt_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days (seconds)
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE * 1000;

export interface SessionData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  iat: number; // issued-at (ms)
}

export const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

async function hmacHex(data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// UTF-8-safe base64url (names may contain Latvian characters)
function b64urlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function b64urlDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/")
    .padEnd(str.length + (4 - (str.length % 4)) % 4, "=");
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export async function signSession(data: Omit<SessionData, "iat">): Promise<string> {
  const payload: SessionData = { ...data, iat: Date.now() };
  const body = b64urlEncode(JSON.stringify(payload));
  const sig = await hmacHex(body);
  return `${body}.${sig}`;
}

export async function verifySession(value: string | undefined | null): Promise<SessionData | null> {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot < 1) return null;
  const body = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (sig !== (await hmacHex(body))) return null;
  try {
    const data = JSON.parse(b64urlDecode(body)) as SessionData;
    if (!data.iat || Date.now() - data.iat > SESSION_MAX_AGE_MS) return null;
    if (!data.id || !data.email) return null;
    return data;
  } catch {
    return null;
  }
}
