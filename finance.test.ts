import { it, expect } from "vitest";
import { annualSeries } from "./finance";
import { DEFAULT_COMPANIES } from "./types";

it("annualSeries soma por mês", () => {
  const now = new Date(2026, 7, 20);
  const s = annualSeries(
    [
      { id: "1", data: "2026-08-01", empresa: "c2", alimentacao: 10, uber: 5 },
      { id: "2", data: "2025-09-10", empresa: "c1", alimentacao: 0, uber: 0 },
    ],
    () => DEFAULT_COMPANIES[1],
    now,
  );
  expect(s).toHaveLength(12);
  expect(s[11]).toEqual({ label: "Ago 2026", dias: 1, ganhos: 500, alim: 110, transporte: 5, liquido: 385 });
  expect(s[0].dias).toBe(1);
});
