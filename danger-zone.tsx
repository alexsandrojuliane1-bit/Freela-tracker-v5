"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { useStore } from "@/lib/store";

export function DangerZone() {
  const clearEntries = useStore((s) => s.clearEntries);
  const [open, setOpen] = useState(false);
  return (
    <Card className="py-4">
      <CardContent className="flex flex-col gap-3 px-4">
        <div className="text-[11px] font-bold tracking-wide text-red-400 uppercase">⚠️ Zona de perigo</div>
        <Button variant="destructive" size="sm" className="w-fit rounded-lg" onClick={() => setOpen(true)}>
          Apagar todos os registros
        </Button>
      </CardContent>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Apagar TODOS os registros?"
        description="As empresas são mantidas. Esta ação não pode ser desfeita."
        confirmLabel="Apagar tudo"
        destructive
        onConfirm={() => {
          clearEntries();
          toast("Dados apagados");
        }}
      />
    </Card>
  );
}
