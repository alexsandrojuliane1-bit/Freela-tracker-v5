"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";

const empty = { nome: "", diaria: "", extra: "", horas: "12", almoco: "", janta: "" };

export function AddCompanyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const companies = useStore((s) => s.companies);
  const addCompany = useStore((s) => s.addCompany);
  const [v, setV] = useState({ ...empty, nome: `Empresa ${companies.length + 1}` });
  const [error, setError] = useState("");

  function handleOpenChange(o: boolean) {
    if (o) {
      setV({ ...empty, nome: `Empresa ${companies.length + 1}` });
      setError("");
    }
    onOpenChange(o);
  }

  function submit() {
    const nome = v.nome.trim();
    if (!nome) {
      setError("Informe o nome");
      return;
    }
    addCompany({
      nome,
      diaria: Number(v.diaria) || 550,
      extra: Number(v.extra) || 45.83,
      horas: Number(v.horas) || 12,
      almoco: Number(v.almoco) || 0,
      janta: Number(v.janta) || 0,
    });
    toast.success(`${nome} adicionada!`);
    onOpenChange(false);
  }

  const num = (key: keyof typeof empty, label: string, placeholder: string, step = "0.01") => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`m-${key}`} className="text-[11px] text-muted-foreground">{label}</Label>
      <Input id={`m-${key}`} type="number" inputMode="decimal" step={step} placeholder={placeholder} value={v[key]} onChange={(e) => setV({ ...v, [key]: e.target.value })} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[90vw] rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova empresa</DialogTitle>
          <DialogDescription>Campos vazios usam os valores padrão.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="m-nome" className="text-[11px] text-muted-foreground">Nome da empresa</Label>
            <Input id="m-nome" placeholder="Ex: Empresa 3" value={v.nome} onChange={(e) => { setV({ ...v, nome: e.target.value }); setError(""); }} />
            {error && <span className="text-[11px] text-red-400">{error}</span>}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {num("diaria", "Diária (R$)", "550")}
            {num("extra", "Hora extra (R$)", "45.83")}
            {num("horas", "Horas/dia base", "12", "0.5")}
            {num("almoco", "Alim. almoço (R$)", "0")}
            {num("janta", "Alim. janta (R$)", "0")}
          </div>
          <Button className="mt-1 w-full rounded-xl font-bold" size="lg" onClick={submit}>
            Adicionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
