import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { EQUIPMENT_LOAN_EMBED_URL } from "@shared/equipmentLoan";

const homeSource = readFileSync(
  resolve(import.meta.dirname, "../client/src/pages/Home.tsx"),
  "utf8",
);

describe("equipment-loan navigation", () => {
  it("uses the supplied official equipment platform URL", () => {
    expect(EQUIPMENT_LOAN_EMBED_URL).toBe(
      "https://slowbeat-ren-bspj3tdd.manus.space/",
    );
    expect(new URL(EQUIPMENT_LOAN_EMBED_URL).pathname).toBe("/");
  });

  it("opens the platform directly in a new tab instead of an internal view", () => {
    expect(homeSource).toContain("href={EQUIPMENT_LOAN_EMBED_URL}");
    expect(homeSource).toContain('target="_blank"');
    expect(homeSource).toContain('rel="noopener noreferrer"');
    expect(homeSource).not.toContain('setCurrentView("equipment")');
    expect(homeSource).not.toContain("<EquipmentLoanView");
  });
});
