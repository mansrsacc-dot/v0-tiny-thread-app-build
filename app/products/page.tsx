import Link from "next/link";
import Image from "next/image";
import { SiteFooter } from "@/components/tinythread/SiteFooter";

const STORE = process.env.SHOPIFY_STORE ?? "us173z-az.myshopify.com";
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN ?? "";

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  images: { edges: { node: { url: string; altText: string | null } }[] };
}

// Fallback garment images from existing Blob storage
const FALLBACK_IMAGE = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-black-front-L8JNMTYtT2Xneu4ym3Ax12fau4pIHq.jpg";

async function fetchProducts(): Promise<ShopifyProduct[]> {
  try {
    const res = await fetch(`https://${STORE}/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({
        query: `{
          products(first: 24) {
            edges {
              node {
                id title handle
                priceRange { minVariantPrice { amount currencyCode } }
                images(first: 1) { edges { node { url altText } } }
              }
            }
          }
        }`,
      }),
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data?.products?.edges ?? []).map((e: { node: ShopifyProduct }) => e.node);
  } catch {
    return [];
  }
}

export default async function ProductsPage() {
  const products = await fetchProducts();

  return (
    <div className="min-h-screen bg-[#1e1b18] text-white flex flex-col">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline hover:opacity-80 transition-opacity">
          <span className="font-semibold text-white">TinyThread</span>
          <span className="text-[#3e92cc] text-xs font-medium">STUDIO</span>
        </Link>
        <Link href="/kontakti" className="text-sm text-white/50 hover:text-white transition-colors">Kontakti</Link>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Produkti</h1>
        <p className="text-white/50 text-sm mb-8">Izvēlies produktu un personalizē ar izšuvumu</p>

        {products.length === 0 ? (
          <p className="text-white/40 text-sm">Produkti pagaidām nav pieejami.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => {
              const imageUrl = product.images.edges[0]?.node.url ?? FALLBACK_IMAGE;
              const imageAlt = product.images.edges[0]?.node.altText ?? product.title;
              const price = parseFloat(product.priceRange.minVariantPrice.amount);
              const currency = product.priceRange.minVariantPrice.currencyCode;
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.handle}`}
                  className="group flex flex-col rounded-xl border border-white/10 bg-white/5 hover:border-[#3e92cc]/50 hover:bg-white/8 transition-all overflow-hidden no-underline"
                >
                  {/* Fixed-aspect image container — same height regardless of image presence */}
                  <div className="relative w-full aspect-square bg-neutral-900 overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={imageAlt}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                  {/* Card body — consistent padding */}
                  <div className="flex flex-col gap-1 p-3 flex-1">
                    <p className="text-sm font-medium text-white leading-snug line-clamp-2">{product.title}</p>
                    <p className="text-xs text-white/50 mt-auto">
                      no €{isNaN(price) ? "—" : price.toFixed(2)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
