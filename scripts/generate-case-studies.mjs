#!/usr/bin/env node
/**
 * scripts/generate-case-studies.mjs
 *
 * Generates the 5 real case-study MP4s for the homepage by:
 *   1. Downloading each "before" image from Unsplash.
 *   2. Uploading it to fal.ai storage.
 *   3. Submitting the case-study prompt to
 *      `fal-ai/seedance-2/mini/reference-to-video` (5s, 480p, no audio —
 *      identical to the production pranko model).
 *   4. Polling until the video is ready.
 *   5. Downloading the result to /public/showcase/csN.mp4.
 *
 * Runtime: ~30s per video × 5 = ~2.5 min total.
 *
 * Requires:
 *   - .env.local with FAL_KEY=... (and optional POLAR_* vars, unused here)
 *   - Node 20+
 *
 * Usage:
 *   node scripts/generate-case-studies.mjs           # all 5
 *   node scripts/generate-case-studies.mjs --only 1  # just cs1
 */

import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public", "showcase");

const FAL_BASE = "https://queue.fal.run";
const STORAGE_BASE = "https://rest.fal.ai/storage";
const FAL_MODEL = "fal-ai/seedance-2/mini/reference-to-video";
const POLL_INTERVAL_MS = 2500;
const POLL_MAX_RETRIES = 60; // 60 × 2.5s = 150s max wait per video

const FAL_KEY = process.env.FAL_KEY || "";

