"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { BottomNav, TABS, type Tab } from "@/components/layout/bottom-nav";
import { RegisterView } from "@/components/entries/register-view";
import { TableView } from "@/components/entries/table-view";
import { CalendarView } from "@/components/calendar/calendar-view";
import { FinanceView } from "@/components/finance/finance-view";
import { SummaryView } from "@/components/summary/summary-view";
import { ConfigView } from "@/components/config/config-view";
import { useHydrated } from "@/hooks/use-hydrated";

const isTab = (v: string): v is Tab => TABS.some((t) => t.id === v);

export default function Home() {
  const hydrated = useHydrated();
  const [tab, setTab] = useState<Tab>("registrar");

  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.replace("#", "");
      if (isTab(h)) setTab(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  function changeTab(t: Tab) {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="flex min-h-dvh flex-col pb-[calc(72px+env(safe-area-inset-bottom))]">
      <header className="no-print sticky top-0 z-40 border-b border-border bg-surface px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-3">
        <h1 className="text-[19px] font-extrabold tracking-tight">
          Freela <span className="text-primary">Tracker</span>
        </h1>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-3 p-3">
        {!hydrated ? (
          <div className="flex flex-1 items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : (
          <>
            {tab === "registrar" && <RegisterView />}
            {tab === "tabela" && <TableView />}
            {tab === "agenda" && <CalendarView />}
            {tab === "financas" && <FinanceView />}
            {tab === "resumo" && <SummaryView />}
            {tab === "config" && <ConfigView />}
          </>
        )}
      </main>

      <BottomNav value={tab} onChange={changeTab} />
    </div>
  );
}
