"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthSelect } from "@/components/layout/month-select";
import { monthKey } from "@/lib/dates";
import { FinanceAnnual } from "./finance-annual";
import { FinanceMonthly } from "./finance-monthly";

export function FinanceView() {
  const [tab, setTab] = useState<"monthly" | "annual">("monthly");
  const [month, setMonth] = useState(() => monthKey(new Date()));

  return (
    <>
      <Card className="py-3">
        <CardContent className="flex flex-col gap-2 px-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "monthly" | "annual")}>
            <TabsList className="w-full">
              <TabsTrigger value="monthly">Mensal</TabsTrigger>
              <TabsTrigger value="annual">12 Meses</TabsTrigger>
            </TabsList>
          </Tabs>
          {tab === "monthly" && <MonthSelect value={month} onChange={setMonth} />}
        </CardContent>
      </Card>
      {tab === "monthly" ? <FinanceMonthly month={month} /> : <FinanceAnnual />}
    </>
  );
}
