import { summarizeEntries } from "./calc";
import { last12Months } from "./dates";
import type { Company, Entry } from "./types";

export type MonthRow = { label: string; dias: number; ganhos: number; alim: number; transporte: number; liquido: number };

export function annualSeries(entries: Entry[], getCompany: (id: string) => Company, now = new Date()): MonthRow[] {
  return last12Months(now).map((m) => {
    const t = summarizeEntries(entries.filter((e) => e.data.startsWith(m.key)), getCompany);
    const alim = t.alimConf + t.alimExtra;
    return { label: m.label, dias: t.dias, ganhos: t.total, alim, transporte: t.uber, liquido: t.total - alim - t.uber };
  });
}
