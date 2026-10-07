import { z } from "zod";
import type { Company, Entry } from "./types";

const companySchema = z.object({
  id: z.string(),
  nome: z.string(),
  diaria: z.number(),
  extra: z.number(),
  horas: z.number(),
  almoco: z.number(),
  janta: z.number(),
  cor: z.string(),
});

const entrySchema = z.object({
  id: z.string(),
  data: z.string(),
  empresa: z.string(),
  entrada: z.string().optional(),
  saida: z.string().optional(),
  alimentacao: z.number(),
  uber: z.number(),
  obs: z.string().optional(),
});

export const backupSchema = z.object({ companies: z.array(companySchema).min(1), entries: z.array(entrySchema) });

export function serializeBackup(data: { companies: Company[]; entries: Entry[] }) {
  return JSON.stringify({ app: "freela-tracker", exportedAt: new Date().toISOString(), companies: data.companies, entries: data.entries }, null, 2);
}

export function parseBackup(json: string): { companies: Company[]; entries: Entry[] } {
  return backupSchema.parse(JSON.parse(json));
}