// ─── Case study definitions (mirror lib/case-studies.ts) ────────────
const CASE_STUDIES = [
  {
    id: "cs1",
    beforeImage:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80&auto=format&fit=crop",
    prompt:
      "Show this on my hand but damaged quite badly with a cracked glass, deep scratches all over the bezel, and scuffed metal — looking beat up and neglected, like it just survived a car crash.",
  },
  {
    id: "cs2",
    beforeImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80&auto=format&fit=crop",
    prompt:
      "Same person in the same setting, but now as a drunken homeless man — disheveled hair, torn stained clothes, holding a bottle in a paper bag, swaying, mumbling, looking exhausted and broke.",
  },
  {
    id: "cs3",
    beforeImage:
      "https://images.unsplash.com/photo-1559963110-71b394e7494d?w=1200&q=80&auto=format&fit=crop",
    prompt:
      "Her dancing to Michael Jackson — breakdancing, doing the moonwalk, spins, full energy, sweaty but unstoppable, her grandma clothes flying with the moves.",
  },
  {
    id: "cs4",
    beforeImage:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80&auto=format&fit=crop",
    prompt:
      "First-person view of driving like a maniac — well over the speed limit, the speedometer pinned, weaving between cars, hands gripping the wheel, blurry roadside, completely unhinged.",
  },
  {
    id: "cs5",
    beforeImage:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80&auto=format&fit=crop",
    prompt:
      "The same living room, but after a wild house party — bottles and red cups everywhere, confetti and balloons, tipped furniture, someone passed out on the couch, total chaos.",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────

function requireFalKey() {
  if (!FAL_KEY || FAL_KEY === "your_fal_key_here" || FAL_KEY === "PASTE_YOUR_KEY_HERE") {
    console.error(
      "\n❌  FAL_KEY is missing or is still the placeholder.\n" +
        "    Add a real key to pranko/.env.local, e.g.:\n" +
        "    FAL_KEY=KEY_ID:KEY_SECRET\n" +
        "    (https://fal.ai/dashboard/keys)\n"
    );
    process.exit(1);
  }
}

function authHeaders() {
  return {
    Authorization: `Key ${FAL_KEY}`,
    "Content-Type": "application/json",
  };
}

async function downloadToBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status} for ${url}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

async function uploadToFal(buffer, mimeType, ext) {
  // 1. Initiate upload
  const initRes = await fetch(`${STORAGE_BASE}/upload/initiate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ content_type: mimeType, file_name: `before.${ext}` }),
  });
  if (!initRes.ok) {
    throw new Error(`fal upload initiate failed: ${initRes.status} ${await initRes.text()}`);
  }
  const { upload_url, file_url } = await initRes.json();

  // 2. PUT the bytes
  const putRes = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: buffer,
  });
  if (!putRes.ok) {
    throw new Error(`fal upload PUT failed: ${putRes.status} ${await putRes.text()}`);
  }
  return file_url;
}

async function submitVideo(prompt, imageUrl) {
  const res = await fetch(`${FAL_BASE}/${FAL_MODEL}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      prompt,
      image_urls: [imageUrl],
      duration: "5",
      resolution: "480p",
    }),
  });
  if (!res.ok) {
    throw new Error(`fal submit failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.request_id;
}

async function pollForResult(requestId) {
  const statusUrl = `${FAL_BASE}/${FAL_MODEL}/requests/${requestId}/status`;
  const resultUrl = `${FAL_BASE}/${FAL_MODEL}/requests/${requestId}`;
  for (let i = 0; i < POLL_MAX_RETRIES; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const s = await fetch(statusUrl, { headers: authHeaders() });
    if (!s.ok) continue;
    const sd = await s.json();
    if (sd.status === "COMPLETED") {
      const r = await fetch(resultUrl, { headers: authHeaders() });
      if (!r.ok) continue;
      const rd = await r.json();
      const videoUrl =
        rd?.video?.url ||
        (Array.isArray(rd?.videos) && rd.videos[0]?.url) ||
        rd?.output?.video?.url;
      if (videoUrl) return videoUrl;
    }
    if (sd.status === "FAILED" || sd.status === "ERROR") {
      throw new Error("fal reported FAILED/ERROR for request " + requestId);
    }
  }
  throw new Error("fal timed out after " + POLL_MAX_RETRIES + " polls");
}

async function downloadToPublic(videoUrl, outPath) {
  const r = await fetch(videoUrl);
  if (!r.ok) throw new Error(`final download failed: ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  await fs.writeFile(outPath, buf);
  return buf.length;
}

async function processOne(cs) {
  console.log(`\n── ${cs.id.toUpperCase()} ──`);
  console.log(`  ⬇  downloading Unsplash image…`);
  const buf = await downloadToBuffer(cs.beforeImage);
  const mimeType = "image/jpeg";
  console.log(`  ⬆  uploading to fal.ai storage (${(buf.length / 1024).toFixed(0)} KB)…`);
  const imageUrl = await uploadToFal(buf, mimeType, "jpg");
  console.log(`     ✓ ${imageUrl.slice(0, 80)}…`);
  console.log(`  🎬 submitting to ${FAL_MODEL}…`);
  const requestId = await submitVideo(cs.prompt, imageUrl);
  console.log(`     request_id: ${requestId}`);
  console.log(`  ⏳  polling (up to ${(POLL_MAX_RETRIES * POLL_INTERVAL_MS) / 1000}s)…`);
  const videoUrl = await pollForResult(requestId);
  console.log(`     ✓ video ready: ${videoUrl.slice(0, 80)}…`);
  const outPath = path.join(PUBLIC_DIR, `${cs.id}.mp4`);
  console.log(`  💾  saving to ${path.relative(ROOT, outPath)}…`);
  const bytes = await downloadToPublic(videoUrl, outPath);
  console.log(`     ✓ ${(bytes / 1024).toFixed(0)} KB written`);
  return { id: cs.id, bytes, path: outPath };
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  requireFalKey();
  await fs.mkdir(PUBLIC_DIR, { recursive: true });

  // Honor --only N (1-5)
  const args = process.argv.slice(2);
  const onlyIdx = args.indexOf("--only");
  const only = onlyIdx >= 0 ? parseInt(args[onlyIdx + 1], 10) : null;
  const list = only
    ? CASE_STUDIES.filter((c) => c.id === `cs${only}`)
    : CASE_STUDIES;
  if (list.length === 0) {
    console.error(`No case study found for --only ${only}`);
    process.exit(1);
  }

  console.log(
    `\n🧌 Pranko case-study generator\n` +
      `   ${list.length} video${list.length > 1 ? "s" : ""} · model: ${FAL_MODEL}\n`
  );

  const results = [];
  for (const cs of list) {
    try {
      const r = await processOne(cs);
      results.push(r);
    } catch (err) {
      console.error(`   ❌  ${cs.id} failed: ${err.message}`);
      results.push({ id: cs.id, error: err.message });
    }
  }

  console.log(`\n────── summary ──────`);
  for (const r of results) {
    if (r.error) console.log(`  ❌  ${r.id} — ${r.error}`);
    else
      console.log(
        `  ✓  ${r.id}  ${(r.bytes / 1024).toFixed(0)} KB  →  ${path.relative(ROOT, r.path)}`
      );
  }
  const ok = results.filter((r) => !r.error).length;
  if (ok === 0) {
    console.error(`\n  No videos generated. Check FAL_KEY and try again.`);
    process.exit(1);
  }
  console.log(`\n  ${ok}/${results.length} done. Commit & push to deploy.\n`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
