"use client";

import { GUIDE_CONTENT, type Lang } from "@/lib/translations";

interface GuideModalProps {
  lang: Lang;
  guideStep: number;
  setGuideStep: (n: number) => void;
  onClose: () => void;
  t: Record<string, string>;
}

export function GuideModal({ lang, guideStep, setGuideStep, onClose, t }: GuideModalProps) {
  const content = GUIDE_CONTENT[lang];
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)" }}
    >
      <div className="bg-[#0f0f0f] border border-white/8 rounded-t-3xl sm:rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl">
        <div
          className="relative flex flex-col items-center justify-center px-6 pt-8 pb-6 text-center"
          style={{ background: "linear-gradient(160deg, #1a1f2e 0%, #0f0f0f 100%)" }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-white/30 hover:text-white/70 transition-colors text-xs"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >✕</button>
          <div
            className="w-24 h-24 flex items-center justify-center rounded-2xl mb-5"
            style={{ background: "linear-gradient(135deg, rgba(62,146,204,0.18) 0%, rgba(62,146,204,0.04) 100%)", border: "1px solid rgba(62,146,204,0.2)" }}
          >
            <span className="text-5xl leading-none select-none">{content[guideStep].icon}</span>
          </div>
          <h3 className="text-xl font-bold text-white leading-snug tracking-tight">
            {content[guideStep].title}
          </h3>
        </div>

        <div className="px-7 py-5">
          <p className="text-white/55 text-sm leading-relaxed">{content[guideStep].text}</p>
        </div>

        <div
          className="px-7 pb-7 pt-3 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="text-xs font-semibold text-white/25 tabular-nums tracking-wide">
            {guideStep + 1} / {content.length}
          </span>
          <div className="flex items-center gap-2">
            {guideStep > 0 && (
              <button
                onClick={() => setGuideStep(guideStep - 1)}
                className="px-4 py-2 text-sm text-white/40 hover:text-white/70 rounded-xl transition-colors"
                style={{ background: "transparent" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {t.back_btn}
              </button>
            )}
            <button
              onClick={() => {
                if (guideStep < content.length - 1) {
                  setGuideStep(guideStep + 1);
                } else {
                  onClose();
                }
              }}
              className="px-5 py-2 bg-[#3e92cc] text-white font-bold rounded-xl text-sm hover:bg-[#2f7bb0] transition-colors"
            >
              {guideStep < content.length - 1 ? t.next : t.startCreating}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
