"use client";

import { cn } from "@/lib/utils";

interface MaxDesignsPopupProps {
  theme: "dark" | "light";
  onClose: () => void;
  t: Record<string, string>;
}

export function MaxDesignsPopup({ theme, onClose, t }: MaxDesignsPopupProps) {
  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
      <div className={cn(
        "rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl",
        theme === "dark" ? "bg-[#1e1b18] border border-white/10" : "bg-white border border-gray-200"
      )}>
        <div className="text-4xl mb-4">🧵</div>
        <h2 className={cn("text-lg font-bold mb-3", theme === "dark" ? "text-white" : "text-gray-900")}>
          {t.maxDesignsTitle}
        </h2>
        <p className={cn("text-sm mb-6", theme === "dark" ? "text-white/60" : "text-gray-500")}>
          {t.maxDesignsBody}
        </p>
        <button
          onClick={onClose}
          className="px-8 py-3 bg-[#3e92cc] text-white font-bold rounded-lg hover:bg-[#2f7bb0] transition-colors"
        >
          {t.maxDesignsOk}
        </button>
      </div>
    </div>
  );
}
