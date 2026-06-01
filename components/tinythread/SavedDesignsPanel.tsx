"use client";

import { cn } from "@/lib/utils";
import type { Color } from "@/lib/garment-images";

interface SavedDesignsPanelProps {
  customer: { id: string; firstName: string; lastName: string; email: string } | null;
  savedDesigns: any[];
  showSavedDesigns: boolean;
  setShowSavedDesigns: (v: boolean) => void;
  isLoadingSaved: boolean;
  theme: "dark" | "light";
  color: Color;
  t: Record<string, string>;
  onApply: (saved: any) => void;
  onDelete: (designId: string) => void;
}

export function SavedDesignsPanel({
  customer, savedDesigns, showSavedDesigns, setShowSavedDesigns,
  isLoadingSaved, theme, color, t, onApply, onDelete,
}: SavedDesignsPanelProps) {
  if (!customer) return null;

  return (
    <div className="space-y-2">
      <div className={cn(
        "flex items-center justify-between px-3 py-2 rounded-lg text-sm",
        theme === "dark" ? "bg-[#3e92cc]/20 text-[#3e92cc]" : "bg-[#3e92cc]/10 text-[#3e92cc]"
      )}>
        <span>{customer.firstName}</span>
        <button
          onClick={() => setShowSavedDesigns(!showSavedDesigns)}
          className={cn(
            "text-xs px-2 py-1 rounded transition-colors",
            theme === "dark" ? "bg-neutral-800 hover:bg-neutral-700" : "bg-white hover:bg-gray-100"
          )}
        >
          {t.myDesigns} ({savedDesigns.length})
        </button>
      </div>

      {showSavedDesigns && (
        <div className={cn(
          "rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto",
          theme === "dark" ? "bg-neutral-900 border border-neutral-800" : "bg-gray-50 border border-gray-200"
        )}>
          <p className={cn("text-xs font-semibold", theme === "dark" ? "text-white/60" : "text-gray-500")}>
            {"SAGLABĀTIE DIZAINI"}
          </p>
          {isLoadingSaved ? (
            <p className="text-xs text-center py-4 opacity-50">{t.loading}</p>
          ) : savedDesigns.length === 0 ? (
            <p className="text-xs text-center py-4 opacity-50">{"Nav saglabātu dizainu"}</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {savedDesigns.map((saved) => {
                const thumbSrc = saved.thumbnailUrl || saved.generatedImageUrl || saved.originalImageUrl || "";
                return (
                  <div
                    key={saved.id}
                    className={cn(
                      "rounded-lg overflow-hidden border-2 transition-all",
                      theme === "dark" ? "border-neutral-700 hover:border-[#3e92cc]" : "border-gray-200 hover:border-[#3e92cc]"
                    )}
                  >
                    <div
                      className="w-full aspect-[4/3] cursor-pointer overflow-hidden flex items-center justify-center"
                      style={thumbSrc.startsWith("data:") || thumbSrc.startsWith("http") ? { backgroundImage: `url(${thumbSrc})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
                      onClick={() => onApply(saved)}
                    >
                      {!thumbSrc && <span className="text-xs opacity-30">{saved.style}</span>}
                    </div>
                    <div className="flex items-center justify-between px-2 py-1" style={{ background: theme === "dark" ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)" }}>
                      <span
                        className={cn("text-[10px] truncate flex-1 cursor-pointer", theme === "dark" ? "text-white/70" : "text-gray-600")}
                        onClick={() => onApply(saved)}
                      >
                        {saved.style} - {saved.view}
                      </span>
                      <span
                        className="text-red-400 hover:text-red-300 p-0.5 cursor-pointer"
                        onClick={() => onDelete(saved.id)}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
