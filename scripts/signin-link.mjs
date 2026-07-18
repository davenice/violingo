// Prints the most recent pending sign-in link(s) from the local Auth emulator.
// The emulator never sends real email; request a link at http://localhost:3000/login,
// then run: node scripts/signin-link.mjs
const PROJECT = "violingo-rules-test";

const res = await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT}/oobCodes`).catch(
  () => null,
);
if (!res?.ok) {
  console.error("Auth emulator not reachable on 127.0.0.1:9099 — is `npm run emulators` running?");
  process.exit(1);
}
const { oobCodes = [] } = await res.json();
const signIns = oobCodes.filter((c) => c.requestType === "EMAIL_SIGNIN");
if (signIns.length === 0) {
  console.log("No pending sign-in links. Request one at http://localhost:3000/login first.");
} else {
  for (const c of signIns.slice(-3)) {
    console.log(`${c.email}\n  ${c.oobLink}\n`);
  }
}
