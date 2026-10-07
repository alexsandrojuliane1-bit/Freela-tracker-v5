import { describe, it, expect } from "vitest";
import { addDays, eventDays, groupEventsByDay, monthGrid, shiftMonth, type CalEvent } from "./calendar-grid";

const ev = (p: Partial<CalEvent>): CalEvent => ({ id: "x", title: "t", start: "2026-08-10", end: "2026-08-11", allDay: true, ...p });

describe("calendar-grid", () => {
  it("addDays atravessa mês", () => expect(addDays("2026-08-31", 1)).toBe("2026-09-01"));
  it("shiftMonth atravessa ano", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
  it("monthGrid começa no dia da semana certo e é múltiplo de 7", () => {
    const g = monthGrid("2026-08"); // 1/ago/2026 é sábado
    expect(g.length % 7).toBe(0);
    expect(g.indexOf("2026-08-01")).toBe(6);
    expect(g.filter(Boolean)).toHaveLength(31);
  });
  it("evento de dia inteiro usa fim exclusivo", () => {
    expect(eventDays(ev({}))).toEqual(["2026-08-10"]);
    expect(eventDays(ev({ end: "2026-08-13" }))).toEqual(["2026-08-10", "2026-08-11", "2026-08-12"]);
  });
  it("evento com horário num só dia", () => {
    expect(eventDays(ev({ allDay: false, start: "2026-08-10T09:00:00", end: "2026-08-10T18:00:00" }))).toEqual(["2026-08-10"]);
  });
  it("evento que termina à meia-noite não invade o dia seguinte", () => {
    expect(eventDays(ev({ allDay: false, start: "2026-08-10T20:00:00", end: "2026-08-11T00:00:00" }))).toEqual(["2026-08-10"]);
  });
  it("groupEventsByDay agrupa e põe dia inteiro primeiro", () => {
    const a = ev({ id: "a", allDay: false, start: "2026-08-10T09:00:00", end: "2026-08-10T10:00:00" });
    const b = ev({ id: "b" });
    expect(groupEventsByDay([a, b])["2026-08-10"].map((x) => x.id)).toEqual(["b", "a"]);
  });
});
