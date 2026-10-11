import { describe, it, expect } from "vitest";
import { isUUID, generateUUID, ensureUUID } from "@/lib/utils/uuid";

describe("UUID Utility Tests", () => {
  it("validates standard UUIDs correctly", () => {
    expect(isUUID("c9bf9e57-1685-4c89-bafb-ff5af830be8a")).toBe(true);
    expect(isUUID("00000000-0000-4000-8000-000000000000")).toBe(true);
    expect(isUUID("inv_o5ulx24d")).toBe(false);
    expect(isUUID("")).toBe(false);
    expect(isUUID(null)).toBe(false);
    expect(isUUID(undefined)).toBe(false);
  });

  it("generates valid RFC 4122 v4 UUIDs", () => {
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();

    expect(isUUID(uuid1)).toBe(true);
    expect(isUUID(uuid2)).toBe(true);
    expect(uuid1).not.toBe(uuid2);
  });

  it("deterministically transforms arbitrary strings to valid UUIDs", () => {
    const legacyId = "inv_o5ulx24d";
    const mapped1 = ensureUUID(legacyId);
    const mapped2 = ensureUUID(legacyId);

    expect(isUUID(mapped1)).toBe(true);
    expect(mapped1).toBe(mapped2); // Deterministic!

    // If already a UUID, returns it unchanged
    const validUuid = "c9bf9e57-1685-4c89-bafb-ff5af830be8a";
    expect(ensureUUID(validUuid)).toBe(validUuid);
  });

  it("handles null or undefined by generating a fresh UUID", () => {
    const gen = ensureUUID(null);
    expect(isUUID(gen)).toBe(true);
  });
});
