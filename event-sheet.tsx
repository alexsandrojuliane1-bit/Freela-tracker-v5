"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/layout/confirm-dialog";
import { addDays, type CalEvent } from "@/lib/calendar-grid";
import { todayISO } from "@/lib/dates";
import { createEvent, deleteEvent, updateEvent, type EventInput } from "@/lib/google-calendar";

export type EventSheetTarget = { event: CalEvent } | { date: string };

const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

function initialValues(t: EventSheetTarget): EventInput {
  if ("event" in t) {
    const e = t.event;
    return {
      title: e.title === "(sem título)" ? "" : e.title,
      allDay: e.allDay,
      date: e.allDay ? e.start : todayISO(new Date(e.start)),
      endDate: e.allDay ? addDays(e.end, -1) : todayISO(new Date(e.end)),
      startTime: e.allDay ? "09:00" : hhmm(e.start),
      endTime: e.allDay ? "18:00" : hhmm(e.end),
      description: e.description ?? "",
      location: e.location ?? "",
    };
  }
  return { title: "", allDay: false, date: t.date, endDate: t.date, startTime: "09:00", endTime: "18:00", description: "", location: "" };
}

export function EventSheet({ target, onClose, onChanged }: { target: EventSheetTarget; onClose: () => void; onChanged: () => void }) {
  const editing = "event" in target ? target.event : null;
  const [v, setV] = useState<EventInput>(() => initialValues(target));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (patch: Partial<EventInput>) => setV((p) => ({ ...p, ...patch }));

  async function save() {
    if (!v.title.trim()) return toast.error("Dê um título ao evento");
    if (!v.date || !v.endDate) return toast.error("Informe as datas");
    if (v.endDate < v.date) return toast.error("A data final é antes da inicial");
    if (!v.allDay && `${v.endDate}T${v.endTime}` <= `${v.date}T${v.startTime}`) return toast.error("O fim precisa ser depois do início");
    setSaving(true);
    try {
      if (editing) await updateEvent(editing.id, v);
      else await createEvent(v);
      toast.success(editing ? "Evento atualizado!" : "Evento criado!");
      onChanged();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar evento");
      setSaving(false);
    }
  }

  async function remove() {
    if (!editing) return;
    try {
      await deleteEvent(editing.id);
      toast.success("Evento excluído");
      onChanged();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir evento");
    }
  }

  return (
    <>
      <Sheet open onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="bottom" className="mx-auto max-h-[92dvh] overflow-y-auto rounded-t-2xl pb-[calc(16px+env(safe-area-inset-bottom))] sm:max-w-xl sm:rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar evento" : "Novo evento"}</SheetTitle>
            <SheetDescription>Salvo direto no seu Google Agenda.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-3 px-4 pb-2">
            <Field label="Título" htmlFor="ev-title">
              <Input id="ev-title" value={v.title} onChange={(e) => set({ title: e.target.value })} placeholder="Ex: Diária – Empresa 1" />
            </Field>
            <Label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-normal">
              <Checkbox checked={v.allDay} onCheckedChange={(c) => set({ allDay: Boolean(c) })} />
              Dia inteiro
            </Label>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="De" htmlFor="ev-date">
                <Input id="ev-date" type="date" value={v.date} onChange={(e) => set({ date: e.target.value, endDate: v.endDate < e.target.value ? e.target.value : v.endDate })} />
              </Field>
              <Field label="Início" htmlFor="ev-start">
                <Input id="ev-start" type="time" disabled={v.allDay} value={v.startTime} onChange={(e) => set({ startTime: e.target.value })} />
              </Field>
              <Field label="Até" htmlFor="ev-end-date">
                <Input id="ev-end-date" type="date" min={v.date} value={v.endDate} onChange={(e) => set({ endDate: e.target.value })} />
              </Field>
              <Field label="Fim" htmlFor="ev-end">
                <Input id="ev-end" type="time" disabled={v.allDay} value={v.endTime} onChange={(e) => set({ endTime: e.target.value })} />
              </Field>
            </div>
            <Field label="Local" htmlFor="ev-loc">
              <Input id="ev-loc" value={v.location} onChange={(e) => set({ location: e.target.value })} />
            </Field>
            <Field label="Descrição" htmlFor="ev-desc">
              <Textarea id="ev-desc" rows={2} value={v.description} onChange={(e) => set({ description: e.target.value })} />
            </Field>
            <Button size="lg" className="mt-1 w-full rounded-xl font-bold" onClick={save} disabled={saving}>
              {saving ? "Salvando…" : editing ? "Salvar alterações" : "Criar evento"}
            </Button>
            {editing && (
              <Button variant="outline" className="w-full rounded-xl text-destructive" onClick={() => setConfirmDelete(true)} disabled={saving}>
                <Trash2 data-icon="inline-start" /> Excluir evento
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir evento?"
        description="Ele também será removido do seu Google Agenda."
        confirmLabel="Excluir"
        destructive
        onConfirm={remove}
      />
    </>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </Label>
      {children}
    </div>
  );
}
