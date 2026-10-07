"use client";

import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useStore } from "@/lib/store";
import type { Entry } from "@/lib/types";
import { EntryForm, fromEntry } from "./entry-form";

export function EditEntrySheet({ entry, onOpenChange }: { entry: Entry; onOpenChange: (open: boolean) => void }) {
  const companies = useStore((s) => s.companies);
  const updateEntry = useStore((s) => s.updateEntry);

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] overflow-y-auto rounded-t-2xl pb-[calc(16px+env(safe-area-inset-bottom))] sm:max-w-xl sm:rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Editar registro</SheetTitle>
          <SheetDescription>Altere os campos e salve.</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-2">
          <EntryForm
            key={entry.id}
            companies={companies}
            defaultValues={fromEntry(entry)}
            submitLabel="Salvar alterações"
            onSubmit={(values) => {
              updateEntry(entry.id, values);
              toast.success("Registro atualizado!");
              onOpenChange(false);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
