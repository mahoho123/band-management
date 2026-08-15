import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");

const homeSource = readFileSync(
  resolve(projectRoot, "client/src/pages/Home.tsx"),
  "utf8",
);
const globalStyles = readFileSync(
  resolve(projectRoot, "client/src/index.css"),
  "utf8",
);
const equipmentViewSource = readFileSync(
  resolve(projectRoot, "client/src/pages/EquipmentLoanView.tsx"),
  "utf8",
);

describe("responsive layout contract", () => {
  it("keeps the main event form single-column on phones", () => {
    expect(homeSource).toContain(
      'className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"',
    );
    expect(homeSource).toContain(
      'className="flex flex-col sm:flex-row gap-3 pt-2"',
    );
  });

  it("prevents page-level horizontal overflow and wraps mobile navigation", () => {
    expect(globalStyles).toContain("html,\nbody,\n#root");
    expect(globalStyles).toContain("overflow-x: hidden");
    expect(globalStyles).toContain(".nav-tab");
    expect(globalStyles).toContain("flex: 1 1 calc(50% - 0.25rem)");
  });

  it("uses a viewport-relative iframe height on phones", () => {
    expect(equipmentViewSource).toContain("h-[calc(100dvh-13rem)]");
    expect(equipmentViewSource).toContain("sm:h-[min(900px,calc(100vh-180px))]");
  });
});
