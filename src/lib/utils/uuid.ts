// RFC 4122 compliant UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUUID(str?: string | null): boolean {
  if (!str) return false;
  return UUID_REGEX.test(str);
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Deterministically converts any arbitrary string into a valid UUID v4 format.
 * This guarantees that legacy IDs (like "inv_o5ulx24d" or "test_inv_001")
 * consistently map to the exact same valid UUID every single time.
 */
export function ensureUUID(str?: string | null): string {
  if (!str) return generateUUID();
  if (isUUID(str)) return str;

  // Deterministic 32-bit integer hashing (Murmur/DJB2-like)
  let h1 = 0xdeadbeef;
  let h2 = 0x41c64e6d;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hexPart1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const hexPart2 = (h2 >>> 0).toString(16).padStart(8, "0");
  const hexPart3 = ((h1 ^ h2) >>> 0).toString(16).padStart(8, "0");
  const hexPart4 = ((h1 + h2) >>> 0).toString(16).padStart(8, "0");
  const rawHex = (hexPart1 + hexPart2 + hexPart3 + hexPart4).slice(0, 32);

  // Format as RFC 4122 v4 UUID: 8-4-4-4-12
  const p1 = rawHex.slice(0, 8);
  const p2 = rawHex.slice(8, 12);
  const p3 = "4" + rawHex.slice(13, 16);
  const p4 = ((parseInt(rawHex[16], 16) & 0x3) | 0x8).toString(16) + rawHex.slice(17, 20);
  const p5 = rawHex.slice(20, 32);

  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}
