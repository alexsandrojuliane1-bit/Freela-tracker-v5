"use client";

import { useMemo, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { todayISO } from "@/lib/dates";
import type { ParsedEntry } from "@/lib/parse-transcript";
import { EntryForm, type EntryFormHandle, type EntryFormValues } from "./entry-form";
import { VoiceCapture } from "./voice-capture";

export function RegisterView() {
  const companies = useStore((s) => s.companies);
  const addEntry = useStore((s) => s.addEntry);
  const formRef = useRef<EntryFormHandle>(null);

  const defaults = useMemo<EntryFormValues>(
    () => ({ data: todayISO(), empresa: companies[0]?.id ?? "", entrada: "", saida: "", alimentacao: "", uber: "", obs: "" }),
    [companies],
  );

  function handleParsed(p: ParsedEntry) {
    formRef.current?.setValues({
      data: p.data,
      empresa: p.empresa,
      entrada: p.entrada,
      saida: p.saida,
      alimentacao: p.alimentacao !== undefined ? String(p.alimentacao) : undefined,
      uber: p.uber !== undefined ? String(p.uber) : undefined,
    });
  }

  return (
    <>
      <VoiceCapture onParsed={handleParsed} />
      <Card className="gap-3 py-4">
        <CardContent className="flex flex-col gap-3 px-4">
          <div className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">✏️ Manual</div>
          <EntryForm
            ref={formRef}
            companies={companies}
            defaultValues={defaults}
            submitLabel="+ Adicionar registro"
            onSubmit={(values) => {
              addEntry(values);
              toast.success("Registro adicionado!");
              formRef.current?.reset({ data: values.data, empresa: values.empresa });
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
