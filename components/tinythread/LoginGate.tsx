"use client";

import { useState } from "react";
import type { Lang } from "@/lib/translations";

interface LoginGateProps {
  lang: Lang;
  onLangChange: (l: Lang) => void;
  onLogin: (customer: { id: string; firstName: string; lastName: string; email: string; accessToken?: string }) => void;
}

export function LoginGate({ lang, onLangChange, onLogin }: LoginGateProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lv = lang === "lv";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.id) {
        onLogin(data);
      } else {
        setError(lv ? "Nepareizs e-pasts vai parole" : "Incorrect email or password");
      }
    } catch {
      setError(lv ? "Kaut kas nogāja greizi. Mēģini vēlreiz." : "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0f0e0d] flex flex-col items-center justify-center p-4 relative">
      {/* Language toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <button
          onClick={() => onLangChange("lv")}
          className={`text-xs px-2 py-1 rounded transition-colors ${lang === "lv" ? "text-white font-bold" : "text-white/30 hover:text-white/60"}`}
        >
          LV
        </button>
        <span className="text-white/20 text-xs">/</span>
        <button
          onClick={() => onLangChange("en")}
          className={`text-xs px-2 py-1 rounded transition-colors ${lang === "en" ? "text-white font-bold" : "text-white/30 hover:text-white/60"}`}
        >
          EN
        </button>
      </div>

      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧵</div>
          <h1 className="text-white text-2xl font-bold tracking-wide">TinyThread Studio</h1>
        </div>

        {/* Card */}
        <div className="bg-[#1e1b18] border border-white/10 rounded-2xl p-7">
          <p className="text-white/55 text-sm text-center mb-6 leading-relaxed">
            {lv
              ? "Lūdzu pieslēdzies, lai izmantotu TinyThread Studio"
              : "Please log in to use TinyThread Studio"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">
                {lv ? "E-pasts" : "Email"}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            <div>
              <label className="text-white/40 text-xs uppercase tracking-wider block mb-1.5">
                {lv ? "Parole" : "Password"}
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#3e92cc] text-white font-bold rounded-lg hover:bg-[#2f7bb0] disabled:opacity-50 transition-colors text-sm"
            >
              {loading
                ? (lv ? "Pieslēdzas..." : "Logging in...")
                : (lv ? "Pieslēdzies" : "Log in")}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p className="text-center text-white/35 text-xs mt-4">
          {lv ? "Nav konta?" : "No account?"}{" "}
          <a
            href="https://tinythread.lv/account/register"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/55 hover:text-white/80 underline transition-colors"
          >
            {lv ? "Reģistrēties" : "Register"}
          </a>
        </p>
      </div>
    </div>
  );
}
