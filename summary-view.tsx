"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyBadge } from "@/components/layout/company-badge";
import { MonthSelect } from "@/components/layout/month-select";
import { StatCard } from "@/components/layout/stat-card";
import { fmtBRL, groupByCompany, summarizeEntries } from "@/lib/calc";
import { monthKey } from "@/lib/dates";
import { useStore } from "@/lib/store";

export function SummaryView() {
  const entries = useStore((s) => s.entries);
  const companies = useStore((s) => s.companies);
  const getCompany = useStore((s) => s.getCompany);
  const [month, setMonth] = useState(() => monthKey(new Date()));

  const { totals, byCompany } = useMemo(() => {
    const f = entries.filter((e) => e.data.startsWith(month));
    return { totals: summarizeEntries(f, getCompany), byCompany: groupByCompany(f, getCompany) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, month, companies]);

  const groups = Object.entries(byCompany);

  return (
    <>
      <Card className="py-3">
        <CardContent className="flex flex-col gap-2 px-3">
          <div className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">📅 Período</div>
          <MonthSelect value={month} onChange={setMonth} />
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="💰 A cobrar" value={fmtBRL(totals.total)} tone="green" />
        <StatCard label="📅 Dias trabalhados" value={totals.dias} tone="accent" />
        <StatCard label="⏰ H. extras" value={fmtBRL(totals.extra)} tone="yellow" />
        <StatCard label="⚠️ Gasto particular" value={fmtBRL(totals.gasto)} tone="red" danger />
      </div>
      <Card className="py-4">
        <CardContent className="flex flex-col gap-3 px-4">
          <div className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">Por empresa</div>
          {groups.length === 0 && <p className="text-xs text-muted-foreground">Nenhum dado ainda</p>}
          {groups.map(([cid, t]) => (
            <div key={cid} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CompanyBadge company={getCompany(cid)} />
                <span className="text-[11px] text-muted-foreground">{t.dias} dias</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <StatCard small label="Base" value={fmtBRL(t.base)} />
                <StatCard small label="H. extras" value={fmtBRL(t.extra)} tone="yellow" />
                <StatCard small label="💰 A cobrar" value={fmtBRL(t.total)} tone="green" />
                <StatCard small label="⚠️ Gasto part." value={fmtBRL(t.gasto)} tone="red" danger />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
