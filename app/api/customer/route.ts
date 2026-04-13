import { NextRequest, NextResponse } from "next/server";

// Shopify Storefront API
const SHOPIFY_STORE = "us173z-az.myshopify.com";
const STOREFRONT_TOKEN = "190fa68ec00aa40fb44afbb51c4b70e7";

// POST /api/customer
// Verify customer access token and return customer info
export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      return NextResponse.json({ error: "Missing accessToken" }, { status: 400 });
    }

    // Use Storefront API to get customer info from their access token
    const res = await fetch(
      `https://${SHOPIFY_STORE}/api/2024-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query getCustomer($token: String!) {
              customer(customerAccessToken: $token) {
                id
                firstName
                lastName
                email
              }
            }
          `,
          variables: { token: accessToken },
        }),
      }
    );

    const data = await res.json();
    const customer = data?.data?.customer;

    if (!customer) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Extract numeric ID from GID
    const numericId = customer.id.replace("gid://shopify/Customer/", "");

    return NextResponse.json({
      id: numericId,
      gid: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
    });
  } catch (error: any) {
    console.error("[CUSTOMER] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
