import { describe, expect, it } from "vitest";
import { hashPassword, isHashedPassword, verifyPassword } from "./_core/passwords";

describe("password hashing", () => {
  it("creates salted hashes that verify without exposing the original value", () => {
    const password = "safe-password-123";
    const first = hashPassword(password);
    const second = hashPassword(password);

    expect(first).not.toBe(password);
    expect(first).not.toBe(second);
    expect(isHashedPassword(first)).toBe(true);
    expect(verifyPassword(password, first)).toBe(true);
    expect(verifyPassword("wrong-password", first)).toBe(false);
  });

  it("accepts legacy plaintext values for one-time migration compatibility", () => {
    expect(isHashedPassword("legacy-value")).toBe(false);
    expect(verifyPassword("legacy-value", "legacy-value")).toBe(true);
    expect(verifyPassword("other-value", "legacy-value")).toBe(false);
  });

  it("rejects malformed hash payloads safely", () => {
    expect(verifyPassword("password", "scrypt$missing$invalid")).toBe(false);
  });
});
