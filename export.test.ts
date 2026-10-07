import { describe, it, expect } from "vitest";
import { daysToParam, entriesOfMonth, filterByDays, parseDaysParam, uniqueDays } from "./export";
import type { Entry } from "./types";

const e = (id: string, data: string): Entry => ({ id, data, empresa: "c1", alimentacao: 0, uber: 0 });
const entries = [e("1", "2026-08-05"), e("2", "2026-08-01"), e("3", "2026-07-30"), e("4", "2026-08-05")];

describe("export", () => {
  it("entriesOfMonth filtra o mês e ordena", () => {
    expect(entriesOfMonth(entries, "2026-08").map((x) => x.id)).toEqual(["2", "1", "4"]);
  });
  it("uniqueDays remove repetidos", () => {
    expect(uniqueDays(entriesOfMonth(entries, "2026-08"))).toEqual(["2026-08-01", "2026-08-05"]);
  });
  it("filterByDays mantém só os dias escolhidos", () => {
    expect(filterByDays(entries, ["2026-08-05"]).map((x) => x.id)).toEqual(["1", "4"]);
    expect(filterByDays(entries, null)).toHaveLength(4);
    expect(filterByDays(entries, [])).toHaveLength(0);
  });
  it("param de dias vai e volta", () => {
    expect(parseDaysParam(daysToParam(["2026-08-01", "2026-08-05"]))).toEqual(["2026-08-01", "2026-08-05"]);
    expect(parseDaysParam(null)).toBeNull();
    expect(parseDaysParam("lixo")).toBeNull();
  });
});
