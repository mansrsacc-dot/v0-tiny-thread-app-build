"use client";

interface WelcomePopupProps {
  onShowGuide: () => void;
  onClose: () => void;
  t: Record<string, string>;
}

export function WelcomePopup({ onShowGuide, onClose, t }: WelcomePopupProps) {
  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
      <div className="bg-[#1e1b18] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">🧵</div>
        <h2 className="text-xl font-bold text-white mb-2">{t.welcome}</h2>
        <p className="text-white/50 text-sm mb-6">{t.welcomeDesc}</p>
        <p className="text-white/70 text-sm mb-6">{t.welcomePrompt}</p>
        <div className="flex gap-3 justify-center mb-4">
          <button
            onClick={onShowGuide}
            className="px-6 py-3 bg-[#3e92cc] text-white font-bold rounded-lg hover:bg-[#2f7bb0] transition-colors"
          >
            {t.showGuide}
          </button>
        </div>
        <button
          onClick={onClose}
          className="text-white/40 text-sm hover:text-white/60 transition-colors"
        >
          {t.skipGuide}
        </button>
      </div>
    </div>
  );
}
