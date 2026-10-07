"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtBRL } from "@/lib/calc";
import { annualSeries } from "@/lib/finance";
import { useStore } from "@/lib/store";

function MonthChart({ title, data, dataKey, color }: { title: string; data: Record<string, string | number>[]; dataKey: string; color: string }) {
  return (
    <Card className="py-4">
      <CardContent className="flex flex-col gap-3 px-4">
        <div className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">{title}</div>
        <ChartContainer config={{ [dataKey]: { label: title, color } }} className="h-44 w-full">
          <BarChart data={data} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#232840" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "#6b7494" }} interval={0} tickFormatter={(v: string) => v.split(" ")[0]} />
            <YAxis tickLine={false} axisLine={false} width={52} tick={{ fontSize: 9, fill: "#6b7494" }} tickFormatter={(v) => "R$" + Number(v).toLocaleString("pt-BR")} />
            <ChartTooltip cursor={{ fill: "#232840", opacity: 0.5 }} content={<ChartTooltipContent formatter={(v) => fmtBRL(Number(v))} />} />
            <Bar dataKey={dataKey} fill={color} radius={6} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function FinanceAnnual() {
  const entries = useStore((s) => s.entries);
  const companies = useStore((s) => s.companies);
  const getCompany = useStore((s) => s.getCompany);

  const data = useMemo(() => annualSeries(entries, getCompany), [entries, getCompany, companies]); // eslint-disable-line react-hooks/exhaustive-deps
  const totals = data.reduce(
    (acc, d) => ({ dias: acc.dias + d.dias, ganhos: acc.ganhos + d.ganhos, alim: acc.alim + d.alim, transporte: acc.transporte + d.transporte, liquido: acc.liquido + d.liquido }),
    { dias: 0, ganhos: 0, alim: 0, transporte: 0, liquido: 0 },
  );
  const gastos = data.map((d) => ({ ...d, gastos: d.alim + d.transporte }));

  return (
    <>
      <MonthChart title="📈 Ganhos mensais — últimos 12 meses" data={data} dataKey="ganhos" color="#34d399" />
      <MonthChart title="💸 Gastos mensais (alim + transporte)" data={gastos} dataKey="gastos" color="#f87171" />
      <MonthChart title="📊 Lucro líquido (ganhos − gastos)" data={data} dataKey="liquido" color="#4f8ef7" />
      <Card className="py-0">
        <CardContent className="overflow-x-auto px-0">
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-2">Mês</TableHead>
                <TableHead className="px-2">Dias</TableHead>
                <TableHead className="px-2">Ganhos</TableHead>
                <TableHead className="px-2">Alim.</TableHead>
                <TableHead className="px-2">Transporte</TableHead>
                <TableHead className="px-2">Líquido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.label}>
                  <TableCell className="px-2 whitespace-nowrap">{d.label}</TableCell>
                  <TableCell className="px-2">{d.dias}</TableCell>
                  <TableCell className="px-2 whitespace-nowrap text-emerald-400">{fmtBRL(d.ganhos)}</TableCell>
                  <TableCell className="px-2 whitespace-nowrap text-orange-400">{fmtBRL(d.alim)}</TableCell>
                  <TableCell className="px-2 whitespace-nowrap text-amber-400">{fmtBRL(d.transporte)}</TableCell>
                  <TableCell className="px-2 font-bold whitespace-nowrap text-primary">{fmtBRL(d.liquido)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-primary/10 font-bold">
                <TableCell className="px-2">TOTAL</TableCell>
                <TableCell className="px-2">{totals.dias}</TableCell>
                <TableCell className="px-2 whitespace-nowrap">{fmtBRL(totals.ganhos)}</TableCell>
                <TableCell className="px-2 whitespace-nowrap">{fmtBRL(totals.alim)}</TableCell>
                <TableCell className="px-2 whitespace-nowrap">{fmtBRL(totals.transporte)}</TableCell>
                <TableCell className="px-2 whitespace-nowrap">{fmtBRL(totals.liquido)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
