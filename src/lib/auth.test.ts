import { describe, it, expect } from "vitest";
import { normalizeEmail, isValidEmail, isValidPassword, hashPassword, verifyPassword, verifyPasswordOrDummy } from "./auth";

describe("normalizeEmail", () => {
  it("recorta espacios y pasa a minúsculas", () => {
    expect(normalizeEmail("  Usuario@Ejemplo.COM  ")).toBe("usuario@ejemplo.com");
  });
});

describe("isValidEmail", () => {
  it("acepta direcciones con formato razonable", () => {
    expect(isValidEmail("a@b.com")).toBe(true);
  });

  it("rechaza direcciones sin @ o sin dominio", () => {
    expect(isValidEmail("sin-arroba.com")).toBe(false);
    expect(isValidEmail("usuario@sindominio")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("isValidPassword", () => {
  it("exige al menos 8 caracteres", () => {
    expect(isValidPassword("1234567")).toBe(false);
    expect(isValidPassword("12345678")).toBe(true);
  });
});

describe("hashPassword / verifyPassword", () => {
  it("un hash verifica contra su propia contraseña y rechaza cualquier otra", async () => {
    const hash = await hashPassword("contraseña-correcta");
    expect(await verifyPassword("contraseña-correcta", hash)).toBe(true);
    expect(await verifyPassword("otra-contraseña", hash)).toBe(false);
  });
});

describe("verifyPasswordOrDummy", () => {
  it("se comporta igual que verifyPassword cuando el hash existe", async () => {
    const hash = await hashPassword("contraseña-correcta");
    expect(await verifyPasswordOrDummy("contraseña-correcta", hash)).toBe(true);
    expect(await verifyPasswordOrDummy("otra-contraseña", hash)).toBe(false);
  });

  it("sin hash (usuario no encontrado) siempre compara contra el hash dummy y falla", async () => {
    expect(await verifyPasswordOrDummy("cualquier-cosa", undefined)).toBe(false);
  });
});
