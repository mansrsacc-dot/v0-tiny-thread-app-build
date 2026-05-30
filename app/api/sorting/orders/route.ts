import { NextRequest, NextResponse } from "next/server";
import { put, list } from "@vercel/blob";
import { getShopifyAdminToken } from "@/lib/shopify-admin";

const STATUSES_PATH = "sorting/order-statuses.json";

function verifyAuth(req: NextRequest): boolean {
  const auth = req.headers.get("x-sorting-auth");
  return !!process.env.SORTING_PASSWORD && auth === process.env.SORTING_PASSWORD;
}

async function getStatuses(): Promise<Record<string, string>> {
  try {
    const { blobs } = await list({ prefix: "sorting/order-statuses" });
    if (blobs.length === 0) return {};
    const res = await fetch(blobs[0].url, { cache: "no-store" });
    return await res.json();
  } catch {
    return {};
  }
}

async function saveStatuses(statuses: Record<string, string>): Promise<void> {
  await put(STATUSES_PATH, JSON.stringify(statuses), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const shopifyRes = await fetch(
      `https://${process.env.SHOPIFY_STORE}/admin/api/2024-01/orders.json?status=open&limit=100`,
      {
        headers: { "X-Shopify-Access-Token": await getShopifyAdminToken() },
        cache: "no-store",
      }
    );

    if (!shopifyRes.ok) {
      throw new Error(`Shopify API error: ${shopifyRes.status}`);
    }

    const shopifyData = await shopifyRes.json();
    const rawOrders: any[] = shopifyData.orders || [];

    const statuses = await getStatuses();

    const orders = rawOrders.map((order: any) => {
      const lineItems: any[] = order.line_items || [];

      const getProp = (item: any, name: string): string | null =>
        item.properties?.find((p: any) => p.name === name)?.value ?? null;

      const processedItems = lineItems.map((item: any) => ({
        title: item.title || "",
        variantTitle: item.variant_title || "",
        quantity: item.quantity || 1,
        style: getProp(item, "Embroidery Style"),
        size: getProp(item, "Embroidery Size"),
        placement: getProp(item, "Placement"),
        licensePlate: getProp(item, "License Plate"),
        textEmbroidery: getProp(item, "Text Embroidery"),
        designCount: getProp(item, "Design Count"),
        orderType: getProp(item, "Order Type"),
      }));

      return {
        id: String(order.id),
        orderNumber: order.order_number,
        customer: order.customer
          ? `${order.customer.first_name || ""} ${order.customer.last_name || ""}`.trim() || "Nav norādīts"
          : "Nav norādīts",
        email: order.email || order.customer?.email || "",
        createdAt: order.created_at,
        lineItems: processedItems,
        status: statuses[String(order.id)] || "gaida",
        totalPrice: order.total_price,
        currency: order.currency || "EUR",
        fulfillmentStatus: order.fulfillment_status || "unfulfilled",
      };
    });

    // Sort: newest first
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ orders });
  } catch (e) {
    console.error("[SORTING] Orders fetch error:", e);
    return NextResponse.json({ error: "Kļūda ielādējot pasūtījumus" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId, status } = await req.json();
    if (!orderId || !status) {
      return NextResponse.json({ error: "Trūkst datu" }, { status: 400 });
    }

    const statuses = await getStatuses();
    statuses[orderId] = status;
    await saveStatuses(statuses);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[SORTING] Status update error:", e);
    return NextResponse.json({ error: "Kļūda saglabājot statusu" }, { status: 500 });
  }
}
