"use client";

import { useImperativeHandle, type Ref } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SimpleSelect } from "@/components/layout/simple-select";
import type { Company, Entry } from "@/lib/types";

const time = z.string().regex(/^(\d{2}:\d{2})?$/, "Use HH:MM");

export const entrySchema = z.object({
  data: z.string().min(1, "Informe a data"),
  empresa: z.string().min(1, "Escolha a empresa"),
  entrada: time,
  saida: time,
  alimentacao: z.string(),
  uber: z.string(),
  obs: z.string(),
});

export type EntryFormValues = z.infer<typeof entrySchema>;
export type EntrySubmit = Omit<Entry, "id">;

export function toEntry(v: EntryFormValues): EntrySubmit {
  return {
    data: v.data,
    empresa: v.empresa,
    entrada: v.entrada || undefined,
    saida: v.saida || undefined,
    alimentacao: Number(v.alimentacao) || 0,
    uber: Number(v.uber) || 0,
    obs: v.obs.trim() || undefined,
  };
}

export function fromEntry(e: Entry): EntryFormValues {
  return {
    data: e.data,
    empresa: e.empresa,
    entrada: e.entrada ?? "",
    saida: e.saida ?? "",
    alimentacao: e.alimentacao ? String(e.alimentacao) : "",
    uber: e.uber ? String(e.uber) : "",
    obs: e.obs ?? "",
  };
}

export type EntryFormHandle = {
  setValues(p: Partial<EntryFormValues>): void;
  reset(v?: Partial<EntryFormValues>): void;
};

export function EntryForm({
  companies,
  defaultValues,
  onSubmit,
  submitLabel,
  ref,
}: {
  companies: Company[];
  defaultValues: EntryFormValues;
  onSubmit: (values: EntrySubmit) => void;
  submitLabel: string;
  ref?: Ref<EntryFormHandle>;
}) {
  const form = useForm<EntryFormValues>({ resolver: zodResolver(entrySchema), defaultValues });
  const { register, control, handleSubmit, formState: { errors } } = form;

  useImperativeHandle(
    ref,
    () => ({
      setValues: (p) => {
        for (const [k, v] of Object.entries(p)) {
          if (v !== undefined) form.setValue(k as keyof EntryFormValues, v, { shouldDirty: true });
        }
      },
      reset: (v) => form.reset({ ...defaultValues, ...v }),
    }),
    [form, defaultValues],
  );

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.nome }));

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(toEntry(v)))} className="flex flex-col gap-3" noValidate>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Data" htmlFor="f-data" error={errors.data?.message}>
          <Input id="f-data" type="date" {...register("data")} />
        </Field>
        <Field label="Empresa" htmlFor="f-empresa" error={errors.empresa?.message}>
          <Controller
            control={control}
            name="empresa"
            render={({ field }) => <SimpleSelect id="f-empresa" value={field.value} onChange={field.onChange} options={companyOptions} />}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Entrada" htmlFor="f-entrada" error={errors.entrada?.message}>
          <Input id="f-entrada" type="time" {...register("entrada")} />
        </Field>
        <Field label="Saída" htmlFor="f-saida" error={errors.saida?.message}>
          <Input id="f-saida" type="time" {...register("saida")} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Alimentação (R$)" htmlFor="f-alim">
          <Input id="f-alim" type="number" inputMode="decimal" min={0} step="0.01" placeholder="0" {...register("alimentacao")} />
        </Field>
        <Field label="Uber/Transp. (R$)" htmlFor="f-uber">
          <Input id="f-uber" type="number" inputMode="decimal" min={0} step="0.01" placeholder="0" {...register("uber")} />
        </Field>
      </div>
      <Field label="Observação" htmlFor="f-obs">
        <Textarea id="f-obs" placeholder="Ex: evento especial..." rows={2} {...register("obs")} />
      </Field>
      <Button type="submit" size="lg" className="mt-1 w-full rounded-xl font-bold">
        {submitLabel}
      </Button>
    </form>
  );
}

function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </Label>
      {children}
      {error && <span className="text-[11px] text-red-400">{error}</span>}
    </div>
  );
}
