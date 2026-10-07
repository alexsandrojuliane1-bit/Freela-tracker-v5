import { describe, it, expect } from "vitest";
import { monthKey, monthOptions, last12Months, todayISO, monthLabel } from "./dates";

describe("dates", () => {
  const now = new Date(2026, 7, 20);
  it("monthKey", () => expect(monthKey(now)).toBe("2026-08"));
  it("todayISO usa data local", () => expect(todayISO(now)).toBe("2026-08-20"));
  it("monthLabel", () => expect(monthLabel("2026-08")).toBe("Agosto 2026"));
  it("monthOptions começa no mês atual e termina em jan/2024", () => {
    const o = monthOptions(now);
    expect(o[0]).toEqual({ value: "2026-08", label: "Agosto 2026" });
    expect(o.at(-1)).toEqual({ value: "2024-01", label: "Janeiro 2024" });
  });
  it("last12Months termina no mês atual", () => {
    const m = last12Months(now);
    expect(m).toHaveLength(12);
    expect(m[0]).toEqual({ key: "2025-09", label: "Set 2025" });
    expect(m[11]).toEqual({ key: "2026-08", label: "Ago 2026" });
  });
});
