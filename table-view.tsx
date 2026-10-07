"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MonthSelect } from "@/components/layout/month-select";
import { SimpleSelect } from "@/components/layout/simple-select";
import { monthKey } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { EntriesTable } from "./entries-table";

export function TableView() {
  const entries = useStore((s) => s.entries);
  const companies = useStore((s) => s.companies);
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [empresa, setEmpresa] = useState("all");

  const filtered = useMemo(
    () =>
      entries
        .filter((e) => e.data.startsWith(month) && (empresa === "all" || e.empresa === empresa))
        .sort((a, b) => a.data.localeCompare(b.data)),
    [entries, month, empresa],
  );

  const companyOptions = [{ value: "all", label: "Todas empresas" }, ...companies.map((c) => ({ value: c.id, label: c.nome }))];

  return (
    <>
      <Card className="py-3">
        <CardContent className="flex gap-2 px-3">
          <MonthSelect value={month} onChange={setMonth} className="flex-1" />
          <SimpleSelect value={empresa} onChange={setEmpresa} options={companyOptions} className="flex-1" />
        </CardContent>
      </Card>
      <Card className="py-0">
        <CardContent className="px-0">
          <EntriesTable entries={filtered} />
        </CardContent>
      </Card>
    </>
  );
}
