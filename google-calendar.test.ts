import { describe, it, expect } from "vitest";
import { fromApi, toApi, type EventInput } from "./google-calendar";

const base: EventInput = { title: " Reunião ", allDay: false, date: "2026-08-10", endDate: "2026-08-10", startTime: "09:00", endTime: "10:30", description: "", location: "" };

describe("google-calendar mapping", () => {
  it("toApi com horário", () => {
    const r = toApi(base);
    expect(r.summary).toBe("Reunião");
    expect(r.start.dateTime).toBe("2026-08-10T09:00:00");
    expect(r.end.dateTime).toBe("2026-08-10T10:30:00");
  });
  it("toApi dia inteiro soma 1 dia no fim (exclusivo)", () => {
    const r = toApi({ ...base, allDay: true, endDate: "2026-08-12" });
    expect(r.start).toEqual({ date: "2026-08-10" });
    expect(r.end).toEqual({ date: "2026-08-13" });
  });
  it("fromApi reconhece dia inteiro e título vazio", () => {
    const e = fromApi({ id: "1", start: { date: "2026-08-10" }, end: { date: "2026-08-11" } });
    expect(e.allDay).toBe(true);
    expect(e.title).toBe("(sem título)");
  });
});
