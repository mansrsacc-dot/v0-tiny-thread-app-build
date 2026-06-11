import { put, list } from "@vercel/blob";

const STORE = process.env.SHOPIFY_STORE!;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!;
const BLOB_PATH = "shopify/admin-token.json";
const BUFFER_MS = 5 * 60 * 1000; // 5-min buffer before expiry

interface CachedToken {
  token: string;
  expiresAt: number; // ms since epoch
}

let memCache: CachedToken | null = null;

async function fetchNewToken(): Promise<CachedToken> {
  const res = await fetch(`https://${STORE}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: "client_credentials" }),
  });
  if (!res.ok) throw new Error(`Shopify token refresh failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 86400) * 1000 };
}

async function readFromBlob(): Promise<CachedToken | null> {
  try {
    const { blobs } = await list({ prefix: "shopify/admin-token" });
    if (blobs.length === 0) return null;
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as CachedToken;
  } catch { return null; }
}

export async function getShopifyAdminToken(): Promise<string> {
  if (memCache && Date.now() + BUFFER_MS < memCache.expiresAt) return memCache.token;

  const blobCached = await readFromBlob();
  if (blobCached && Date.now() + BUFFER_MS < blobCached.expiresAt) {
    memCache = blobCached;
    return blobCached.token;
  }

  const fresh = await fetchNewToken();
  memCache = fresh;
  await put(BLOB_PATH, JSON.stringify(fresh), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  }).catch((e) => console.error("[SHOPIFY] Failed to cache token in Blob:", e));
  console.log("[SHOPIFY] Fresh admin token acquired, expires", new Date(fresh.expiresAt).toISOString());
  return fresh.token;
}
