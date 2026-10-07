import { calcEntry } from "./calc";
import type { Company, Entry } from "./types";

const q = (s: string) => `"${s.replace(/"/g, '""')}"`;

export function entriesToCSV(entries: Entry[], getCompany: (id: string) => Company) {
  let csv = "Data,Empresa,Entrada,Saída,H.Extra,Base,Extra R$,Alim.Extra,Transporte,Total,Obs\n";
  for (const e of entries) {
    const co = getCompany(e.empresa);
    const c = calcEntry(e, co);
    csv += `${e.data},${q(co.nome)},${e.entrada ?? ""},${e.saida ?? ""},${c.extraHours.toFixed(1)},${c.base.toFixed(2)},${c.extraVal.toFixed(2)},${c.alimExtra.toFixed(2)},${c.uber.toFixed(2)},${c.total.toFixed(2)},${q(e.obs ?? "")}\n`;
  }
  return csv;
}

export function downloadText(filename: string, text: string, mime = "text/plain") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: `${mime};charset=utf-8` }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
