"use client";

import { cn } from "@/lib/utils";
import type { View, Color, Size } from "@/lib/garment-images";
import { TEXT_FONTS, TEXT_COLOR_PALETTE, TEXT_SIZE_PX, TEXT_SIZE_CONSTRAINTS, SLEEVE_TEXT_MAX_CHARS, TEXT_MAX_CHARS, TEXT_MAX_CHARS_MULTIROW } from "@/lib/constants";

interface TextModalProps {
  view: View;
  color: Color;
  t: Record<string, string>;
  editingTextId: string | null;
  textInput: string;
  setTextInput: (v: string) => void;
  textFontInput: string;
  setTextFontInput: (v: string) => void;
  textColorInput: string;
  setTextColorInput: (v: string) => void;
  textMultiRowInput: boolean;
  setTextMultiRowInput: (v: boolean) => void;
  textSizeInput: "S" | "M" | "L";
  setTextSizeInput: (v: "S" | "M" | "L") => void;
  sleeveHasPhoto: boolean;
  onEditSizeChange: (size: "S" | "M") => void;
  onClose: () => void;
  onConfirm: () => void;
}

const isSleeveView = (v: string) => v === "left-sleeve" || v === "right-sleeve";

export function TextModal({
  view,
  color,
  t,
  editingTextId,
  textInput,
  setTextInput,
  textFontInput,
  setTextFontInput,
  textColorInput,
  setTextColorInput,
  textMultiRowInput,
  setTextMultiRowInput,
  textSizeInput,
  setTextSizeInput,
  sleeveHasPhoto,
  onEditSizeChange,
  onClose,
  onConfirm,
}: TextModalProps) {
  const isSleeve = isSleeveView(view);
  const activeMaxChars = isSleeve ? SLEEVE_TEXT_MAX_CHARS : (textMultiRowInput ? TEXT_MAX_CHARS_MULTIROW : TEXT_MAX_CHARS);
  const previewFontDef = TEXT_FONTS.find(f => f.id === textFontInput) || TEXT_FONTS[0];
  const previewColor = textColorInput || (color === "black" ? "#FFFFFF" : "#000000");

  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-[#1e1b18] border border-white/10 rounded-t-2xl md:rounded-2xl p-4 md:p-6 max-w-md w-full md:my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">{t.addText}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/70">✕</button>
        </div>

        <div className="space-y-4">
          {/* Multi-row toggle (hidden for sleeve) */}
          {!isSleeve && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50 uppercase tracking-wider">
                {textMultiRowInput ? t.textMultiRow : t.textSingleRow}
              </span>
              <button
                onClick={() => {
                  setTextMultiRowInput(!textMultiRowInput);
                  setTextInput("");
                }}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                  textMultiRowInput ? "bg-[#3e92cc]" : "bg-white/20"
                )}
              >
                <span className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                  textMultiRowInput ? "translate-x-4" : "translate-x-0.5"
                )} />
              </button>
            </div>
          )}

          <div>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value.slice(0, activeMaxChars))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !textMultiRowInput) e.preventDefault();
              }}
              placeholder={t.textPlaceholder}
              rows={textMultiRowInput ? 3 : 2}
              maxLength={activeMaxChars}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#3e92cc]/60 resize-none"
              autoFocus
            />
            <p className={cn(
              "text-xs mt-1.5 text-right font-mono",
              textInput.length >= activeMaxChars ? "text-red-400 font-semibold" : "text-white/40"
            )}>
              {textInput.length}/{activeMaxChars}
            </p>
          </div>

          {/* Text size S/M */}
          <div>
            <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">{t.textSizeLabel}</label>
            <div className="flex gap-2">
              {(["S", "M"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setTextSizeInput(s);
                    onEditSizeChange(s);
                  }}
                  className={cn(
                    "flex-1 py-3 rounded-lg border text-sm font-bold transition-colors",
                    textSizeInput === s
                      ? "border-[#3e92cc] bg-[#3e92cc]/10 text-white"
                      : "border-white/10 text-white/50 hover:border-white/30"
                  )}
                >
                  {s === "S" ? t.textSizeS : t.textSizeM}
                </button>
              ))}
            </div>
          </div>

          {/* Font picker */}
          <div>
            <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">{t.textFont}</label>
            <div className="grid grid-cols-2 gap-2">
              {TEXT_FONTS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setTextFontInput(f.id)}
                  className={cn(
                    "px-3 py-3 rounded-lg border text-sm transition-colors text-left",
                    textFontInput === f.id
                      ? "border-[#3e92cc] bg-[#3e92cc]/10 text-white"
                      : "border-white/10 text-white/60 hover:border-white/30"
                  )}
                  style={{ fontFamily: f.css, fontVariant: f.fontVariant }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">{t.textColor}</label>
            <div className="flex flex-wrap gap-2">
              {TEXT_COLOR_PALETTE.map(c => {
                const isActive = (c.hex || "") === textColorInput;
                return (
                  <button
                    key={c.id}
                    onClick={() => setTextColorInput(c.hex || "")}
                    title={c.label}
                    className={cn(
                      "w-10 h-10 rounded-full border-2 transition-transform hover:scale-110",
                      isActive ? "border-white ring-2 ring-[#3e92cc]" : "border-white/20"
                    )}
                    style={{
                      background: c.hex || "linear-gradient(135deg, #d8315b 0%, #f5c518 33%, #2e7d32 66%, #3e92cc 100%)",
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Live preview */}
          {textInput.trim() && (
            <div
              className="rounded-lg border border-white/10 p-4 flex items-center justify-center gap-2"
              style={{ background: color === "black" ? "#1a1a1a" : "#f5f5f5" }}
            >
              <p
                style={{
                  fontFamily: previewFontDef.css,
                  fontVariant: previewFontDef.fontVariant,
                  color: previewColor,
                  fontWeight: 700,
                  fontSize: 24,
                  lineHeight: 1.2,
                  whiteSpace: textMultiRowInput ? "pre-line" : "nowrap",
                  textAlign: "center",
                }}
              >
                {textInput.trim()}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/15"
            >
              {t.cancel}
            </button>
            <button
              onClick={onConfirm}
              disabled={!textInput.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#d8315b] hover:bg-[#c02850] text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {editingTextId
                ? t.addText
                : sleeveHasPhoto
                  ? t.addTextFree
                  : t.addTextCta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
