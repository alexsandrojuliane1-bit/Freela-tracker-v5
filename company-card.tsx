"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import type { Company } from "@/lib/types";

export type CompanyDraft = { nome: string; diaria: string; extra: string; horas: string; almoco: string; janta: string };

export function draftFromCompany(c: Company): CompanyDraft {
  return { nome: c.nome, diaria: String(c.diaria), extra: String(c.extra), horas: String(c.horas), almoco: String(c.almoco), janta: String(c.janta) };
}

const fields: { key: keyof Omit<CompanyDraft, "nome">; label: string; step: string }[] = [
  { key: "diaria", label: "Diária (R$)", step: "0.01" },
  { key: "extra", label: "Hora extra (R$)", step: "0.01" },
  { key: "horas", label: "Horas/dia base", step: "0.5" },
  { key: "almoco", label: "Almoço (R$/dia)", step: "0.01" },
  { key: "janta", label: "Janta (R$/dia)", step: "0.01" },
];

export function CompanyCard({
  company,
  draft,
  onChange,
  canRemove,
  onRemove,
}: {
  company: Company;
  draft: CompanyDraft;
  onChange: (patch: Partial<CompanyDraft>) => void;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const id = (k: string) => `c-${company.id}-${k}`;

  return (
    <Card className="relative py-4">
      <CardContent className="flex flex-col gap-3 px-4">
        {canRemove && (
          <Button variant="ghost" size="xs" className="absolute top-3 right-3 text-red-400 hover:text-red-400" onClick={() => setConfirm(true)}>
            <X data-icon="inline-start" /> Remover
          </Button>
        )}
        <div className="flex items-center gap-2">
          <span className="size-3 shrink-0 rounded-full" style={{ background: company.cor }} />
          <span className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">💼 {draft.nome || company.nome}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={id("nome")} className="text-[11px] text-muted-foreground">Nome</Label>
          <Input id={id("nome")} value={draft.nome} onChange={(e) => onChange({ nome: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {fields.map((f) => (
            <div key={f.key} className="flex flex-col gap-1.5">
              <Label htmlFor={id(f.key)} className="text-[11px] text-muted-foreground">{f.label}</Label>
              <Input id={id(f.key)} type="number" inputMode="decimal" step={f.step} value={draft[f.key]} onChange={(e) => onChange({ [f.key]: e.target.value })} />
            </div>
          ))}
        </div>
      </CardContent>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Remover esta empresa?"
        description="Os registros não serão apagados."
        confirmLabel="Remover"
        destructive
        onConfirm={onRemove}
      />
    </Card>
  );
}
