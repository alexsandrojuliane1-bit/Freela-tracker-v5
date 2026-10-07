"use client";

import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AddCompanyDialog } from "@/components/companies/add-company-dialog";
import { CompanyCard, draftFromCompany, type CompanyDraft } from "@/components/companies/company-card";
import { useStore } from "@/lib/store";
import { MAX_COMPANIES } from "@/lib/types";
import { BackupCard } from "./backup-card";
import { DangerZone } from "./danger-zone";
import { ExportCard } from "./export-card";

export function ConfigView() {
  const companies = useStore((s) => s.companies);
  const updateCompany = useStore((s) => s.updateCompany);
  const removeCompany = useStore((s) => s.removeCompany);
  const [drafts, setDrafts] = useState<Record<string, CompanyDraft>>({});
  const [adding, setAdding] = useState(false);

  const draftOf = (id: string) => drafts[id] ?? draftFromCompany(companies.find((c) => c.id === id)!);

  function save() {
    const num = (v: string, fallback: number, allowZero: boolean) => {
      if (v.trim() === "") return allowZero ? 0 : fallback;
      const n = Number(v);
      return Number.isFinite(n) && (allowZero ? n >= 0 : n > 0) ? n : fallback;
    };
    for (const c of companies) {
      const d = drafts[c.id];
      if (!d) continue;
      updateCompany(c.id, {
        nome: d.nome.trim() || c.nome,
        diaria: num(d.diaria, c.diaria, false),
        extra: num(d.extra, c.extra, false),
        horas: num(d.horas, c.horas, false),
        almoco: num(d.almoco, c.almoco, true),
        janta: num(d.janta, c.janta, true),
      });
    }
    setDrafts({});
    toast.success("Configurações salvas!");
  }

  return (
    <>
      {companies.map((c) => (
        <CompanyCard
          key={c.id}
          company={c}
          draft={draftOf(c.id)}
          onChange={(patch) => setDrafts((d) => ({ ...d, [c.id]: { ...draftOf(c.id), ...patch } }))}
          canRemove={companies.length > 1}
          onRemove={() => {
            removeCompany(c.id);
            setDrafts((d) => {
              const { [c.id]: _removed, ...rest } = d;
              void _removed;
              return rest;
            });
          }}
        />
      ))}
      {companies.length < MAX_COMPANIES && (
        <Button variant="outline" size="lg" className="w-full rounded-xl border-dashed text-muted-foreground" onClick={() => setAdding(true)}>
          <Plus data-icon="inline-start" /> Adicionar empresa
        </Button>
      )}
      <Button size="lg" className="w-full rounded-xl bg-emerald-500 font-bold text-white hover:bg-emerald-500/85" onClick={save}>
        <Save data-icon="inline-start" /> Salvar configurações
      </Button>
      <ExportCard />
      <BackupCard />
      <DangerZone />
      <AddCompanyDialog open={adding} onOpenChange={setAdding} />
    </>
  );
}
