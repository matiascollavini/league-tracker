import { describe, expect, it } from "vitest";
import { pageItems } from "./pagination";

describe("pageItems", () => {
  it("muestra todas las páginas si entran sin cortes", () => {
    expect(pageItems(1, 1)).toEqual([1]);
    expect(pageItems(3, 8 - 1)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("arranca con la primera, la ventana y la última", () => {
    expect(pageItems(1, 10)).toEqual([1, 2, 3, 4, 5, null, 10]);
  });

  it("centra la ventana en la página actual", () => {
    expect(pageItems(5, 10)).toEqual([1, null, 4, 5, 6, null, 10]);
  });

  it("cierra con la última cuando estás al final", () => {
    expect(pageItems(10, 10)).toEqual([1, null, 6, 7, 8, 9, 10]);
  });

  it("no repite la primera ni la última", () => {
    expect(pageItems(2, 20)).toEqual([1, 2, 3, 4, 5, null, 20]);
    expect(pageItems(19, 20)).toEqual([1, null, 16, 17, 18, 19, 20]);
  });

  it("nunca se va de rango", () => {
    for (const current of [1, 2, 3, 8, 15, 20]) {
      const items = pageItems(current, 20).filter(
        (item): item is number => item !== null,
      );
      expect(items[0]).toBe(1);
      expect(items.at(-1)).toBe(20);
      expect(items.every((item) => item >= 1 && item <= 20)).toBe(true);
      expect(items).toContain(current);
    }
  });
});
