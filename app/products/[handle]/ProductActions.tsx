"use client";

import { useState } from "react";
import Link from "next/link";

interface Variant {
  id: string;
  title: string;
  price: { amount: string };
  availableForSale: boolean;
}

interface Props {
  variants: Variant[];
  shopifyStoreUrl: string;
  studioUrl: string;
  pageUrl: string;
  productTitle: string;
}

export function ProductActions({ variants, shopifyStoreUrl, studioUrl, pageUrl, productTitle }: Props) {
  const available = variants.filter(v => v.availableForSale);
  const [selectedId, setSelectedId] = useState(available[0]?.id ?? variants[0]?.id ?? "");
  const [copied, setCopied] = useState(false);

  const handleAddToCart = () => {
    if (!selectedId) return;
    // Extract numeric variant ID from GID (gid://shopify/ProductVariant/123)
    const numericId = selectedId.split("/").pop() ?? selectedId;
    const form = document.createElement("form");
    form.method = "POST";
    form.action = `${shopifyStoreUrl}/cart/add`;
    form.style.display = "none";
    const addInput = (name: string, value: string) => {
      const el = document.createElement("input");
      el.type = "hidden"; el.name = name; el.value = value;
      form.appendChild(el);
    };
    addInput("id", numericId);
    addInput("quantity", "1");
    addInput("return_to", "/cart");
    document.body.appendChild(form);
    form.submit();
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(pageUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Variant selector */}
      {variants.length > 1 && (
        <div>
          <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Variants</label>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#3e92cc]/60"
          >
            {variants.map(v => (
              <option key={v.id} value={v.id} disabled={!v.availableForSale}>
                {v.title}{!v.availableForSale ? " – Nav pieejams" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Add to cart */}
      <button
        onClick={handleAddToCart}
        disabled={!selectedId || !available.some(v => v.id === selectedId)}
        className="w-full py-3 bg-[#d8315b] hover:bg-[#c02850] text-white font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Pievienot grozam
      </button>

      {/* Login to design (studio CTA) */}
      <Link
        href={studioUrl}
        className="w-full py-3 border border-[#3e92cc]/60 text-[#3e92cc] hover:bg-[#3e92cc]/10 font-semibold rounded-lg transition-colors text-center block no-underline text-sm"
      >
        Personalizēt ar izšuvumu →
      </Link>

      {/* Copy link */}
      <button
        onClick={handleCopyLink}
        className="text-xs text-white/40 hover:text-white/60 transition-colors"
      >
        {copied ? "✓ Saite nokopēta" : "Kopēt saiti"}
      </button>
    </div>
  );
}
