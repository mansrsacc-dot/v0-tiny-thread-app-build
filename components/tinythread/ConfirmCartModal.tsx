"use client";

interface ConfirmCartModalProps {
  hasOnlyFrontDesign: boolean;
  quantity: number;
  onQuantityChange: (q: number) => void;
  onConfirm: () => void;
  onClose: () => void;
  t: Record<string, string>;
}

export function ConfirmCartModal({ hasOnlyFrontDesign, quantity, onQuantityChange, onConfirm, onClose, t }: ConfirmCartModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
      <div className="bg-[#1e1b18] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">🧵</div>
        <h2 className="text-xl font-bold text-white mb-2">{t.confirmTitle}</h2>
        <p className="text-white/50 text-sm mb-6">{t.confirmDesc}</p>
        {hasOnlyFrontDesign && (
          <p className="text-[#3e92cc]/70 text-xs mb-6">{t.confirmAddBack}</p>
        )}

        {/* Quantity selector */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <span className="text-white/60 text-sm">{t.quantity ?? "Qty"}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-lg flex items-center justify-center disabled:opacity-30 transition-colors"
            >−</button>
            <span className="w-8 text-center text-white font-bold text-lg tabular-nums">{quantity}</span>
            <button
              onClick={() => onQuantityChange(Math.min(10, quantity + 1))}
              disabled={quantity >= 10}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-lg flex items-center justify-center disabled:opacity-30 transition-colors"
            >+</button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full px-6 py-3 bg-[#d8315b] hover:bg-[#c02850] text-white font-bold rounded-lg transition-colors"
          >
            {t.confirmYes}
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
