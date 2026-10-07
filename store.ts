import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { DEFAULT_COMPANIES, MAX_COMPANIES, PALETTE, type Company, type Entry } from "./types";

export const STORAGE_KEY = "freela-tracker";

export type Data = { companies: Company[]; entries: Entry[] };

type State = Data & {
  addCompany(input: Omit<Company, "id" | "cor">): Company;
  updateCompany(id: string, patch: Partial<Omit<Company, "id">>): void;
  removeCompany(id: string): void;
  addEntry(input: Omit<Entry, "id">): Entry;
  updateEntry(id: string, patch: Partial<Omit<Entry, "id">>): void;
  removeEntry(id: string): void;
  clearEntries(): void;
  importData(data: Data): void;
  getCompany(id: string): Company;
};

const num = (v: unknown, fallback = 0) => {
  if (v === "" || v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export function migrateLegacy(companiesRaw: string | null, entriesRaw: string | null): Data | null {
  if (!companiesRaw && !entriesRaw) return null;
  let companies: Company[] = DEFAULT_COMPANIES;
  let entries: Entry[] = [];
  try {
    if (companiesRaw) {
      const arr = JSON.parse(companiesRaw);
      if (Array.isArray(arr) && arr.length) {
        companies = arr.map((c, i) => ({
          id: String(c.id),
          nome: String(c.nome ?? `Empresa ${i + 1}`),
          diaria: num(c.diaria, 550),
          extra: num(c.extra, 45.83),
          horas: num(c.horas, 12),
          almoco: num(c.almoco),
          janta: num(c.janta),
          cor: String(c.cor ?? PALETTE[i % PALETTE.length]),
        }));
      }
    }
    if (entriesRaw) {
      const arr = JSON.parse(entriesRaw);
      if (Array.isArray(arr)) {
        entries = arr
          .filter((e) => e && e.data)
          .map((e) => ({
            id: String(e.id),
            data: String(e.data),
            empresa: String(e.empresa ?? companies[0].id),
            entrada: e.entrada || undefined,
            saida: e.saida || undefined,
            alimentacao: num(e.alimentacao),
            uber: num(e.uber),
            obs: e.obs ?? "",
          }));
      }
    }
  } catch {
    return null;
  }
  return { companies, entries };
}

const legacyAwareStorage: StateStorage = {
  getItem: (name) => {
    const v = localStorage.getItem(name);
    if (v) return v;
    const migrated = migrateLegacy(localStorage.getItem("freela_companies"), localStorage.getItem("freela_entries"));
    return migrated ? JSON.stringify({ state: migrated, version: 1 }) : null;
  },
  setItem: (name, value) => localStorage.setItem(name, value),
  removeItem: (name) => localStorage.removeItem(name),
};

const newId = (prefix = "") => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      companies: DEFAULT_COMPANIES,
      entries: [],
      addCompany: (input) => {
        const { companies } = get();
        const c: Company = { ...input, id: newId("c"), cor: PALETTE[companies.length % PALETTE.length] };
        if (companies.length >= MAX_COMPANIES) return c;
        set({ companies: [...companies, c] });
        return c;
      },
      updateCompany: (id, patch) => set((s) => ({ companies: s.companies.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeCompany: (id) => set((s) => (s.companies.length <= 1 ? s : { companies: s.companies.filter((c) => c.id !== id) })),
      addEntry: (input) => {
        const e: Entry = { ...input, id: newId() };
        set((s) => ({ entries: [...s.entries, e] }));
        return e;
      },
      updateEntry: (id, patch) => set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      removeEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      clearEntries: () => set({ entries: [] }),
      importData: (data) => set({ companies: data.companies, entries: data.entries }),
      getCompany: (id) => {
        const { companies } = get();
        return companies.find((c) => c.id === id) ?? companies[0];
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => legacyAwareStorage),
      partialize: (s) => ({ companies: s.companies, entries: s.entries }),
    },
  ),
);
