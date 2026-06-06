"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/tinythread/SiteFooter";

export default function KontaktiPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const inputCls = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#3e92cc]/60";

  return (
    <div className="min-h-screen bg-[#1e1b18] text-white flex flex-col">
      {/* Nav */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline hover:opacity-80 transition-opacity">
          <span className="font-semibold text-white">TinyThread</span>
          <span className="text-[#3e92cc] text-xs font-medium">STUDIO</span>
        </Link>
        <Link href="/products" className="text-sm text-white/50 hover:text-white transition-colors">Produkti</Link>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Kontakti</h1>
        <p className="text-white/50 text-sm mb-8">
          Jautājumi? Raksti mums. Atbildam darba dienās 1–2 stundu laikā.
        </p>

        {/* Contact info */}
        <div className="mb-8 space-y-2">
          <p className="text-sm text-white/60">
            <span className="text-white/40">E-pasts:</span>{" "}
            <a href="mailto:hello@tinythread.lv" className="text-[#3e92cc] hover:underline">hello@tinythread.lv</a>
          </p>
        </div>

        {/* Contact form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Vārds</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Tavs vārds"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">E-pasts</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="tavs@epasts.lv"
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Temats</label>
            <input
              type="text"
              required
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Par ko vēlies rakstīt?"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 uppercase tracking-wider mb-1.5">Ziņojums</label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Raksti šeit..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {status === "sent" && (
            <p className="text-green-400 text-sm">Ziņojums nosūtīts! Atbildēsim drīzumā.</p>
          )}
          {status === "error" && (
            <p className="text-red-400 text-sm">Kļūda nosūtot. Lūdzu raksti tieši uz hello@tinythread.lv.</p>
          )}

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full py-3 bg-[#d8315b] hover:bg-[#c02850] text-white font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {status === "sending" ? "Sūta..." : "Nosūtīt ziņojumu"}
          </button>
        </form>
      </main>

      <SiteFooter />
    </div>
  );
}
