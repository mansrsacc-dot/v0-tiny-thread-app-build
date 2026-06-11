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
}

// Per-size quantity grid: S/M/L/XL columns (hoodie) or S/M↔"S/M","L/XL" (cap), each with a
// +/- stepper and the flat per-unit price. Garment size is fit-only (flat price). Shared by the
// Order-Multiple popup and the confirm popup so the control stays identical in both.
export function SizeQtyGrid({ product, flatUnitPrice, multipleQtys, setMultipleQtys, theme, className }: SizeQtyGridProps) {
  const sizes = product === "hoodie"
    ? [{ key: "S", label: "S" }, { key: "M", label: "M" }, { key: "L", label: "L" }, { key: "XL", label: "XL" }]
    : [{ key: "S", label: "S/M" }, { key: "M", label: "L/XL" }];

  return (
    <div className={cn("grid gap-2", product === "hoodie" ? "grid-cols-4" : "grid-cols-2", className)}>
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
