/**
 * Hashing for the parent-mode PIN. This is a UX deterrent to stop a young
 * child from wandering into settings, not a real security boundary — actual
 * access control is Firestore rules keyed on the Firebase Auth uid. A plain
 * salted SHA-256 is proportionate to that threat model.
 */
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  return sha256Hex(`${salt}:${pin}`);
}

export async function verifyPin(pin: string, salt: string, hash: string): Promise<boolean> {
  return (await hashPin(pin, salt)) === hash;
}
