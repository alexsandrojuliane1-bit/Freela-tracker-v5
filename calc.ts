import type { Company, Entry } from "./types";

export type EntryCalc = {
  extraHours: number;
  base: number;
  extraVal: number;
  alimConf: number;
  alimExtra: number;
  totalAlim: number;
  uber: number;
  totalGasto: number;
  total: number;
  totalComGastos: number;
};

export function calcEntry(e: Entry, c: Company): EntryCalc {
  let extraHours = 0;
  if (e.entrada && e.saida) {
    const [eh, em] = e.entrada.split(":").map(Number);
    const [sh, sm] = e.saida.split(":").map(Number);
    let mins = sh * 60 + sm - (eh * 60 + em);
    if (mins < 0) mins += 24 * 60;
    extraHours = Math.max(0, mins / 60 - c.horas);
  }
  const base = c.diaria;
  const extraVal = extraHours * c.extra;
  const alimConf = (c.almoco || 0) + (c.janta || 0);
  const alimExtra = Number(e.alimentacao) || 0;
  const uber = Number(e.uber) || 0;
  const totalAlim = alimConf + alimExtra;
  const totalGasto = totalAlim + uber;
  const total = base + extraVal;
  return { extraHours, base, extraVal, alimConf, alimExtra, totalAlim, uber, totalGasto, total, totalComGastos: total + totalGasto };
}

export type Totals = {
  dias: number;
  base: number;
  extra: number;
  extraHours: number;
  alimConf: number;
  alimExtra: number;
  uber: number;
  total: number;
  gasto: number;
  liquido: number;
};

export const emptyTotals = (): Totals => ({ dias: 0, base: 0, extra: 0, extraHours: 0, alimConf: 0, alimExtra: 0, uber: 0, total: 0, gasto: 0, liquido: 0 });

function accumulate(t: Totals, r: EntryCalc) {
  t.dias++;
  t.base += r.base;
  t.extra += r.extraVal;
  t.extraHours += r.extraHours;
  t.alimConf += r.alimConf;
  t.alimExtra += r.alimExtra;
  t.uber += r.uber;
  t.total += r.total;
  t.gasto += r.totalGasto;
  t.liquido += r.total - r.uber - r.alimExtra;
}

export function summarizeEntries(entries: Entry[], getCompany: (id: string) => Company): Totals {
  const t = emptyTotals();
  for (const e of entries) accumulate(t, calcEntry(e, getCompany(e.empresa)));
  return t;
}

export function groupByCompany(entries: Entry[], getCompany: (id: string) => Company): Record<string, Totals> {
  const out: Record<string, Totals> = {};
  for (const e of entries) {
    const c = getCompany(e.empresa);
    out[c.id] ??= emptyTotals();
    accumulate(out[c.id], calcEntry(e, c));
  }
  return out;
}

export function fmtBRL(n: number) {
  return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtHours(h: number) {
  return h > 0 ? `${h.toFixed(1)}h` : "0h";
}
