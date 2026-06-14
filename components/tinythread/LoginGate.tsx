"use client";

import type { Lang } from "@/lib/translations";

interface LoginGateProps {
  lang: Lang;
  onLangChange: (l: Lang) => void;
  product: string;
  color: string;
}

// Shown when the app couldn't recognize the customer (no signed-email handoff, no session cookie).
// We do NOT call /api/auth/login here — OAuth is not configured, so it only throws auth_error=config.
// Instead we send the customer to the Shopify storefront login with a return_url back to the product
// page, where the "Create your design" button performs the signed-email handoff.
export function LoginGate({ lang, onLangChange, product, color }: LoginGateProps) {
  const lv = lang === "lv";

  // Storefront product handle for this product+color (matches the theme's productMap).
  const productPath = `/products/custom-embroidered-${product}-${color}`;
  // New customer accounts ignore return_url and strand on /orders, so we open login in a NEW TAB
  // (this gate stays open), then the customer comes back and opens the product page — visiting the
  // storefront while logged in is what establishes the online-store session that populates {{ customer }}.
  const loginUrl = "https://tinythread.lv/account/login";
  const productUrl = `https://tinythread.lv${productPath}`;

  return (
    <div className="min-h-screen bg-[#0f0e0d] flex flex-col items-center justify-center p-4 relative">
      {/* Language toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button
          onClick={() => onLangChange("lv")}
          className={`text-xs px-2 py-1 rounded transition-colors ${lang === "lv" ? "text-white font-bold" : "text-white/30 hover:text-white/60"}`}
        >
          LV
        </button>
        <span className="text-white/20 text-xs">/</span>
        <button
          onClick={() => onLangChange("en")}
          className={`text-xs px-2 py-1 rounded transition-colors ${lang === "en" ? "text-white font-bold" : "text-white/30 hover:text-white/60"}`}
        >
          EN
        </button>
      </div>

      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧵</div>
          <h1 className="text-white text-2xl font-bold tracking-wide">TinyThread Studio</h1>
        </div>

        {/* Card */}
        <div className="bg-[#1e1b18] border border-white/10 rounded-2xl p-7">
          <p className="text-white/55 text-sm text-center mb-6 leading-relaxed">
            {lv
              ? "Divi soļi, lai sāktu:"
              : "Two steps to start:"}
          </p>

          <a
            href={loginUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 bg-[#3e92cc] text-white font-bold rounded-lg hover:bg-[#2f7bb0] transition-colors text-sm text-center"
          >
            {lv ? "1. Pieslēgties (jaunā cilnē)" : "1. Log in (new tab)"}
          </a>

          <a
            href={productUrl}
            className="block w-full py-3 mt-3 bg-white/5 border border-white/10 text-white/80 font-semibold rounded-lg hover:bg-white/10 transition-colors text-sm text-center"
          >
            {lv ? "2. Atvērt produkta lapu" : "2. Open the product page"}
          </a>

          <p className="text-white/30 text-xs text-center mt-4 leading-relaxed">
            {lv
              ? "Pieslēdzies (1), tad atgriezies un atver produkta lapu (2). Veikala apmeklējums pēc pieslēgšanās tevi atpazīst, un poga “Izveidot savu dizainu” ielādēs studiju."
              : "Log in (1), then come back and open the product page (2). Visiting the shop while logged in recognizes you, and the “Create your design” button loads the studio."}
          </p>
        </div>

        {/* Register link */}
        <p className="text-center text-white/35 text-xs mt-4">
          {lv ? "Nav konta?" : "No account?"}{" "}
          <a
            href="https://tinythread.lv/account/register"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/55 hover:text-white/80 underline transition-colors"
          >
            {lv ? "Reģistrēties" : "Register"}
          </a>
        </p>
      </div>
    </div>
  );
}
