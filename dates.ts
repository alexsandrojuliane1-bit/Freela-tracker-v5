export const MONTHS_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
export const MONTHS_SHORT_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const pad = (n: number) => String(n).padStart(2, "0");

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function todayISO(now = new Date()) {
  return `${monthKey(now)}-${pad(now.getDate())}`;
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return `${MONTHS_PT[m - 1]} ${y}`;
}

export function monthOptions(now = new Date(), fromYear = 2024) {
  const out: { value: string; label: string }[] = [];
  for (let y = now.getFullYear(); y >= fromYear; y--) {
    const maxM = y === now.getFullYear() ? now.getMonth() : 11;
    for (let m = maxM; m >= 0; m--) out.push({ value: `${y}-${pad(m + 1)}`, label: `${MONTHS_PT[m]} ${y}` });
  }
  return out;
}

export function last12Months(now = new Date()) {
  const out: { key: string; label: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: monthKey(d), label: `${MONTHS_SHORT_PT[d.getMonth()]} ${d.getFullYear()}` });
  }
  return out;
}

export function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
