import { NextRequest, NextResponse } from "next/server";

const SHOPIFY_STORE = "us173z-az.myshopify.com";
const STOREFRONT_TOKEN = "190fa68ec00aa40fb44afbb51c4b70e7";

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

// POST /api/customer
// Login with email + password via Storefront API, returns customer info + access token
export async function POST(req: NextRequest) {
  try {
    const { email, password, accessToken } = await req.json();

    // If we already have an access token, just fetch customer info
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

    // Login with email + password
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

    // Fetch customer info with the new token
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
