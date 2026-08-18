import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const HASH_PREFIX = "scrypt$";
const KEY_LENGTH = 64;

export function isHashedPassword(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(HASH_PREFIX);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${HASH_PREFIX}${salt}$${derivedKey}`;
}

export function verifyPassword(password: string, storedValue: string | null | undefined): boolean {
  if (!storedValue) return false;
  if (!isHashedPassword(storedValue)) return password === storedValue;

  const [, salt, storedHash] = storedValue.split("$");
  if (!salt || !storedHash || storedHash.length !== KEY_LENGTH * 2) return false;

  const derivedKey = scryptSync(password, salt, KEY_LENGTH);
  const expectedKey = Buffer.from(storedHash, "hex");
  return expectedKey.length === derivedKey.length && timingSafeEqual(expectedKey, derivedKey);
}
