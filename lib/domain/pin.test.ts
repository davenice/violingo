import { describe, expect, it } from "vitest";
import { hashPin, verifyPin } from "./pin";

describe("pin hashing", () => {
  it("verifies a correct PIN against its hash", async () => {
    const hash = await hashPin("4821", "child-1");
    expect(await verifyPin("4821", "child-1", hash)).toBe(true);
  });

  it("rejects an incorrect PIN", async () => {
    const hash = await hashPin("4821", "child-1");
    expect(await verifyPin("0000", "child-1", hash)).toBe(false);
  });

  it("produces different hashes for the same PIN under different salts", async () => {
    const hashA = await hashPin("4821", "child-1");
    const hashB = await hashPin("4821", "child-2");
    expect(hashA).not.toBe(hashB);
  });

  it("rejects a correct PIN verified against the wrong salt", async () => {
    const hash = await hashPin("4821", "child-1");
    expect(await verifyPin("4821", "child-2", hash)).toBe(false);
  });
});
