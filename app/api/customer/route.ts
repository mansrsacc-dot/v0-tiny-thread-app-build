import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_STORE = process.env.SHOPIFY_STORE!;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN!;
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
// Simple secret for email signature verification (customer already authed on Shopify)
const EMAIL_SECRET = process.env.EMAIL_SECRET!;

async function storefrontQuery(query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch(`https://${SHOPIFY_STORE}/api/2024-01/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

// HMAC-SHA256 to match Shopify's {{ email | hmac_sha256: secret }} Liquid filter
async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(EMAIL_SECRET);
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(email));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, accessToken, emailSignature } = await req.json();

    // Auto-login by email + signature (from Shopify theme, customer already logged in there)
    if (email && emailSignature && !password) {
      const expectedSig = await hashEmail(email);
      if (emailSignature !== expectedSig) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }

      // Look up the real Shopify customer ID by email so this path returns the same
      // ID as password/token login — without this, designs saved in one session are
      // invisible in another because the metafield keys differ.
      try {
        const adminRes = await fetch(
          `https://${SHOPIFY_STORE}/admin/api/2024-01/customers/search.json?query=email:${encodeURIComponent(email)}&limit=1`,
          { headers: { "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN } }
        );
        const adminData = await adminRes.json();
        const shopifyCustomer = adminData.customers?.[0];
        if (shopifyCustomer?.id) {
          return NextResponse.json({
            id: String(shopifyCustomer.id),
            firstName: shopifyCustomer.first_name || email.split("@")[0],
            lastName: shopifyCustomer.last_name || "",
            email: email,
          });
        }
      } catch (e) {
        console.error("[CUSTOMER] Admin lookup failed, falling back to hash ID:", e);
      }

      // Fallback if Admin API is unavailable
      const encoder = new TextEncoder();
      const idData = encoder.encode(email.toLowerCase());
      const idHash = await crypto.subtle.digest("SHA-256", idData);
      const numericId = Array.from(new Uint8Array(idHash)).slice(0, 6).reduce((acc, b) => acc * 256 + b, 0).toString();
      return NextResponse.json({
        id: numericId,
        firstName: email.split("@")[0],
        lastName: "",
        email: email,
      });
    }

    // If we already have a Storefront access token, fetch customer info
    if (accessToken) {
      const result = await storefrontQuery(`
        query ($token: String!) {
          customer(customerAccessToken: $token) {
            id
            firstName
            lastName
            email
          }
        }
      `, { token: accessToken });

      const c = result?.data?.customer;
      if (!c) return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });

      const numericId = c.id.replace("gid://shopify/Customer/", "");
      return NextResponse.json({ id: numericId, firstName: c.firstName, lastName: c.lastName, email: c.email, accessToken });
    }

    // Login with email + password via Storefront API
    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const loginResult = await storefrontQuery(`
      mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
        customerAccessTokenCreate(input: $input) {
          customerAccessToken {
            accessToken
            expiresAt
          }
          customerUserErrors {
            code
            message
          }
        }
      }
    `, { input: { email, password } });

    const tokenData = loginResult?.data?.customerAccessTokenCreate;
    const errors = tokenData?.customerUserErrors;

    if (errors && errors.length > 0) {
      return NextResponse.json({ error: errors[0].message }, { status: 401 });
    }

    const token = tokenData?.customerAccessToken?.accessToken;
    if (!token) {
      return NextResponse.json({ error: "Login failed" }, { status: 401 });
    }

    // Fetch customer info
    const customerResult = await storefrontQuery(`
      query ($token: String!) {
        customer(customerAccessToken: $token) {
          id
          firstName
          lastName
          email
        }
      }
    `, { token });

    const c = customerResult?.data?.customer;
    if (!c) return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });

    const numericId = c.id.replace("gid://shopify/Customer/", "");

    return NextResponse.json({
      id: numericId,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      accessToken: token,
    });
  } catch (error: any) {
    console.error("[CUSTOMER] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/customer?email=xxx - generate email signature for Shopify theme
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
  const signature = await hashEmail(email);
  return NextResponse.json({ signature });
}
