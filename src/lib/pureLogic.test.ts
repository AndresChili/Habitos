import { describe, it, expect } from "vitest";
import { isDateInBreak, isPausedOn, isCurrentlyPaused, isNewPr, estimateOneRm, type PrHistoryEntry } from "./pureLogic";

describe("isDateInBreak", () => {
  it("detecta una fecha dentro de un rango cerrado", () => {
    const breaks = [{ fromDate: "2026-01-10", toDate: "2026-01-20" }];
    expect(isDateInBreak(breaks, "2026-01-15")).toBe(true);
    expect(isDateInBreak(breaks, "2026-01-10")).toBe(true);
    expect(isDateInBreak(breaks, "2026-01-20")).toBe(true);
    expect(isDateInBreak(breaks, "2026-01-21")).toBe(false);
    expect(isDateInBreak(breaks, "2026-01-09")).toBe(false);
  });

  it("una pausa abierta (toDate null) cubre cualquier fecha posterior al inicio", () => {
    const breaks = [{ fromDate: "2026-01-10", toDate: null }];
    expect(isDateInBreak(breaks, "2027-06-01")).toBe(true);
    expect(isDateInBreak(breaks, "2026-01-09")).toBe(false);
  });

  it("sin pausas, ninguna fecha está cubierta", () => {
    expect(isDateInBreak([], "2026-01-15")).toBe(false);
  });
});

describe("isPausedOn / isCurrentlyPaused", () => {
  const pauses = [
    { id: "1", habitId: "h1", userId: "u1", fromDate: "2026-01-01", toDate: "2026-01-05" },
    { id: "2", habitId: "h1", userId: "u1", fromDate: "2026-02-01", toDate: null },
  ] as Parameters<typeof isPausedOn>[0];

  it("detecta días dentro de un periodo ya cerrado", () => {
    expect(isPausedOn(pauses, "2026-01-03")).toBe(true);
    expect(isPausedOn(pauses, "2026-01-10")).toBe(false);
  });

  it("detecta el periodo abierto más reciente", () => {
    expect(isPausedOn(pauses, "2026-03-01")).toBe(true);
  });

  it("isCurrentlyPaused solo es true si hay una pausa sin toDate", () => {
    expect(isCurrentlyPaused(pauses)).toBe(true);
    expect(isCurrentlyPaused([pauses[0]])).toBe(false);
    expect(isCurrentlyPaused([])).toBe(false);
  });
});

describe("isNewPr", () => {
  it("la primera serie de un ejercicio siempre es PR", () => {
    expect(isNewPr("NORMAL", 60, 8, [])).toBe(true);
  });

  it("un calentamiento nunca es PR, aunque supere el histórico", () => {
    const history: PrHistoryEntry[] = [{ weightKg: 60, reps: 8 }];
    expect(isNewPr("WARMUP", 100, 1, history)).toBe(false);
  });

  it("más peso que el máximo histórico es PR", () => {
    const history: PrHistoryEntry[] = [{ weightKg: 60, reps: 8 }];
    expect(isNewPr("NORMAL", 62.5, 1, history)).toBe(true);
  });

  it("menos peso que el máximo histórico nunca es PR, por muchas reps que haga", () => {
    const history: PrHistoryEntry[] = [{ weightKg: 60, reps: 8 }];
    expect(isNewPr("NORMAL", 50, 20, history)).toBe(false);
  });

  it("igualar el peso máximo con más reps que esa vez es PR", () => {
    const history: PrHistoryEntry[] = [
      { weightKg: 60, reps: 8 },
      { weightKg: 40, reps: 15 },
    ];
    expect(isNewPr("NORMAL", 60, 9, history)).toBe(true);
    expect(isNewPr("NORMAL", 60, 8, history)).toBe(false);
  });
});

describe("estimateOneRm", () => {
  it("aplica la fórmula de Epley", () => {
    expect(estimateOneRm(100, 1)).toBeCloseTo(100 * (1 + 1 / 30), 5);
    expect(estimateOneRm(100, 10)).toBeCloseTo(133.33, 1);
  });

  it("no estima por encima de 15 repeticiones (la fórmula deja de ser fiable)", () => {
    expect(estimateOneRm(50, 16)).toBeNull();
    expect(estimateOneRm(50, 15)).not.toBeNull();
  });
});
