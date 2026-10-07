"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { parseBackup, serializeBackup } from "@/lib/backup";
import { downloadText } from "@/lib/csv";
import { todayISO } from "@/lib/dates";
import { useStore, type Data } from "@/lib/store";

export function BackupCard() {
  const companies = useStore((s) => s.companies);
  const entries = useStore((s) => s.entries);
  const importData = useStore((s) => s.importData);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Data | null>(null);

  function exportBackup() {
    downloadText(`freela-backup-${todayISO()}.json`, serializeBackup({ companies, entries }), "application/json");
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    try {
      setPending(parseBackup(await file.text()));
    } catch {
      toast.error("Arquivo de backup inválido");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Card className="py-4">
      <CardContent className="flex flex-col gap-3 px-4">
        <div className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">💾 Backup</div>
        <p className="text-xs text-muted-foreground">Os dados ficam só neste navegador. Baixe um backup de vez em quando.</p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={exportBackup}>
            <Download data-icon="inline-start" /> Baixar backup
          </Button>
          <Button variant="outline" className="flex-1 rounded-xl" onClick={() => fileRef.current?.click()}>
            <Upload data-icon="inline-start" /> Restaurar
          </Button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        </div>
      </CardContent>
      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        title="Restaurar backup?"
        description={pending ? `Todos os dados atuais serão substituídos por ${pending.entries.length} registros e ${pending.companies.length} empresas.` : undefined}
        confirmLabel="Restaurar"
        destructive
        onConfirm={() => {
          if (pending) importData(pending);
          toast.success("Backup restaurado!");
        }}
      />
    </Card>
  );
}
