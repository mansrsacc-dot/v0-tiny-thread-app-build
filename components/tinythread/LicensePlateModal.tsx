"use client";

interface LicensePlateModalProps {
  carPlateStep: "ask" | "input";
  setCarPlateStep: (step: "ask" | "input") => void;
  carPlateInput: string;
  setCarPlateInput: (v: string) => void;
  onNoPlate: () => void;
  onYesPlate: () => void;
  onConfirmPlate: () => void;
  t: Record<string, string>;
}

export function LicensePlateModal({
  carPlateStep,
  setCarPlateStep,
  carPlateInput,
  setCarPlateInput,
  onNoPlate,
  onYesPlate,
  onConfirmPlate,
  t,
}: LicensePlateModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
      <div className="bg-[#1e1b18] border border-white/10 rounded-2xl p-8 max-w-sm w-full">
        {carPlateStep === "ask" ? (
          <>
            <h2 className="text-lg font-bold text-white mb-6 text-center">{t.carPlateQuestion}</h2>
            <div className="flex gap-3">
              <button
                onClick={onNoPlate}
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/15"
              >
                {t.carPlateNo}
              </button>
              <button
                onClick={onYesPlate}
                className="flex-1 px-4 py-3 rounded-lg bg-[#3e92cc] text-white text-sm font-bold hover:bg-[#2f7bb0]"
              >
                {t.carPlateYes}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-white mb-4 text-center">{t.carPlateInputLabel}</h2>
            <input
              type="text"
              value={carPlateInput}
              onChange={e => setCarPlateInput(e.target.value.toUpperCase().slice(0, 8))}
              placeholder={t.carPlateInputPlaceholder}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-center text-xl font-bold tracking-widest placeholder:text-white/30 focus:outline-none focus:border-[#3e92cc]/60 mb-4"
              autoFocus
            />
            <button
              onClick={onConfirmPlate}
              disabled={!carPlateInput.trim()}
              className="flex-1 w-full px-4 py-3 rounded-lg bg-[#d8315b] hover:bg-[#c02850] text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {t.carPlateConfirm}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
