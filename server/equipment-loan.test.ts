import { describe, expect, it } from "vitest";
import { EQUIPMENT_LOAN_EMBED_URL } from "@shared/equipmentLoan";

describe("equipment-loan embed", () => {
  it("uses the supplied embed endpoint", () => {
    expect(EQUIPMENT_LOAN_EMBED_URL).toBe(
      "https://slowbeat-ren-bspj3tdd.manus.space/embed",
    );
    expect(EQUIPMENT_LOAN_EMBED_URL.endsWith("/embed")).toBe(true);
  });
});
