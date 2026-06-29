"use client";

import { cn } from "@/lib/utils";
import type { Product } from "@/lib/garment-images";

interface SizeQtyGridProps {
  product: Product;
  flatUnitPrice: number;
  multipleQtys: Record<string, number>;
  setMultipleQtys: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  theme: "dark" | "light";
  className?: string;
  t: Record<string, string>;
}

// Per-unit quantity control. Hoodies have fit sizes → S/M/L/XL grid, each a +/- stepper with the
// flat per-unit price. Caps are ONE SIZE → a single "how many caps" stepper (no size columns); the
// total lives under key "S" so the cart/total logic is unchanged. Garment size is fit-only (flat
// price). Shared by the Order-Multiple popup and the confirm popup so the control matches in both.
export function SizeQtyGrid({ product, flatUnitPrice, multipleQtys, setMultipleQtys, theme, className, t }: SizeQtyGridProps) {
  // Caps: single quantity stepper, no S/M / L/XL grid.
  if (product === "cap") {
    const qty = multipleQtys.S || 0;
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 p-3 rounded-xl border",
          theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50",
          className
        )}
      >
        <div className="flex flex-col items-start">
          <span className={cn("font-bold text-sm", theme === "dark" ? "text-white" : "text-gray-900")}>{t.capQtyLabel}</span>
          <span className={cn("text-xs", theme === "dark" ? "text-white/45" : "text-gray-400")}>€{flatUnitPrice}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMultipleQtys(prev => ({ ...prev, S: Math.max(0, (prev.S || 0) - 1) }))}
            disabled={qty === 0}
            className={cn(
              "w-7 h-7 shrink-0 rounded flex items-center justify-center text-sm font-bold transition-colors disabled:opacity-30",
              theme === "dark" ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            )}
          >−</button>
          <span className={cn("w-7 shrink-0 text-center text-base font-bold tabular-nums", theme === "dark" ? "text-white" : "text-gray-900")}>{qty}</span>
          <button
            onClick={() => setMultipleQtys(prev => ({ ...prev, S: Math.min(10, (prev.S || 0) + 1) }))}
            disabled={qty === 10}
            className={cn(
              "w-7 h-7 shrink-0 rounded flex items-center justify-center text-sm font-bold transition-colors disabled:opacity-30",
              theme === "dark" ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            )}
          >+</button>
        </div>
      </div>
    );
  }

  const sizes = [{ key: "S", label: "S" }, { key: "M", label: "M" }, { key: "L", label: "L" }, { key: "XL", label: "XL" }];

  return (
    <div className={cn("grid grid-cols-4 gap-2", className)}>
      {sizes.map(({ key, label }) => {
        const qty = multipleQtys[key] || 0;

        return (
          <div
            key={key}
            className={cn(
              "flex flex-col items-center gap-1.5 p-1.5 rounded-xl border min-w-0 overflow-hidden",
              theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
            )}
          >
            <span className={cn("font-bold text-sm", theme === "dark" ? "text-white" : "text-gray-900")}>{label}</span>
            <span className={cn("text-xs", theme === "dark" ? "text-white/45" : "text-gray-400")}>€{flatUnitPrice}</span>
            <div className="flex items-center gap-0.5 w-full justify-center">
              <button
                onClick={() => setMultipleQtys(prev => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) - 1) }))}
                disabled={qty === 0}
                className={cn(
                  "w-5 h-5 shrink-0 rounded flex items-center justify-center text-xs font-bold transition-colors disabled:opacity-30",
                  theme === "dark" ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                )}
              >−</button>
              <span className={cn("w-5 shrink-0 text-center text-sm font-bold tabular-nums", theme === "dark" ? "text-white" : "text-gray-900")}>{qty}</span>
              <button
                onClick={() => setMultipleQtys(prev => ({ ...prev, [key]: Math.min(10, (prev[key] || 0) + 1) }))}
                disabled={qty === 10}
                className={cn(
                  "w-5 h-5 shrink-0 rounded flex items-center justify-center text-xs font-bold transition-colors disabled:opacity-30",
                  theme === "dark" ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                )}
              >+</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
