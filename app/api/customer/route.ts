import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_STORE = "us173z-az.myshopify.com";
const STOREFRONT_TOKEN = "190fa68ec00aa40fb44afbb51c4b70e7";
// Simple secret for email signature verification (customer already authed on Shopify)
const EMAIL_SECRET = "tinythread_2026_secret";

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

// Simple hash function for email signature
async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase() + EMAIL_SECRET);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
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
      // Customer is verified via Shopify theme - use email as a simple identifier
      // Generate a stable numeric ID from email for metafield storage
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
