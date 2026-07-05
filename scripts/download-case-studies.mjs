#!/usr/bin/env node
/**
 * Downloads fal.ai generation results for cs2-cs5 case studies.
 * Polls each request until COMPLETED, then saves to public/showcase/.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "public", "showcase");

const FAL_KEY = "a923b799-93e9-4821-bffd-f2d060148c60:c6383e0a9117462997c63fa43ef92c4a";
const BASE = "https://queue.fal.run/fal-ai/seedance-2";

const REQS = {
  cs2: "019f3215-0f72-7723-825f-98fbe3f7567e",
  cs3: "019f3215-2eaa-7aa0-9873-feea1b710707",
  cs4: "019f3215-6099-7382-b13b-1bffb832ba40",
  cs5: "019f3215-875c-7ca0-8d8a-dc6a1d1899fc",
};

const headers = {
  Authorization: `Key ${FAL_KEY}`,
  "Content-Type": "application/json",
};

async function poll(id) {
  for (let i = 0; i < 80; i++) {
    const s = await fetch(`${BASE}/requests/${id}/status`, { headers });
    if (!s.ok) { await new Promise(r => setTimeout(r, 2000)); continue; }
    const d = await s.json();
    if (d.status === "COMPLETED") {
      const r = await fetch(`${BASE}/requests/${id}`, { headers });
      const rd = await r.json();
      return rd?.video?.url || rd?.videos?.[0]?.url || rd?.output?.video?.url || "";
    }
    if (d.status === "FAILED" || d.status === "ERROR") throw new Error("FAILED");
    console.log(`  poll ${i+1}: ${d.status}`);
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error("timed out");
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  for (const [cs, rid] of Object.entries(REQS)) {
    console.log(`\n── ${cs.toUpperCase()} (${rid}) ──`);
    try {
      const url = await poll(rid);
      console.log(`  ✓ ${url.slice(0, 80)}…`);
      const res = await fetch(url);
      const buf = Buffer.from(await res.arrayBuffer());
      const outPath = path.join(OUT, `${cs}.mp4`);
      await fs.writeFile(outPath, buf);
      console.log(`  💾 ${cs}.mp4 (${(buf.length / 1024).toFixed(0)} KB)`);
    } catch (e) {
      console.error(`  ❌ ${e.message}`);
    }
  }
  console.log("\nDONE");
}
main().catch(console.error);