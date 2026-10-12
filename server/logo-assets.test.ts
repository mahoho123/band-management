import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const homeSource = readFileSync(resolve(root, "client/src/pages/Home.tsx"), "utf8");
const indexSource = readFileSync(resolve(root, "client/index.html"), "utf8");
const serviceWorkerSource = readFileSync(
  resolve(root, "client/public/service-worker.js"),
  "utf8",
);
const logoSvg = readFileSync(resolve(root, "client/public/band-logo.svg"), "utf8");

 describe("brand logo assets", () => {
  it("uses local logo assets in the app and metadata", () => {
    expect(homeSource).toContain('src="/band-logo.svg"');
    expect(homeSource).not.toContain("manus-storage/band-management-logo");
    expect(indexSource).toContain('href="/band-logo.svg"');
    expect(indexSource).toContain('href="/logo.png"');
  });

  it("keeps a valid local logo for notifications and service worker fallbacks", () => {
    const pngPath = resolve(root, "client/public/logo.png");
    expect(existsSync(pngPath)).toBe(true);
    expect(statSync(pngPath).size).toBeGreaterThan(2_000);
    expect(serviceWorkerSource).toContain("/logo.png");
    expect(logoSvg).toContain("<svg");
    expect(logoSvg).toContain("Band 隊管理系統三角形 Logo");
    expect(logoSvg).toContain("F4D03F");
  });
});
