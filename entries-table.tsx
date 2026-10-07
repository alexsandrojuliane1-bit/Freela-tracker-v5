"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CompanyBadge } from "@/components/layout/company-badge";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { calcEntry, fmtBRL, fmtHours, summarizeEntries } from "@/lib/calc";
import { useStore } from "@/lib/store";
import type { Entry } from "@/lib/types";
import { EditEntrySheet } from "./edit-entry-sheet";

export function EntriesTable({ entries }: { entries: Entry[] }) {
  const getCompany = useStore((s) => s.getCompany);
  const removeEntry = useStore((s) => s.removeEntry);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState<Entry | null>(null);

  if (!entries.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
        <span className="text-3xl">📭</span>Nenhum registro
      </div>
    );
  }

  const t = summarizeEntries(entries, getCompany);

  return (
    <>
      <div className="overflow-x-auto">
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-2">Data</TableHead>
              <TableHead className="px-2">Empresa</TableHead>
              <TableHead className="px-2">Horário</TableHead>
              <TableHead className="px-2">H.Extra</TableHead>
              <TableHead className="px-2">Base</TableHead>
              <TableHead className="px-2">Extra R$</TableHead>
              <TableHead className="px-2">Total</TableHead>
              <TableHead className="px-2">Gasto</TableHead>
              <TableHead className="sticky right-0 bg-card px-2" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => {
              const co = getCompany(e.empresa);
              const c = calcEntry(e, co);
              return (
                <TableRow key={e.id}>
                  <TableCell className="px-2 font-bold">{e.data.split("-")[2]}</TableCell>
                  <TableCell className="px-2"><CompanyBadge company={co} /></TableCell>
                  <TableCell className="px-2 whitespace-nowrap">{e.entrada && e.saida ? `${e.entrada}–${e.saida}` : "–"}</TableCell>
                  <TableCell className="px-2">{fmtHours(c.extraHours)}</TableCell>
                  <TableCell className="px-2 whitespace-nowrap">{fmtBRL(c.base)}</TableCell>
                  <TableCell className="px-2 whitespace-nowrap text-amber-400">{fmtBRL(c.extraVal)}</TableCell>
                  <TableCell className="px-2 font-bold whitespace-nowrap text-emerald-400">{fmtBRL(c.total)}</TableCell>
                  <TableCell className="px-2 text-[10px] whitespace-nowrap text-red-400">{c.totalGasto > 0 ? fmtBRL(c.totalGasto) : "–"}</TableCell>
                  <TableCell className="sticky right-0 bg-card px-1 shadow-[-6px_0_8px_-6px_rgba(0,0,0,.6)]">
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="icon-sm" aria-label="Editar" onClick={() => setEditing(e)}>
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label="Excluir" className="text-red-400 hover:text-red-400" onClick={() => setDeleting(e)}>
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-primary/10 font-bold">
              <TableCell colSpan={3} className="px-2">TOTAL A COBRAR ({t.dias} dias)</TableCell>
              <TableCell className="px-2">{fmtHours(t.extraHours)}</TableCell>
              <TableCell className="px-2 whitespace-nowrap">{fmtBRL(t.base)}</TableCell>
              <TableCell className="px-2 whitespace-nowrap">{fmtBRL(t.extra)}</TableCell>
              <TableCell colSpan={2} className="px-2 whitespace-nowrap text-emerald-400">{fmtBRL(t.total)}</TableCell>
              <TableCell />
            </TableRow>
            <TableRow className="bg-red-400/5">
              <TableCell colSpan={6} className="px-2 text-[11px] font-semibold text-red-400">⚠️ Gastos particulares (alim. + transp.) — não cobrado</TableCell>
              <TableCell colSpan={2} className="px-2 font-bold whitespace-nowrap text-red-400">{fmtBRL(t.gasto)}</TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {editing && <EditEntrySheet entry={editing} onOpenChange={(o) => !o && setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Apagar este registro?"
        description={deleting ? `${deleting.data.split("-").reverse().join("/")} — ${getCompany(deleting.empresa).nome}` : undefined}
        confirmLabel="Apagar"
        destructive
        onConfirm={() => {
          if (deleting) removeEntry(deleting.id);
          toast("Registro apagado");
        }}
      />
    </>
  );
}
