import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/tinythread/SiteFooter";
import { ProductActions } from "./ProductActions";

const STORE_DOMAIN = process.env.SHOPIFY_STORE ?? "us173z-az.myshopify.com";
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN ?? "";
const SHOPIFY_STORE_URL = "https://tinythread.lv";
const FALLBACK_IMAGE = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-black-front-L8JNMTYtT2Xneu4ym3Ax12fau4pIHq.jpg";

interface Variant {
  id: string;
  title: string;
  price: { amount: string };
  availableForSale: boolean;
}

interface Product {
  id: string;
  title: string;
  handle: string;
  descriptionHtml: string;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  images: { edges: { node: { url: string; altText: string | null } }[] };
  variants: { edges: { node: Variant }[] };
}

async function fetchProduct(handle: string): Promise<Product | null> {
  try {
    const res = await fetch(`https://${STORE_DOMAIN}/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({
        query: `query($handle: String!) {
          productByHandle(handle: $handle) {
            id title handle descriptionHtml
            priceRange { minVariantPrice { amount currencyCode } }
            images(first: 5) { edges { node { url altText } } }
            variants(first: 20) {
              edges { node { id title price { amount } availableForSale } }
            }
          }
        }`,
        variables: { handle },
      }),
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.productByHandle ?? null;
  } catch {
    return null;
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const product = await fetchProduct(handle);
  if (!product) notFound();

  const images = product.images.edges.map(e => e.node);
  const mainImage = images[0]?.url ?? FALLBACK_IMAGE;
  const variants = product.variants.edges.map(e => e.node);
  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  const currency = product.priceRange.minVariantPrice.currencyCode;
  const pageUrl = `https://app.tinythread.lv/products/${handle}`;

  // Determine if it's a hoodie or cap for studio link
  const isHoodie = product.title.toLowerCase().includes("hoodie") || product.title.toLowerCase().includes("džemperis");
  const productType = isHoodie ? "hoodie" : "cap";

  return (
    <div className="min-h-screen bg-[#1e1b18] text-white flex flex-col">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline hover:opacity-80 transition-opacity">
          <span className="font-semibold text-white">TinyThread</span>
          <span className="text-[#3e92cc] text-xs font-medium">STUDIO</span>
        </Link>
        <Link href="/products" className="text-sm text-white/50 hover:text-white transition-colors">← Produkti</Link>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Image gallery */}
          <div className="space-y-3">
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-neutral-900">
              <Image src={mainImage} alt={images[0]?.altText ?? product.title} fill className="object-cover" priority />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.slice(1).map((img, i) => (
                  <div key={i} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-neutral-900">
                    <Image src={img.url} alt={img.altText ?? ""} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
              <p className="text-2xl font-semibold text-white">
                {isNaN(price) ? "—" : `€${price.toFixed(2)}`}
              </p>
            </div>

            {product.descriptionHtml && (
              <div
                className="text-sm text-white/60 leading-relaxed prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            )}

            {/* CTA buttons */}
            <ProductActions
              variants={variants}
              shopifyStoreUrl={SHOPIFY_STORE_URL}
              studioUrl={`/?product=${productType}`}
              pageUrl={pageUrl}
              productTitle={product.title}
            />

            {/* Social share */}
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Dalīties</p>
              <div className="flex gap-3">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white/70 hover:text-white transition-colors"
                >Facebook</a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(product.title)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white/70 hover:text-white transition-colors"
                >X / Twitter</a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
