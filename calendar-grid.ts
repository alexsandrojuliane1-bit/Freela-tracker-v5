import { monthKey, todayISO } from "./dates";

export type CalEvent = {
  id: string;
  title: string;
  /** Dia inteiro: YYYY-MM-DD. Com horário: ISO dateTime. */
  start: string;
  /** Dia inteiro: YYYY-MM-DD (exclusivo, como no Google). Com horário: ISO dateTime. */
  end: string;
  allDay: boolean;
  description?: string;
  location?: string;
  htmlLink?: string;
};

const parseISO = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return todayISO(d);
}

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

/** Células do mês, começando no domingo. `null` = célula vazia. Sempre múltiplo de 7. */
export function monthGrid(key: string): (string | null)[] {
  const [y, m] = key.split("-").map(Number);
  const lead = new Date(y, m - 1, 1).getDay();
  const total = new Date(y, m, 0).getDate();
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= total; d++) cells.push(`${key}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

/** Intervalo do mês para consultar a API (inclui folga de 1 dia por causa de fusos). */
export function monthRange(key: string) {
  const [y, m] = key.split("-").map(Number);
  return { timeMin: new Date(y, m - 1, 1).toISOString(), timeMax: new Date(y, m, 1).toISOString() };
}

/** Dias (YYYY-MM-DD, horário local) que o evento cobre. */
export function eventDays(ev: CalEvent): string[] {
  let first: string;
  let last: string;
  if (ev.allDay) {
    first = ev.start;
    last = addDays(ev.end, -1);
  } else {
    const s = new Date(ev.start);
    const e = new Date(ev.end);
    first = todayISO(s);
    const endsAtMidnight = e.getHours() === 0 && e.getMinutes() === 0 && e > s;
    last = endsAtMidnight ? addDays(todayISO(e), -1) : todayISO(e);
  }
  if (last < first) last = first;
  const out: string[] = [];
  for (let d = first, i = 0; d <= last && i < 62; d = addDays(d, 1), i++) out.push(d);
  return out;
}

export function groupEventsByDay(events: CalEvent[]): Record<string, CalEvent[]> {
  const out: Record<string, CalEvent[]> = {};
  for (const ev of events) for (const d of eventDays(ev)) (out[d] ??= []).push(ev);
  for (const list of Object.values(out)) list.sort((a, b) => Number(a.allDay ? 0 : 1) - Number(b.allDay ? 0 : 1) || a.start.localeCompare(b.start));
  return out;
}

export function eventTimeLabel(ev: CalEvent): string {
  if (ev.allDay) return "Dia inteiro";
  const t = (s: string) => new Date(s).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${t(ev.start)}–${t(ev.end)}`;
}
