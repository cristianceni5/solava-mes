export async function operatorPinHash(matricola: string, pin: string) {
  const value = `${matricola.trim()}:${pin.trim()}`;
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  return `\\x${hex}`;
}
