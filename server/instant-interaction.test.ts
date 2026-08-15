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

describe("instant interaction contract", () => {
  it("does not wait before refreshing data after password changes", () => {
    expect(homeSource).not.toContain("setTimeout(resolve => setTimeout(resolve, 500)");
    expect(homeSource).not.toContain("setTimeout(resolve => setTimeout(resolve, 500));");
  });

  it("uses direct WhatsApp Web navigation on desktop", () => {
    expect(homeSource).toContain('window.open(webUrl, "_blank", "noopener,noreferrer")');
    expect(homeSource).not.toContain("const timeout = setTimeout(()");
  });

  it("makes interactive transitions and state entrance animations immediate", () => {
    expect(globalStyles).toContain("transition-duration: 0.001s !important");
    expect(homeSource).toContain(".modal-enter {\n          animation: none;");
    expect(homeSource).toContain("animation: none;\n        }\n      `}</style>");
  });
});
