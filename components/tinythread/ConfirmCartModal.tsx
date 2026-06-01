"use client";

interface ConfirmCartModalProps {
  hasOnlyFrontDesign: boolean;
  onConfirm: () => void;
  onClose: () => void;
  t: Record<string, string>;
}

export function ConfirmCartModal({ hasOnlyFrontDesign, onConfirm, onClose, t }: ConfirmCartModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
      <div className="bg-[#1e1b18] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">🧵</div>
        <h2 className="text-xl font-bold text-white mb-2">{t.confirmTitle}</h2>
        <p className="text-white/50 text-sm mb-6">{t.confirmDesc}</p>
        {hasOnlyFrontDesign && (
          <p className="text-[#3e92cc]/70 text-xs mb-6">{t.confirmAddBack}</p>
        )}
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
