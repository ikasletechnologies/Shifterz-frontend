"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Receipt, Car, UserPlus } from "lucide-react";
import { getPayments, getInvoices, getCarInRecords, getJobs } from "@/lib/api";

// ─── Date range ────────────────────────────────────────────────────────────────

export type RangePreset = "today" | "7d" | "30d" | "month" | "custom";

export interface DateRange {
  preset: RangePreset;
  from: string; // yyyy-mm-dd (inclusive)
  to: string; // yyyy-mm-dd (inclusive)
}

const PRESETS: { id: RangePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "month", label: "This Month" },
  { id: "custom", label: "Custom" },
];

function toKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function fromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function rangeForPreset(preset: RangePreset, current?: DateRange): DateRange {
  const today = new Date();
  const todayKey = toKey(today);
  const daysAgo = (n: number) => toKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - n));
  switch (preset) {
    case "today":
      return { preset, from: todayKey, to: todayKey };
    case "7d":
      return { preset, from: daysAgo(6), to: todayKey };
    case "30d":
      return { preset, from: daysAgo(29), to: todayKey };
    case "month":
      return { preset, from: toKey(new Date(today.getFullYear(), today.getMonth(), 1)), to: todayKey };
    case "custom":
      return { preset, from: current?.from || daysAgo(6), to: current?.to || todayKey };
  }
}

// ─── Toolbar: date filter (left) + quick actions (right) ──────────────────────

