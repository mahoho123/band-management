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
const datePickerSource = readFileSync(
  resolve(projectRoot, "client/src/components/DatePicker.tsx"),
  "utf8",
);
const timeSelectorSource = readFileSync(
  resolve(projectRoot, "client/src/components/TimeSelector.tsx"),
  "utf8",
);
const documentSource = readFileSync(
  resolve(projectRoot, "client/index.html"),
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

  it("uses a fluid page shell and prevents page-level horizontal overflow", () => {
    expect(homeSource).toContain(
      'className="responsive-page-shell responsive-surface"',
    );
    expect(globalStyles).toContain("html,\nbody,\n#root");
    expect(globalStyles).toContain("overflow-x: hidden");
    expect(globalStyles).toContain(".responsive-page-shell");
    expect(globalStyles).toContain("min-height: 100dvh");
    expect(globalStyles).toContain(".nav-tab");
    expect(globalStyles).toContain("flex: 1 1 calc(50% - 0.25rem)");
  });

  it("uses dynamic viewport sizing for the equipment iframe", () => {
    expect(equipmentViewSource).toContain('className="equipment-iframe');
    expect(globalStyles).toContain(".equipment-iframe");
    expect(globalStyles).toContain("height: clamp(31.25rem, calc(100dvh - 13rem), 56.25rem)");
  });

  it("clamps DatePicker portals to the available browser width and height", () => {
    expect(datePickerSource).toContain("calc(100vw - 16px)");
    expect(datePickerSource).toContain("maxHeight: 'min(80dvh, 32rem)'");
    expect(datePickerSource).toContain("availableWidth");
  });

  it("stacks TimeSelector rows on narrow browsers and keeps the summary wrap-safe", () => {
    expect(timeSelectorSource).toContain(
      'className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0"',
    );
    expect(timeSelectorSource).toContain("min-w-0 break-words");
  });

  it("allows browser zoom and uses safe-area-aware viewport metadata", () => {
    expect(documentSource).toContain(
      'content="width=device-width, initial-scale=1.0, viewport-fit=cover"',
    );
    expect(documentSource).not.toContain("maximum-scale=1");
  });
});
