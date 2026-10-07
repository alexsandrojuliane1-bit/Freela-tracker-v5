import type { Entry } from "./types";

/** Registros de um mês (YYYY-MM), ordenados por data. */
export function entriesOfMonth(entries: Entry[], month: string): Entry[] {
  return entries.filter((e) => e.data.startsWith(month)).sort((a, b) => a.data.localeCompare(b.data));
}

/** Dias distintos (YYYY-MM-DD) com registro, em ordem crescente. */
export function uniqueDays(entries: Entry[]): string[] {
  return [...new Set(entries.map((e) => e.data))].sort();
}

/** Mantém só os registros dos dias informados. `null` = sem filtro. */
export function filterByDays(entries: Entry[], days: string[] | null): Entry[] {
  if (!days) return entries;
  const set = new Set(days);
  return entries.filter((e) => set.has(e.data));
}

/** Lê o parâmetro `dias` da URL do relatório (`2026-08-01,2026-08-03`). */
export function parseDaysParam(value: string | null): string[] | null {
  if (!value) return null;
  const days = value.split(",").filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  return days.length ? days : null;
}

export function daysToParam(days: string[]): string {
  return days.join(",");
}
