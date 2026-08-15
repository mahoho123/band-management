import { describe, expect, it } from "vitest";
import { EQUIPMENT_LOAN_EMBED_URL } from "@shared/equipmentLoan";

describe("equipment-loan embed", () => {
  it("uses the supplied embed endpoint", () => {
    expect(EQUIPMENT_LOAN_EMBED_URL).toBe(
      "https://3000-ibgzp8tw0hj5g5upaaqqf-04f8f53b.sg1.manus.computer/embed",
    );
    expect(EQUIPMENT_LOAN_EMBED_URL.endsWith("/embed")).toBe(true);
  });
});