export function DashboardToolbar({ range, onRangeChange }: { range: DateRange; onRangeChange: (r: DateRange) => void }) {
  const todayKey = toKey(new Date());

  return (
    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-1">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onRangeChange(rangeForPreset(p.id, range))}
              className={`text-sm px-3 py-1 rounded-md font-medium transition-all whitespace-nowrap cursor-pointer ${
                range.preset === p.id ? "bg-white text-gray-900 font-semibold shadow-sm" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {range.preset === "custom" && (
          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              value={range.from}
              max={range.to}
              onChange={(e) => e.target.value && onRangeChange({ ...range, from: e.target.value })}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              aria-label="From date"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={range.to}
              min={range.from}
              max={todayKey}
              onChange={(e) => e.target.value && onRangeChange({ ...range, to: e.target.value })}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              aria-label="To date"
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <QuickAction href="/dashboard/billing?new=1" icon={Receipt} label="New Invoice" />
        <QuickAction href="/dashboard/carin?new=1" icon={Car} label="Car In" />
        <QuickAction href="/dashboard/employees?new=1" icon={UserPlus} label="Add Employee" />
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label }: { href: string; icon: typeof Receipt; label: string }) {
  return (
    <Link
      href={href}
      className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors text-sm whitespace-nowrap"
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}

// ─── Period overview: figures + charts for the selected range ────────────────

interface Bucket {
  key: string;
  label: string;
  value: number;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function inRange(value: string | undefined | null, from: Date, toExclusive: Date): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d >= from && d < toExclusive ? d : null;
}

export function PeriodOverview({ range }: { range: DateRange }) {
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [carIns, setCarIns] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getPayments().catch(() => []),
      getInvoices().catch(() => []),
      getCarInRecords().catch(() => []),
      getJobs().catch(() => []),
    ]).then(([p, i, c, j]) => {
      if (cancelled) return;
      setPayments(Array.isArray(p) ? p : []);
      setInvoices(Array.isArray(i) ? i : []);
      setCarIns(Array.isArray(c) ? c : []);
      setJobs(Array.isArray(j) ? j : []);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const view = useMemo(() => {
    const from = fromKey(range.from);
    const toExclusive = fromKey(range.to);
    toExclusive.setDate(toExclusive.getDate() + 1);

    // Daily buckets for ranges up to ~2 months, monthly beyond that.
    const spanDays = Math.round((toExclusive.getTime() - from.getTime()) / 86400000);
    const monthly = spanDays > 62;
    const bucketKey = (d: Date) => (monthly ? toKey(d).slice(0, 7) : toKey(d));
    const buckets: { key: string; label: string }[] = [];
    const cursor = new Date(from);
    while (cursor < toExclusive) {
      const key = bucketKey(cursor);
      if (!buckets.length || buckets[buckets.length - 1].key !== key) {
        buckets.push({
          key,
          label: monthly
            ? cursor.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
            : cursor.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const revenueByBucket = new Map<string, number>();
    const carInByBucket = new Map<string, number>();
    let revenue = 0;
    for (const p of payments) {
      const d = inRange(p.date, from, toExclusive);
      if (!d) continue;
      const amount = Number(p.amount) || 0;
      revenue += amount;
      revenueByBucket.set(bucketKey(d), (revenueByBucket.get(bucketKey(d)) || 0) + amount);
    }

    let invoiceCount = 0;
    let invoiceTotal = 0;
    for (const inv of invoices) {
      if (inv.status === "Cancelled" || (inv.type && inv.type !== "Invoice")) continue;
      if (!inRange(inv.date || inv.createdAt, from, toExclusive)) continue;
      invoiceCount++;
      invoiceTotal += (Number(inv.amount) || 0) + (Number(inv.gst) || 0) - (Number(inv.discount) || 0);
    }

    let carInCount = 0;
    for (const c of carIns) {
      const d = inRange(c.inTime, from, toExclusive);
      if (!d) continue;
      carInCount++;
      carInByBucket.set(bucketKey(d), (carInByBucket.get(bucketKey(d)) || 0) + 1);
    }

    const jobCount = jobs.filter((j) => inRange(j.startDate || j.createdAt, from, toExclusive)).length;

    return {
      revenue,
      invoiceCount,
      invoiceTotal,
      carInCount,
      jobCount,
      revenueSeries: buckets.map((b) => ({ ...b, value: revenueByBucket.get(b.key) || 0 })),
      carInSeries: buckets.map((b) => ({ ...b, value: carInByBucket.get(b.key) || 0 })),
    };
  }, [payments, invoices, carIns, jobs, range.from, range.to]);

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-lg">
        <h2 className="px-5 py-3.5 text-sm font-bold text-slate-900 border-b border-slate-200">
          Selected Period <span className="font-normal text-slate-500">· {formatRange(range)}</span>
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 sm:divide-x divide-slate-100">
          <PeriodMetric label="Revenue Collected" value={loading ? "…" : inr(view.revenue)} />
          <PeriodMetric
            label="Invoices Raised"
            value={loading ? "…" : view.invoiceCount}
            note={loading ? undefined : `${inr(view.invoiceTotal)} billed`}
          />
          <PeriodMetric label="Vehicles Checked In" value={loading ? "…" : view.carInCount} />
          <PeriodMetric label="Job Cards Opened" value={loading ? "…" : view.jobCount} />
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartPanel title="Revenue Collected" data={view.revenueSeries} format={inr} loading={loading} />
        <ChartPanel title="Vehicles Checked In" data={view.carInSeries} format={(n) => String(n)} loading={loading} />
      </div>
    </div>
  );
}

function formatRange(range: DateRange): string {
  const fmt = (k: string) => fromKey(k).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  return range.from === range.to ? fmt(range.from) : `${fmt(range.from)} – ${fmt(range.to)}`;
}

function PeriodMetric({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-800">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1.5">{value}</p>
      {note && <p className="text-xs text-slate-500 mt-0.5">{note}</p>}
    </div>
  );
}

// ─── Bar chart (single series, SVG) ───────────────────────────────────────────

const BAR_COLOR = "#2a78d6"; // single-series blue from the reference palette
const BAR_HOVER = "#1f5fae";
const CHART_HEIGHT = 220;
const PAD = { top: 12, right: 12, bottom: 28, left: 56 };

function niceMax(max: number): number {
  if (max <= 0) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const n = max / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function ChartPanel({ title, data, format, loading }: { title: string; data: Bucket[]; format: (n: number) => string; loading: boolean }) {
  const [showTable, setShowTable] = useState(false);
  const total = data.reduce((s, b) => s + b.value, 0);

  return (
    <section className="bg-white border border-slate-200 rounded-lg">
      <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-900">
          {title} <span className="font-normal text-slate-500">· {format(total)} total</span>
        </h2>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 hover:underline underline-offset-2 cursor-pointer"
        >
          {showTable ? "Show chart" : "View as table"}
        </button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center text-sm text-slate-400" style={{ height: CHART_HEIGHT }}>
            Loading…
          </div>
        ) : showTable ? (
          <div className="overflow-y-auto" style={{ maxHeight: CHART_HEIGHT }}>
            <table className="data-table w-full text-left">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="text-right">{title}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((b) => (
                  <tr key={b.key}>
                    <td>{b.label}</td>
                    <td className="text-right">{format(b.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <BarChart data={data} format={format} label={title} />
        )}
      </div>
    </section>
  );
}

function BarChart({ data, format, label }: { data: Bucket[]; format: (n: number) => string; label: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const plotW = width - PAD.left - PAD.right;
  const plotH = CHART_HEIGHT - PAD.top - PAD.bottom;
  const slot = plotW / Math.max(data.length, 1);
  const gap = Math.max(2, slot * 0.25); // ≥2px surface gap between adjacent bars
  const barW = Math.max(1, slot - gap);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];
  // Selective x labels: at most ~8 so they never collide.
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));
  const hovered = hover !== null ? data[hover] : null;

  return (
    <div ref={wrapRef} className="relative" style={{ height: CHART_HEIGHT }}>
      <svg width={width} height={CHART_HEIGHT} role="img" aria-label={`${label} bar chart`} onMouseLeave={() => setHover(null)}>
        {/* Recessive grid + y axis labels */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? "#cbd5e1" : "#eef2f6"} strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#64748b">
              {format(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const x = PAD.left + i * slot + gap / 2;
          const top = y(d.value);
          const h = PAD.top + plotH - top;
          const r = Math.min(4, barW / 2, h);
          return (
            <g key={d.key}>
              {h > 0 && (
                // Bar with 4px rounded top, square at the baseline.
                <path
                  d={`M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + h} Z`}
                  fill={hover === i ? BAR_HOVER : BAR_COLOR}
                />
              )}
              {/* Hit target: the whole column, bigger than the bar */}
              <rect
                x={PAD.left + i * slot}
                y={PAD.top}
                width={slot}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={CHART_HEIGHT - 8} textAnchor="middle" fontSize={11} fill="#64748b">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hovered && hover !== null && (
        <div
          className="absolute pointer-events-none bg-white border border-slate-200 rounded-md shadow-md px-3 py-2 text-xs whitespace-nowrap"
          style={{
            left: Math.min(Math.max(PAD.left + hover * slot + slot / 2, 70), width - 70),
            top: Math.max(y(hovered.value) - 8, 0),
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="text-slate-500">{hovered.label}</p>
          <p className="font-semibold text-slate-900">{format(hovered.value)}</p>
        </div>
      )}
    </div>
  );
}
