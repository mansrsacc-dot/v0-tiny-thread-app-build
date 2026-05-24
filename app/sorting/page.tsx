"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  title: string;
  variantTitle: string;
  quantity: number;
  style: string | null;
  size: string | null;
  placement: string | null;
  licensePlate: string | null;
  textEmbroidery: string | null;
  designCount: string | null;
  orderType: string | null;
}

interface Order {
  id: string;
  orderNumber: number;
  customer: string;
  email: string;
  createdAt: string;
  lineItems: LineItem[];
  status: string;
  totalPrice: string;
  currency: string;
}

type SizeMap = Record<string, number>;
type Stock = {
  hoodie: { black: SizeMap; cream: SizeMap; white: SizeMap };
  cap:    { black: number; cream: number };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "gaida",    label: "Gaida apstrādi", dot: "bg-yellow-400" },
  { value: "razosana", label: "Ražošanā",        dot: "bg-blue-400"   },
  { value: "gatavs",   label: "Gatavs",           dot: "bg-green-400"  },
  { value: "nosutits", label: "Nosūtīts",         dot: "bg-gray-500"   },
];

const DEFAULT_STOCK: Stock = {
  hoodie: {
    black: { S: 0, M: 0, L: 0, XL: 0 },
    cream: { S: 0, M: 0, L: 0, XL: 0 },
    white: { S: 0, M: 0, L: 0, XL: 0 },
  },
  cap: {
    black: 0,
    cream: 0,
  },
};

const OVERDUE_DAYS = 7;
const REFRESH_INTERVAL_MS = 2 * 60 * 1000;
const LOW_STOCK_THRESHOLD = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("lv-LV", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function isOverdue(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() > OVERDUE_DAYS * 24 * 60 * 60 * 1000;
}

function translatePlacement(p: string): string {
  return p
    .split(",")
    .map((s) => {
      const t = s.trim();
      if (t === "front") return "Priekša";
      if (t === "back") return "Aizmugure";
      if (t === "left-sleeve") return "Kreisā piedurkne";
      if (t === "right-sleeve") return "Labā piedurkne";
      return t;
    })
    .join(", ");
}

function stockTotal(map: SizeMap): number {
  return Object.values(map).reduce((a, b) => a + (b || 0), 0);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
      {opt.label}
    </span>
  );
}

