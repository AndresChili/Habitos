import { describe, it, expect } from "vitest";
import { dayKey, parseDayKey, isoWeekday, monthKey, isoWeekKey, weekRange, monthRange, daysBetweenInclusive } from "./dates";

describe("dayKey / parseDayKey", () => {
  it("son inversas entre sí", () => {
    const key = "2026-03-15";
    expect(dayKey(parseDayKey(key))).toBe(key);
  });
});

describe("isoWeekday", () => {
  it("lunes es 1 y domingo es 7 (ISO)", () => {
    expect(isoWeekday(parseDayKey("2026-03-16"))).toBe(1); // lunes
    expect(isoWeekday(parseDayKey("2026-03-22"))).toBe(7); // domingo
  });
});

describe("monthKey", () => {
  it("formatea como yyyy-MM", () => {
    expect(monthKey(parseDayKey("2026-03-15"))).toBe("2026-03");
  });
});

describe("isoWeekKey", () => {
  it("incluye el año ISO, no el de calendario, en semanas de fin de año", () => {
    // El 30 de diciembre de 2024 cae en la semana ISO 1 de 2025.
    expect(isoWeekKey(parseDayKey("2024-12-30"))).toBe("2025-W01");
  });
});

describe("weekRange", () => {
  it("devuelve lunes a domingo (ISO) para cualquier día de esa semana", () => {
    const { start, end } = weekRange(parseDayKey("2026-03-18"));
    expect(dayKey(start)).toBe("2026-03-16");
    expect(dayKey(end)).toBe("2026-03-22");
  });
});

describe("monthRange", () => {
  it("devuelve el primer y último día del mes", () => {
    const { start, end } = monthRange(parseDayKey("2026-02-10"));
    expect(dayKey(start)).toBe("2026-02-01");
    expect(dayKey(end)).toBe("2026-02-28");
  });
});

describe("daysBetweenInclusive", () => {
  it("incluye ambos extremos del rango", () => {
    const days = daysBetweenInclusive(parseDayKey("2026-01-01"), parseDayKey("2026-01-03"));
    expect(days.map(dayKey)).toEqual(["2026-01-01", "2026-01-02", "2026-01-03"]);
  });

  it("un rango de un solo día devuelve un elemento", () => {
    const days = daysBetweenInclusive(parseDayKey("2026-01-01"), parseDayKey("2026-01-01"));
    expect(days).toHaveLength(1);
  });
});
