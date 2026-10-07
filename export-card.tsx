"use client";

import { useMemo, useState } from "react";
import { FileText, Sheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MonthSelect } from "@/components/layout/month-select";
import { downloadText, entriesToCSV } from "@/lib/csv";
import { formatDateBR, monthKey } from "@/lib/dates";
import { daysToParam, entriesOfMonth, filterByDays, uniqueDays } from "@/lib/export";
import { useStore } from "@/lib/store";

export function ExportCard() {
  const entries = useStore((s) => s.entries);
  const getCompany = useStore((s) => s.getCompany);
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [includeGastos, setIncludeGastos] = useState(false);
  // dias desmarcados (padrão: todos os dias do mês marcados)
  const [excluded, setExcluded] = useState<string[]>([]);

  const monthEntries = useMemo(() => entriesOfMonth(entries, month), [entries, month]);
  const days = useMemo(() => uniqueDays(monthEntries), [monthEntries]);
  const selectedDays = days.filter((d) => !excluded.includes(d));

  function changeMonth(m: string) {
    setMonth(m);
    setExcluded([]);
  }

  function toggle(day: string, checked: boolean) {
    setExcluded((ex) => (checked ? ex.filter((d) => d !== day) : [...ex, day]));
  }

  function exportCSV() {
    if (!selectedDays.length) return toast.error("Selecione ao menos um dia");
    downloadText(`freela-${month}.csv`, "﻿" + entriesToCSV(filterByDays(monthEntries, selectedDays), getCompany), "text/csv");
  }

  function exportPDF() {
    if (!selectedDays.length) return toast.error("Selecione ao menos um dia");
    window.open(`/relatorio?mes=${month}&gastos=${includeGastos ? 1 : 0}&dias=${daysToParam(selectedDays)}`, "_blank");
  }

  return (
    <Card className="py-4">
      <CardContent className="flex flex-col gap-3 px-4">
        <div className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">📤 Exportar relatório</div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="export-month" className="text-[11px] text-muted-foreground">Mês do relatório</Label>
          <MonthSelect id="export-month" value={month} onChange={changeMonth} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Dias no relatório: {selectedDays.length} de {days.length}
            </span>
            {days.length > 0 && (
              <span className="flex gap-3 text-[11px] font-semibold text-primary">
                <button type="button" onClick={() => setExcluded([])}>Todos</button>
                <button type="button" onClick={() => setExcluded(days)}>Nenhum</button>
              </span>
            )}
          </div>
          {days.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">Nenhum registro neste mês.</p>
          ) : (
            <div className="grid max-h-56 grid-cols-2 gap-1.5 overflow-y-auto">
              {days.map((day) => (
                <Label key={day} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2 text-[13px] font-normal">
                  <Checkbox checked={!excluded.includes(day)} onCheckedChange={(c) => toggle(day, Boolean(c))} />
                  {formatDateBR(day).slice(0, 5)}
                </Label>
              ))}
            </div>
          )}
        </div>

        <Label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-normal">
          <Checkbox checked={includeGastos} onCheckedChange={(c) => setIncludeGastos(Boolean(c))} />
          Incluir alimentação e transporte no total
        </Label>
        <div className="flex gap-2">
          <Button className="flex-1 rounded-xl" onClick={exportPDF} disabled={!selectedDays.length}>
            <FileText data-icon="inline-start" /> Exportar PDF
          </Button>
          <Button variant="outline" className="flex-1 rounded-xl" onClick={exportCSV} disabled={!selectedDays.length}>
            <Sheet data-icon="inline-start" /> CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
