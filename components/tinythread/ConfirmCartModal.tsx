"use client";

import { Loader2 } from "lucide-react";
import type { Product } from "@/lib/garment-images";
import { SizeQtyGrid } from "@/components/tinythread/SizeQtyGrid";

interface ConfirmCartModalProps {
  hasOnlyFrontDesign: boolean;
  product: Product;
  flatUnitPrice: number;
  multipleQtys: Record<string, number>;
  setMultipleQtys: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  multipleOrderTotal: number;
  multipleOrderTotalQty: number;
  isAddingMultiple: boolean;
  onConfirm: () => void;
  onClose: () => void;
  t: Record<string, string>;
}

export function ConfirmCartModal({
  hasOnlyFrontDesign,
  product,
  flatUnitPrice,
  multipleQtys,
  setMultipleQtys,
  multipleOrderTotal,
  multipleOrderTotalQty,
  isAddingMultiple,
  onConfirm,
  onClose,
  t,
}: ConfirmCartModalProps) {
  const totalDisplay = Number.isInteger(multipleOrderTotal) ? String(multipleOrderTotal) : multipleOrderTotal.toFixed(2);
  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
      <div className="bg-[#1e1b18] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">🧵</div>
        <h2 className="text-xl font-bold text-white mb-2">{t.confirmTitle}</h2>
        <p className="text-white/50 text-sm mb-6">{t.confirmDesc}</p>
        {hasOnlyFrontDesign && (
          <p className="text-[#3e92cc]/70 text-xs mb-6">{t.confirmAddBack}</p>
        )}

        {/* Per-size quantity grid — order multiple sizes of the same design (same control as
            the "Pasūtīt vairākus vienādus" popup). Garment size is fit-only / flat price. */}
        <SizeQtyGrid
          product={product}
          flatUnitPrice={flatUnitPrice}
          multipleQtys={multipleQtys}
          setMultipleQtys={setMultipleQtys}
          theme="dark"
          className="mb-6"
          t={t}
        />

        {/* Always-visible duplicate-discount note + live discounted total */}
        <p className="text-[#3e92cc] text-xs mb-2">{t.dupDiscountNote}</p>
        <div className="flex items-center justify-between border-t border-white/10 py-3 mb-5">
          <span className="text-white/50 text-sm">{t.orderMultipleTotal}</span>
          <span className="text-white font-bold text-lg">€{totalDisplay}</span>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={multipleOrderTotalQty === 0 || isAddingMultiple}
            className="w-full px-6 py-3 bg-[#d8315b] hover:bg-[#c02850] text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isAddingMultiple ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t.orderMultipleAdding}</>
            ) : (
              t.confirmYes
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors"
          >
            {t.confirmNo}
          </button>
        </div>
      </div>
    </div>
  );
}
