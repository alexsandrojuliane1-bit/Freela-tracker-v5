import { describe, it, expect, beforeEach } from "vitest";
import { useStore, migrateLegacy, STORAGE_KEY } from "./store";
import { DEFAULT_COMPANIES } from "./types";

beforeEach(() => {
  localStorage.clear();
  useStore.setState({ companies: DEFAULT_COMPANIES, entries: [] });
});

describe("companies", () => {
  it("addCompany gera id e cor", () => {
    const c = useStore.getState().addCompany({ nome: "Nova", diaria: 600, extra: 50, horas: 12, almoco: 0, janta: 0 });
    expect(c.id).toMatch(/^c/);
    expect(c.cor).toBe("#34d399");
    expect(useStore.getState().companies).toHaveLength(3);
  });
  it("updateCompany", () => {
    useStore.getState().updateCompany("c1", { nome: "X", diaria: 1 });
    expect(useStore.getState().getCompany("c1")).toMatchObject({ nome: "X", diaria: 1 });
  });
  it("removeCompany mantém registros e não remove a última", () => {
    useStore.getState().addEntry({ data: "2026-08-01", empresa: "c2", alimentacao: 0, uber: 0 });
    useStore.getState().removeCompany("c2");
    expect(useStore.getState().companies.map((c) => c.id)).toEqual(["c1"]);
    expect(useStore.getState().entries).toHaveLength(1);
    useStore.getState().removeCompany("c1");
    expect(useStore.getState().companies).toHaveLength(1);
  });
  it("getCompany cai para a primeira quando id não existe", () => {
    expect(useStore.getState().getCompany("zzz").id).toBe("c1");
  });
  it("limite de 20", () => {
    for (let i = 0; i < 25; i++) useStore.getState().addCompany({ nome: `E${i}`, diaria: 1, extra: 1, horas: 1, almoco: 0, janta: 0 });
    expect(useStore.getState().companies).toHaveLength(20);
  });
});

describe("entries", () => {
  it("add/update/remove", () => {
    const e = useStore.getState().addEntry({ data: "2026-08-01", empresa: "c1", alimentacao: 0, uber: 0 });
    expect(typeof e.id).toBe("string");
    useStore.getState().updateEntry(e.id, { uber: 12, obs: "x" });
    expect(useStore.getState().entries[0]).toMatchObject({ uber: 12, obs: "x" });
    useStore.getState().removeEntry(e.id);
    expect(useStore.getState().entries).toHaveLength(0);
  });
  it("clearEntries", () => {
    useStore.getState().addEntry({ data: "2026-08-01", empresa: "c1", alimentacao: 0, uber: 0 });
    useStore.getState().clearEntries();
    expect(useStore.getState().entries).toHaveLength(0);
  });
  it("importData substitui tudo", () => {
    useStore.getState().importData({ companies: [DEFAULT_COMPANIES[1]], entries: [{ id: "9", data: "2026-01-01", empresa: "c2", alimentacao: 0, uber: 0 }] });
    expect(useStore.getState().companies).toHaveLength(1);
    expect(useStore.getState().entries[0].id).toBe("9");
  });
});

describe("persist + legado", () => {
  it("persiste em localStorage", () => {
    useStore.getState().addEntry({ data: "2026-08-01", empresa: "c1", alimentacao: 0, uber: 0 });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).state.entries).toHaveLength(1);
  });
  it("migrateLegacy converte ids numéricos e strings", () => {
    const r = migrateLegacy(
      JSON.stringify([{ id: "c1", nome: "A", diaria: "550", extra: 45.83, horas: 12, almoco: 0, janta: 0, cor: "#000" }]),
      JSON.stringify([{ id: 1723000000000, data: "2026-08-01", empresa: "c1", entrada: "08:00", saida: "20:00", alimentacao: "10", uber: "", obs: "" }]),
    );
    expect(r!.companies[0].diaria).toBe(550);
    expect(r!.entries[0]).toEqual({ id: "1723000000000", data: "2026-08-01", empresa: "c1", entrada: "08:00", saida: "20:00", alimentacao: 10, uber: 0, obs: "" });
  });
  it("migrateLegacy retorna null sem dados", () => expect(migrateLegacy(null, null)).toBeNull());
  it("migrateLegacy usa empresas padrão se só houver registros", () => {
    const r = migrateLegacy(null, JSON.stringify([{ id: 1, data: "2026-08-01", empresa: "c1" }]));
    expect(r!.companies).toEqual(DEFAULT_COMPANIES);
  });
  it("hidrata a partir das chaves legadas quando a nova não existe", async () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem("freela_entries", JSON.stringify([{ id: 5, data: "2026-08-02", empresa: "c2" }]));
    await useStore.persist.rehydrate();
    expect(useStore.getState().entries).toEqual([{ id: "5", data: "2026-08-02", empresa: "c2", entrada: undefined, saida: undefined, alimentacao: 0, uber: 0, obs: "" }]);
  });
});
