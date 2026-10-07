import { describe, it, expect } from "vitest";
import { entriesToCSV } from "./csv";
import { parseBackup, serializeBackup } from "./backup";
import { DEFAULT_COMPANIES } from "./types";

const getCompany = () => DEFAULT_COMPANIES[0];

describe("entriesToCSV", () => {
  it("cabeçalho e linha", () => {
    const csv = entriesToCSV(
      [{ id: "1", data: "2026-08-01", empresa: "c1", entrada: "08:00", saida: "22:00", alimentacao: 5, uber: 10, obs: 'ok "x"' }],
      getCompany,
    );
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Data,Empresa,Entrada,Saída,H.Extra,Base,Extra R$,Alim.Extra,Transporte,Total,Obs");
    expect(lines[1]).toBe('2026-08-01,"Empresa 1",08:00,22:00,2.0,550.00,91.66,5.00,10.00,641.66,"ok ""x"""');
  });
});

describe("backup", () => {
  it("round-trip", () => {
    const json = serializeBackup({ companies: DEFAULT_COMPANIES, entries: [] });
    expect(parseBackup(json)).toEqual({ companies: DEFAULT_COMPANIES, entries: [] });
  });
  it("rejeita inválido", () => expect(() => parseBackup('{"companies":[{"nome":1}]}')).toThrow());
});
