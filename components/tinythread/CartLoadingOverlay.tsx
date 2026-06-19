"use client";

interface CartLoadingOverlayProps {
  t: Record<string, string>;
}

/**
 * Full-screen branded loading overlay shown while an order is being added to the cart.
 * Covers the entire async path (screenshot capture → blob upload → cart submit → redirect),
 * so the customer always sees progress and can't re-click. Driven by `isAddingMultiple`.
 * Sits above every modal (z-[10000]) and captures pointer events to block interaction.
 */
export function CartLoadingOverlay({ t }: CartLoadingOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0f0e0d]/85 backdrop-blur-sm"
      role="alert"
      aria-busy="true"
      aria-live="assertive"
    >
      <div className="flex flex-col items-center text-center px-6">
        {/* TinyThread-branded spinner: brand-pink ring spinning around the thread mark */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-white/10" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#d8315b] border-r-[#d8315b] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-3xl">🧵</div>
        </div>
        <p className="mt-6 text-white font-bold text-lg">{t.cartOverlayTitle}</p>
        <p className="mt-1 text-white/50 text-sm">{t.cartOverlaySubtitle}</p>
      </div>
    </div>
  );
}
