import { getShopifyAdminToken } from "@/lib/shopify-admin";

const SHOPIFY_STORE = process.env.SHOPIFY_STORE!;

export interface ResolvedCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Resolve a logged-in customer's real Shopify ID by email (so designs saved in one session are
// visible in another — same ID across login paths). Falls back to a deterministic hash ID if the
// Admin API is unavailable. Shared by /api/customer (email+sig) and the OAuth callback.
export async function resolveCustomerByEmail(email: string): Promise<ResolvedCustomer> {
  try {
    const res = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/2024-01/customers/search.json?query=email:${encodeURIComponent(email)}&limit=1`,
      { headers: { "X-Shopify-Access-Token": await getShopifyAdminToken() } },
    );
    const data = await res.json();
    const c = data.customers?.[0];
    if (c?.id) {
      return {
        id: String(c.id),
        firstName: c.first_name || email.split("@")[0],
        lastName: c.last_name || "",
        email,
      };
    }
  } catch (e) {
    console.error("[CUSTOMER-LOOKUP] Admin lookup failed, falling back to hash ID:", e);
  }

  // Deterministic fallback ID so the customer stays stable even if Admin API is down.
  const idHash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email.toLowerCase()));
  const numericId = Array.from(new Uint8Array(idHash)).slice(0, 6).reduce((acc, b) => acc * 256 + b, 0).toString();
  return { id: numericId, firstName: email.split("@")[0], lastName: "", email };
}
