"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyBadge } from "@/components/layout/company-badge";
import { StatCard } from "@/components/layout/stat-card";
import { fmtBRL, groupByCompany, summarizeEntries } from "@/lib/calc";
import { useStore } from "@/lib/store";

function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span style={{ color }}>
          {fmtBRL(value)} ({pct.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function FinanceMonthly({ month }: { month: string }) {
  const entries = useStore((s) => s.entries);
  const companies = useStore((s) => s.companies);
  const getCompany = useStore((s) => s.getCompany);

  const { t, byCompany } = useMemo(() => {
    const f = entries.filter((e) => e.data.startsWith(month));
    return { t: summarizeEntries(f, getCompany), byCompany: groupByCompany(f, getCompany) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, month, companies]);

  const totalAlim = t.alimConf + t.alimExtra;
  const gastos = totalAlim + t.uber;
  const groups = Object.entries(byCompany);

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="💰 A cobrar" value={fmtBRL(t.total)} tone="green" />
        <StatCard label="📅 Dias" value={t.dias} tone="accent" />
        <StatCard label="🍽 Alim. (gasto part.)" value={fmtBRL(totalAlim)} tone="red" danger />
        <StatCard label="🚗 Transp. (gasto part.)" value={fmtBRL(t.uber)} tone="red" danger />
      </div>
      <Card className="py-4">
        <CardContent className="flex flex-col gap-3 px-4">
          <div className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">📉 Gastos sobre ganhos</div>
          <Bar label="🍽 Alimentação" value={totalAlim} total={t.total} color="#fb923c" />
          <Bar label="🚗 Transporte" value={t.uber} total={t.total} color="#fbbf24" />
          <div className="flex justify-between border-t border-border pt-3 text-xs">
            <span className="text-muted-foreground">Total gastos</span>
            <span className="font-bold text-red-400">{fmtBRL(gastos)}</span>
          </div>
        </CardContent>
      </Card>
      <Card className="py-4">
        <CardContent className="flex flex-col gap-3 px-4">
          <div className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">Por empresa</div>
          {groups.length === 0 && <p className="text-xs text-muted-foreground">Nenhum dado</p>}
          {groups.map(([cid, g], i) => (
            <div key={cid} className={i < groups.length - 1 ? "flex flex-col gap-2 border-b border-border pb-3" : "flex flex-col gap-2"}>
              <div className="flex items-center gap-2">
                <CompanyBadge company={getCompany(cid)} />
                <span className="text-[11px] text-muted-foreground">{g.dias} dias</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <StatCard small label="Ganho" value={fmtBRL(g.total)} tone="green" />
                <StatCard small label="Alim. fixa" value={fmtBRL(g.alimConf)} tone="orange" />
                <StatCard small label="Transp." value={fmtBRL(g.uber)} tone="yellow" />
                <StatCard small label="Líquido" value={fmtBRL(g.liquido)} tone="accent" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
