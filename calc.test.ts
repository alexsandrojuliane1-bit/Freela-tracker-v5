import { describe, it, expect } from "vitest";
import { calcEntry, summarizeEntries, groupByCompany, fmtBRL, fmtHours } from "./calc";
import type { Company, Entry } from "./types";

const c: Company = { id: "c1", nome: "A", diaria: 550, extra: 45.83, horas: 12, almoco: 20, janta: 30, cor: "#000" };
const getCompany = () => c;
const base: Entry = { id: "1", data: "2026-08-01", empresa: "c1", alimentacao: 0, uber: 0 };

describe("calcEntry", () => {
  it("sem horário → sem extra", () => {
    const r = calcEntry(base, c);
    expect(r.extraHours).toBe(0);
    expect(r.total).toBe(550);
    expect(r.totalGasto).toBe(50);
    expect(r.totalComGastos).toBe(600);
  });
  it("14h trabalhadas → 2h extra", () => {
    const r = calcEntry({ ...base, entrada: "08:00", saida: "22:00" }, c);
    expect(r.extraHours).toBe(2);
    expect(r.extraVal).toBeCloseTo(91.66);
    expect(r.total).toBeCloseTo(641.66);
  });
  it("virada de meia-noite", () => {
    const r = calcEntry({ ...base, entrada: "20:00", saida: "09:00" }, c);
    expect(r.extraHours).toBe(1);
  });
  it("jornada menor que base não dá extra negativo", () => {
    expect(calcEntry({ ...base, entrada: "08:00", saida: "12:00" }, c).extraHours).toBe(0);
  });
  it("gastos particulares não entram no total", () => {
    const r = calcEntry({ ...base, alimentacao: 15, uber: 40 }, c);
    expect(r.total).toBe(550);
    expect(r.totalGasto).toBe(105);
    expect(r.totalAlim).toBe(65);
  });
});

describe("summarizeEntries / groupByCompany", () => {
  const entries: Entry[] = [
    { ...base, id: "1", entrada: "08:00", saida: "22:00", uber: 10 },
    { ...base, id: "2", alimentacao: 5 },
  ];
  it("soma totais", () => {
    const t = summarizeEntries(entries, getCompany);
    expect(t.dias).toBe(2);
    expect(t.base).toBe(1100);
    expect(t.extra).toBeCloseTo(91.66);
    expect(t.extraHours).toBe(2);
    expect(t.total).toBeCloseTo(1191.66);
    expect(t.uber).toBe(10);
    expect(t.alimExtra).toBe(5);
    expect(t.alimConf).toBe(100);
    expect(t.gasto).toBe(115);
    expect(t.liquido).toBeCloseTo(1191.66 - 10 - 5);
  });
  it("agrupa por empresa", () => {
    const g = groupByCompany(entries, getCompany);
    expect(Object.keys(g)).toEqual(["c1"]);
    expect(g.c1.dias).toBe(2);
  });
});

describe("fmt", () => {
  it("fmtBRL", () => expect(fmtBRL(1234.5)).toBe("R$ 1.234,50"));
  it("fmtHours", () => {
    expect(fmtHours(1.5)).toBe("1.5h");
    expect(fmtHours(0)).toBe("0h");
  });
});
