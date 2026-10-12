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
const logoPath = resolve(root, "client/public/logo.png");

describe("brand logo assets", () => {
  it("uses local logo assets in the app and metadata", () => {
    expect(homeSource).toContain('src="/logo.png"');
    expect(homeSource).toContain('alt="慢半拍 Logo"');
    expect(homeSource).not.toContain("manus-storage/band-management-logo");
    expect(indexSource).toContain('href="/logo.png"');
  });

  it("keeps a valid local logo for notifications and service worker fallbacks", () => {
    expect(existsSync(logoPath)).toBe(true);
    expect(statSync(logoPath).size).toBeGreaterThan(50_000);
    expect(serviceWorkerSource).toContain("/logo.png");
    const logoBytes = readFileSync(logoPath);
    expect(logoBytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(logoBytes.readUInt32BE(16)).toBe(512);
    expect(logoBytes.readUInt32BE(20)).toBe(512);
  });
});
