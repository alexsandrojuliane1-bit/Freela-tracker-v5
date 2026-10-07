"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { useHydrated } from "@/hooks/use-hydrated";
import { calcEntry, fmtBRL, fmtHours, groupByCompany, summarizeEntries } from "@/lib/calc";
import { filterByDays, entriesOfMonth, parseDaysParam } from "@/lib/export";
import { formatDateBR, monthKey, monthLabel, todayISO } from "@/lib/dates";
import { useStore } from "@/lib/store";

export function ReportView() {
  const params = useSearchParams();
  const month = params.get("mes") || monthKey(new Date());
  const withGastos = params.get("gastos") === "1";
  const daysParam = params.get("dias");
  const hydrated = useHydrated();
  const entries = useStore((s) => s.entries);
  const getCompany = useStore((s) => s.getCompany);

  const rows = useMemo(() => filterByDays(entriesOfMonth(entries, month), parseDaysParam(daysParam)), [entries, month, daysParam]);
  const totals = summarizeEntries(rows, getCompany);
  const byCompany = groupByCompany(rows, getCompany);
  const grand = withGastos ? totals.total + totals.gasto : totals.total;

  if (!hydrated) return null;

  return (
    <div className="min-h-dvh bg-white text-black print:min-h-0" style={{ colorScheme: "light" }}>
      <div className="no-print flex items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
        <button type="button" onClick={() => history.back()} className="inline-flex items-center gap-1.5 text-sm text-gray-700">
          <ArrowLeft className="size-4" /> Voltar
        </button>
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-sm font-semibold text-white">
          <Printer className="size-4" /> Imprimir / salvar PDF
        </button>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-6 text-[13px]">
        <h1 className="text-xl font-bold">Relatório de dias trabalhados</h1>
        <p className="mb-5 text-gray-600">
          {monthLabel(month)} · {rows.length} {rows.length === 1 ? "dia" : "dias"}
          {daysParam && " · dias selecionados"}
          {withGastos && " · inclui alimentação e transporte"}
        </p>

        {rows.length === 0 ? (
          <p className="py-10 text-center text-gray-500">Nenhum registro no período selecionado.</p>
        ) : (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-800 text-left text-[11px] tracking-wide text-gray-600 uppercase">
                  <th className="py-1.5 pr-2">Data</th>
                  <th className="py-1.5 pr-2">Empresa</th>
                  <th className="py-1.5 pr-2">Horário</th>
                  <th className="py-1.5 pr-2 text-right">H. extra</th>
                  <th className="py-1.5 pr-2 text-right">Base</th>
                  <th className="py-1.5 pr-2 text-right">Extra</th>
                  {withGastos && <th className="py-1.5 pr-2 text-right">Alim.+Transp.</th>}
                  <th className="py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const co = getCompany(e.empresa);
                  const c = calcEntry(e, co);
                  return (
                    <tr key={e.id} className="border-b border-gray-200">
                      <td className="py-1.5 pr-2 whitespace-nowrap">{formatDateBR(e.data)}</td>
                      <td className="py-1.5 pr-2">{co.nome}</td>
                      <td className="py-1.5 pr-2 whitespace-nowrap">{e.entrada && e.saida ? `${e.entrada}–${e.saida}` : "–"}</td>
                      <td className="py-1.5 pr-2 text-right">{fmtHours(c.extraHours)}</td>
                      <td className="py-1.5 pr-2 text-right whitespace-nowrap">{fmtBRL(c.base)}</td>
                      <td className="py-1.5 pr-2 text-right whitespace-nowrap">{fmtBRL(c.extraVal)}</td>
                      {withGastos && <td className="py-1.5 pr-2 text-right whitespace-nowrap">{fmtBRL(c.totalGasto)}</td>}
                      <td className="py-1.5 text-right font-semibold whitespace-nowrap">{fmtBRL(withGastos ? c.totalComGastos : c.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <h2 className="mt-6 mb-2 text-sm font-bold">Por empresa</h2>
            <table className="w-full border-collapse">
              <tbody>
                {Object.entries(byCompany).map(([cid, t]) => (
                  <tr key={cid} className="border-b border-gray-200">
                    <td className="py-1.5 pr-2">{getCompany(cid).nome}</td>
                    <td className="py-1.5 pr-2 text-gray-600">{t.dias} {t.dias === 1 ? "dia" : "dias"}</td>
                    <td className="py-1.5 text-right font-semibold whitespace-nowrap">{fmtBRL(withGastos ? t.total + t.gasto : t.total)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-800">
                  <td className="py-2 pr-2 font-bold" colSpan={2}>TOTAL A COBRAR</td>
                  <td className="py-2 text-right text-base font-bold whitespace-nowrap">{fmtBRL(grand)}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        <p className="mt-8 text-[11px] text-gray-500">Gerado em {formatDateBR(todayISO())} · Freela Tracker</p>
      </main>
    </div>
  );
}
