import { describe, it, expect } from "vitest";
import { arrayMove } from "./reorder";

describe("arrayMove", () => {
  it("bir öğeyi ileri taşır", () => {
    expect(arrayMove(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
  });

  it("bir öğeyi geri taşır", () => {
    expect(arrayMove(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("komşu takas (yukarı/aşağı buton)", () => {
    expect(arrayMove(["a", "b", "c"], 1, 0)).toEqual(["b", "a", "c"]);
    expect(arrayMove(["a", "b", "c"], 1, 2)).toEqual(["a", "c", "b"]);
  });

  it("aynı indeks veya sınır dışı → değişmeden kopya döner", () => {
    expect(arrayMove(["a", "b"], 1, 1)).toEqual(["a", "b"]);
    expect(arrayMove(["a", "b"], 5, 0)).toEqual(["a", "b"]);
    expect(arrayMove(["a", "b"], 0, -1)).toEqual(["a", "b"]);
  });

  it("orijinal diziyi mutasyona uğratmaz", () => {
    const src = ["a", "b", "c"];
    arrayMove(src, 0, 2);
    expect(src).toEqual(["a", "b", "c"]);
  });
});
