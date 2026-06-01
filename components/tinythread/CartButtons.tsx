"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Design } from "@/lib/types";

interface CartButtonsProps {
  mobile: boolean;
  designs: Design[];
  isAddingToCart: boolean;
  currentPrice: number;
  theme: "dark" | "light";
  t: Record<string, string>;
  showMultipleTooltip: boolean;
  setShowMultipleTooltip: React.Dispatch<React.SetStateAction<boolean>>;
  onAddToCart: () => void;
  onOpenMultiple: () => void;
}

export function CartButtons({
  mobile, designs, isAddingToCart, currentPrice, theme, t,
  showMultipleTooltip, setShowMultipleTooltip, onAddToCart, onOpenMultiple,
}: CartButtonsProps) {
  const disabled = designs.length === 0 || isAddingToCart;

  const cartBtn = (
    <Button
      data-testid={mobile ? "add-to-cart-mobile" : "add-to-cart"}
      onClick={onAddToCart}
      disabled={disabled}
      className="w-full bg-[#d8315b] hover:bg-[#c02850] text-white font-bold py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isAddingToCart ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {t.addingToCart}
        </>
      ) : (
        <>{t.addToCart}{currentPrice > 0 ? ` — €${currentPrice}` : ""}</>
      )}
    </Button>
  );

  const multipleRow = (
    <div className="flex items-center gap-2">
      <button
        onClick={onOpenMultiple}
        disabled={designs.length === 0}
        className={cn(
          "flex-1 py-1.5 text-xs font-medium rounded-lg border border-dashed transition-all disabled:opacity-40 disabled:cursor-not-allowed",
          mobile
            ? (theme === "dark" ? "border-white/20 text-white/50 hover:border-white/40 hover:text-white/70" : "border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700")
            : (theme === "dark" ? "border-white/20 text-white/50 hover:border-white/40 hover:text-white/80 hover:bg-white/5" : "border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50")
        )}
      >
        {t.orderMultiple}
      </button>
      <div className="relative shrink-0">
        <button
          onMouseEnter={mobile ? undefined : () => setShowMultipleTooltip(true)}
          onMouseLeave={mobile ? undefined : () => setShowMultipleTooltip(false)}
          onClick={() => setShowMultipleTooltip(v => !v)}
          className={cn(
            "w-5 h-5 rounded-full border text-xs flex items-center justify-center transition-colors",
            theme === "dark" ? "border-white/25 text-white/40 hover:border-white/50 hover:text-white/70" : "border-gray-300 text-gray-400 hover:border-gray-500 hover:text-gray-600"
          )}
          aria-label="Info"
        >ℹ</button>
        {showMultipleTooltip && (
          <div className={cn(
            "absolute bottom-full right-0 mb-2 px-3 py-2 text-xs rounded-lg w-64 z-50 shadow-lg pointer-events-none",
            theme === "dark" ? "bg-neutral-800 border border-white/10 text-white/80" : "bg-white border border-gray-200 text-gray-700"
          )}>
            {t.orderMultipleTooltip}
          </div>
        )}
      </div>
    </div>
  );

  if (mobile) {
    return (
      <div className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 p-3 border-t z-50",
        theme === "dark" ? "bg-[#1e1b18] border-neutral-800" : "bg-white border-gray-200"
      )}>
        {cartBtn}
        <div className="mt-1.5">{multipleRow}</div>
      </div>
    );
  }

  return (
    <div className="hidden md:block space-y-1.5">
      {cartBtn}
      {multipleRow}
      <p className={cn("text-xs text-center", theme === "dark" ? "text-white/30" : "text-gray-400")}>
        {t.designFilesSent}
      </p>
    </div>
  );
}