function OrderCard({
  order,
  authToken,
  onStatusChange,
}: {
  order: Order;
  authToken: string;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const overdue = isOverdue(order.createdAt);

  async function handleStatus(newStatus: string) {
    setUpdating(true);
    try {
      await fetch("/api/sorting/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-sorting-auth": authToken },
        body: JSON.stringify({ orderId: order.id, status: newStatus }),
      });
      onStatusChange(order.id, newStatus);
    } catch {}
    setUpdating(false);
  }

  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-3 ${
        overdue
          ? "border-red-500/40 bg-red-950/20"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-base">#{order.orderNumber}</span>
            {overdue && (
              <span className="text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded px-1.5 py-0.5">
                KAVĒJAS
              </span>
            )}
          </div>
          <div className="text-white/50 text-xs mt-0.5">{order.customer}</div>
        </div>
        <div className="text-right">
          <div className="text-white/70 text-sm font-medium">
            {order.totalPrice} {order.currency}
          </div>
          <div className="text-white/40 text-xs">{formatDate(order.createdAt)}</div>
        </div>
      </div>

      {/* Line items */}
      <div className="flex flex-col gap-2">
        {order.lineItems.map((item, i) => (
          <div key={i} className="bg-white/5 rounded-lg p-3 text-sm flex flex-col gap-1">
            <div className="text-white font-medium">
              {item.title}
              {item.variantTitle ? ` — ${item.variantTitle}` : ""}
              {item.quantity > 1 ? <span className="text-white/50 ml-1">× {item.quantity}</span> : null}
            </div>
            {item.style && (
              <div className="text-white/60 text-xs">
                <span className="text-white/40">Stils:</span> {item.style}
              </div>
            )}
            {item.placement && (
              <div className="text-white/60 text-xs">
                <span className="text-white/40">Novietojums:</span>{" "}
                {translatePlacement(item.placement)}
              </div>
            )}
            {item.size && (
              <div className="text-white/60 text-xs">
                <span className="text-white/40">Izmērs:</span> {item.size}
              </div>
            )}
            {item.textEmbroidery && (
              <div className="text-white/60 text-xs">
                <span className="text-white/40">Teksts:</span> {item.textEmbroidery}
              </div>
            )}
            {item.licensePlate && (
              <div className="text-[#f5c518] text-xs font-medium">
                🚗 Numura zīme: {item.licensePlate}
              </div>
            )}
            {item.orderType === "Multiple" && (
              <div className="text-white/40 text-xs italic">Vairāki izmēri</div>
            )}
          </div>
        ))}
        {order.lineItems.length === 0 && (
          <div className="text-white/30 text-xs italic">Nav izšuvuma datu</div>
        )}
      </div>

      {/* Status selector */}
      <div className="flex items-center gap-3 pt-1 border-t border-white/5">
        <StatusBadge status={order.status} />
        <select
          disabled={updating}
          value={order.status}
          onChange={(e) => handleStatus(e.target.value)}
          className="ml-auto text-xs bg-white/10 text-white border border-white/15 rounded-lg px-2 py-1.5 focus:outline-none focus:border-white/30 disabled:opacity-50 cursor-pointer"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#1a1a1a]">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function StockInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const low = value <= LOW_STOCK_THRESHOLD;
  return (
    <input
      type="number"
      min={0}
      max={999}
      value={value}
      onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
      className={`w-14 text-center text-sm font-bold rounded-lg border py-1.5 bg-white/5 focus:outline-none focus:border-white/30 ${
        low
          ? "border-red-500/50 text-red-400"
          : "border-white/10 text-white"
      }`}
    />
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SortingPage() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const [stock, setStock] = useState<Stock>(DEFAULT_STOCK);
  const [editStock, setEditStock] = useState<Stock>(DEFAULT_STOCK);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockSaving, setStockSaving] = useState(false);
  const [stockSaved, setStockSaved] = useState(false);

  const [activeTab, setActiveTab] = useState<"orders" | "stock">("orders");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Check sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("sorting_auth");
    if (saved) {
      setAuthToken(saved);
      setAuthed(true);
    }
    setChecking(false);
  }, []);

  // ── Fetch orders
  const fetchOrders = useCallback(async (token: string) => {
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const res = await fetch("/api/sorting/orders", {
        headers: { "x-sorting-auth": token },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kļūda");
      setOrders(data.orders || []);
      setLastRefresh(new Date());
    } catch (e: any) {
      setOrdersError(e.message || "Neizdevās ielādēt pasūtījumus");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // ── Fetch stock
  const fetchStock = useCallback(async (token: string) => {
    setStockLoading(true);
    try {
      const res = await fetch("/api/sorting/stock", {
        headers: { "x-sorting-auth": token },
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok) {
        setStock(data.stock);
        setEditStock(data.stock);
      }
    } catch {}
    setStockLoading(false);
  }, []);

  // ── Load data after auth
  useEffect(() => {
    if (!authed || !authToken) return;
    fetchOrders(authToken);
    fetchStock(authToken);

    // Auto-refresh orders every 2 minutes
    refreshTimerRef.current = setInterval(() => fetchOrders(authToken), REFRESH_INTERVAL_MS);
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [authed, authToken, fetchOrders, fetchStock]);

  // ── Password submit
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/sorting/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      if (res.ok) {
        sessionStorage.setItem("sorting_auth", passwordInput);
        setAuthToken(passwordInput);
        setAuthed(true);
      } else if (res.status === 500) {
        setAuthError("Serveris nav konfigurēts — pārbaudiet SORTING_PASSWORD vides mainīgo");
      } else {
        setAuthError("Nepareiza parole");
      }
    } catch {
      setAuthError("Savienojuma kļūda");
    }
    setAuthLoading(false);
  }

  // ── Status update callback
  function handleStatusChange(orderId: string, newStatus: string) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  }

  // ── Stock save
  async function saveStock() {
    setStockSaving(true);
    try {
      const res = await fetch("/api/sorting/stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sorting-auth": authToken,
        },
        body: JSON.stringify({ stock: editStock }),
      });
      if (res.ok) {
        setStock(editStock);
        setStockSaved(true);
        setTimeout(() => setStockSaved(false), 2000);
      }
    } catch {}
    setStockSaving(false);
  }

  function updateStockValue(
    productType: "hoodie" | "cap",
    color: string,
    size: string,
    value: number
  ) {
    if (productType === "cap") {
      setEditStock((prev) => ({
        ...prev,
        cap: { ...prev.cap, [color]: value },
      }));
    } else {
      setEditStock((prev) => ({
        ...prev,
        hoodie: {
          ...prev.hoodie,
          [color]: { ...(prev.hoodie as any)[color], [size]: value },
        },
      }));
    }
  }

  // ── Computed values
  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  const overdueCount = orders.filter(
    (o) => isOverdue(o.createdAt) && o.status !== "nosutits"
  ).length;

  const pendingCount = orders.filter(
    (o) => o.status !== "nosutits"
  ).length;

  // ── Render: checking
  if (checking) {
    return <div className="min-h-screen bg-[#0f0f0f]" />;
  }

  // ── Render: password gate
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-2xl font-bold text-white mb-1">TinyThread</div>
            <div className="text-white/40 text-sm">Iekšējā pārvaldība</div>
          </div>
          <form
            onSubmit={handleLogin}
            className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 flex flex-col gap-4"
          >
            <div>
              <label className="text-white/60 text-xs font-medium block mb-2">Parole</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/30 text-sm"
              />
            </div>
            {authError && (
              <div className="text-red-400 text-xs text-center">{authError}</div>
            )}
            <button
              type="submit"
              disabled={!passwordInput || authLoading}
              className="w-full bg-[#d8315b] hover:bg-[#c02850] text-white font-bold py-3 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {authLoading ? "Pārbauda..." : "Ieiet"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Render: main page
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0f0f0f]/90 backdrop-blur border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <span className="font-bold text-white text-sm">TinyThread</span>
            <span className="text-white/40 text-sm ml-2">Šķirošana</span>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-white/30 text-xs hidden sm:block">
                Atjaunots {lastRefresh.toLocaleTimeString("lv-LV", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button
              onClick={() => {
                sessionStorage.removeItem("sorting_auth");
                setAuthed(false);
                setAuthToken("");
                setPasswordInput("");
              }}
              className="text-white/40 hover:text-white/70 text-xs transition-colors"
            >
              Iziet
            </button>
          </div>
        </div>
      </header>

      {/* Tab nav */}
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "orders"
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            Pasūtījumi
            {pendingCount > 0 && (
              <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                overdueCount > 0 ? "bg-red-500/30 text-red-400" : "bg-white/10 text-white/60"
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("stock")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "stock"
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            Krājumi
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 pb-16">

        {/* ── ORDERS TAB ── */}
        {activeTab === "orders" && (
          <div className="flex flex-col gap-4">

            {/* Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 flex gap-1 flex-wrap">
                {["all", ...STATUS_OPTIONS.map((s) => s.value)].map((v) => {
                  const label = v === "all" ? "Visi" : STATUS_OPTIONS.find((s) => s.value === v)?.label || v;
                  const count = v === "all" ? orders.length : orders.filter((o) => o.status === v).length;
                  return (
                    <button
                      key={v}
                      onClick={() => setStatusFilter(v)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        statusFilter === v
                          ? "bg-white/15 border-white/20 text-white"
                          : "bg-transparent border-white/10 text-white/40 hover:text-white/60"
                      }`}
                    >
                      {label} {count > 0 && <span className="opacity-60">({count})</span>}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => fetchOrders(authToken)}
                disabled={ordersLoading}
                className="text-xs text-white/40 hover:text-white/70 transition-colors disabled:opacity-30 shrink-0"
              >
                {ordersLoading ? "Ielādē..." : "↻ Atjaunot"}
              </button>
            </div>

            {/* Overdue warning */}
            {overdueCount > 0 && (
              <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3 text-sm text-red-400 flex items-center gap-2">
                <span>⚠</span>
                <span>
                  {overdueCount} pasūtījum{overdueCount === 1 ? "s" : "i"} kavējas vairāk kā {OVERDUE_DAYS} dienas
                </span>
              </div>
            )}

            {/* Error */}
            {ordersError && (
              <div className="bg-red-950/30 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
                {ordersError}
              </div>
            )}

            {/* Loading */}
            {ordersLoading && orders.length === 0 && (
              <div className="text-center text-white/30 text-sm py-12">
                Ielādē pasūtījumus...
              </div>
            )}

            {/* Empty */}
            {!ordersLoading && filteredOrders.length === 0 && (
              <div className="text-center text-white/30 text-sm py-12">
                {orders.length === 0 ? "Nav atvērtu pasūtījumu" : "Nav pasūtījumu šajā kategorijā"}
              </div>
            )}

            {/* Order cards */}
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                authToken={authToken}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}

        {/* ── STOCK TAB ── */}
        {activeTab === "stock" && (
          <div className="flex flex-col gap-6">
            {stockLoading ? (
              <div className="text-center text-white/30 text-sm py-12">Ielādē krājumus...</div>
            ) : (
              <>
                {/* Hoodies */}
                <StockSection
                  title="Džemperi"
                  productType="hoodie"
                  colors={[
                    { key: "black", label: "Melns" },
                    { key: "cream", label: "Krēms" },
                    { key: "white", label: "Balts" },
                  ]}
                  sizes={["S", "M", "L", "XL"]}
                  editStock={editStock}
                  onUpdate={updateStockValue}
                />

                {/* Caps — single quantity per color, no size variants */}
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-white text-sm">Cepures</h3>
                    <span className="text-white/40 text-xs">
                      Kopā: {editStock.cap.black + editStock.cap.cream}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {([["black", "Melna"], ["cream", "Krēmas"]] as const).map(([key, label]) => {
                      const val = editStock.cap[key];
                      const low = val <= LOW_STOCK_THRESHOLD;
                      return (
                        <div key={key} className="flex items-center justify-between border-t border-white/5 pt-3 first:border-0 first:pt-0">
                          <span className="text-white/70 text-sm">{label}</span>
                          <input
                            type="number"
                            min={0}
                            max={999}
                            value={val}
                            onChange={(e) => updateStockValue("cap", key, "", Math.max(0, parseInt(e.target.value) || 0))}
                            className={`w-16 text-center text-sm font-bold rounded-lg border py-1.5 bg-white/5 focus:outline-none focus:border-white/30 transition-colors ${
                              low ? "border-red-500/50 text-red-400" : "border-white/10 text-white"
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Save button */}
                <div className="flex items-center gap-4 pt-2">
                  <button
                    onClick={saveStock}
                    disabled={stockSaving}
                    className="flex-1 bg-[#d8315b] hover:bg-[#c02850] text-white font-bold py-3 rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {stockSaving ? "Saglabā..." : stockSaved ? "✓ Saglabāts" : "Saglabāt krājumus"}
                  </button>
                </div>

                {/* Low stock alert */}
                {(() => {
                  const low: string[] = [];
                  const colorLabels: Record<string, string> = { black: "Melns", cream: "Krēms", white: "Balts" };
                  for (const [color, sizes] of Object.entries(editStock.hoodie)) {
                    for (const [size, qty] of Object.entries(sizes as SizeMap)) {
                      if (qty <= LOW_STOCK_THRESHOLD) low.push(`Džemperis ${colorLabels[color] || color} ${size}: ${qty}`);
                    }
                  }
                  const capLabels: Record<string, string> = { black: "Melna", cream: "Krēmas" };
                  for (const [color, qty] of Object.entries(editStock.cap)) {
                    if ((qty as number) <= LOW_STOCK_THRESHOLD) low.push(`Cepure ${capLabels[color] || color}: ${qty}`);
                  }
                  if (low.length === 0) return null;
                  return (
                    <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4">
                      <div className="text-red-400 text-xs font-bold mb-2">⚠ Zemi krājumi</div>
                      <div className="flex flex-wrap gap-2">
                        {low.map((item) => (
                          <span key={item} className="text-xs text-red-400/80 bg-red-500/10 px-2 py-1 rounded-lg">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── StockSection sub-component ───────────────────────────────────────────────

function StockSection({
  title,
  productType,
  colors,
  sizes,
  editStock,
  onUpdate,
}: {
  title: string;
  productType: "hoodie" | "cap";
  colors: { key: string; label: string }[];
  sizes: string[];
  editStock: Stock;
  onUpdate: (productType: "hoodie" | "cap", color: string, size: string, value: number) => void;
}) {
  const productStock = editStock[productType] as Record<string, SizeMap>;
  const totalAll = colors.reduce(
    (sum, c) => sum + stockTotal(productStock[c.key] || {}),
    0
  );

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white text-sm">{title}</h3>
        <span className="text-white/40 text-xs">Kopā: {totalAll}</span>
      </div>

      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-white/40 text-xs font-medium pb-2 pr-4 pl-1">Krāsa</th>
              {sizes.map((sz) => (
                <th key={sz} className="text-center text-white/40 text-xs font-medium pb-2 px-1 min-w-[3.5rem]">
                  {sz}
                </th>
              ))}
              <th className="text-right text-white/40 text-xs font-medium pb-2 pl-4 pr-1">Kop.</th>
            </tr>
          </thead>
          <tbody>
            {colors.map(({ key, label }) => {
              const colorSizes = productStock[key] || {};
              const total = stockTotal(colorSizes);
              return (
                <tr key={key} className="border-t border-white/5">
                  <td className="text-white/70 text-xs py-2 pr-4 pl-1 whitespace-nowrap">{label}</td>
                  {sizes.map((sz) => {
                    const val = colorSizes[sz] ?? 0;
                    const low = val <= LOW_STOCK_THRESHOLD;
                    return (
                      <td key={sz} className="py-2 px-1 text-center">
                        <input
                          type="number"
                          min={0}
                          max={999}
                          value={val}
                          onChange={(e) =>
                            onUpdate(productType, key, sz, Math.max(0, parseInt(e.target.value) || 0))
                          }
                          className={`w-14 text-center text-sm font-bold rounded-lg border py-1.5 bg-white/5 focus:outline-none focus:border-white/30 transition-colors ${
                            low
                              ? "border-red-500/50 text-red-400"
                              : "border-white/10 text-white"
                          }`}
                        />
                      </td>
                    );
                  })}
                  <td className={`text-right text-sm font-bold py-2 pl-4 pr-1 ${total <= LOW_STOCK_THRESHOLD ? "text-red-400" : "text-white/60"}`}>
                    {total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
