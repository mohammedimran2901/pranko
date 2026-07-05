#!/usr/bin/env node
/**
 * scripts/download-fal-results.mjs
 *
 * Fetches 4 existing fal.ai generation results (videos + input images)
 * and saves them locally to /public/showcase/ so the homepage can render
 * them as "real" case studies.
 *
 * For each request_id:
 *   - calls GET https://queue.fal.run/fal-ai/seedance-2/mini/reference-to-video/requests/{id}
 *   - reads input.image_urls[0]   (the original "before" image)
 *   - reads the output video url
 *   - downloads both to /public/showcase/csN.mp4 and csN-before.<ext>
 *
 * Usage:
 *   node scripts/download-fal-results.mjs
 *
 * Requires FAL_KEY in .env.local.
 */

import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public", "showcase");

const FAL_BASE = "https://queue.fal.run";
const FAL_MODEL = "fal-ai/seedance-2/mini/reference-to-video";
const FAL_KEY = process.env.FAL_KEY || "";

// 4 request IDs provided by the user
const REQUEST_IDS = [
  "019f2de3-48a4-7a41-a04d-1132e8542dea",
  "019f2de0-c1fb-7de1-a7c2-31a5e0529315",
  "019f2dde-3aba-7020-b631-4aa36e061a39",
  "019f2ddb-aa55-7832-9059-692e244dab3a",
];

function requireFalKey() {
  if (!FAL_KEY || FAL_KEY.length < 10) {
    console.error(
      "\n❌  FAL_KEY missing or too short. Add it to pranko/.env.local\n"
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

async function fetchRequestResult(requestId) {
  const url = `${FAL_BASE}/${FAL_MODEL}/requests/${requestId}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch request ${requestId}: ${res.status} ${await res.text()}`
    );
  }
  return res.json();
}

function pickVideoUrl(payload) {
  return (
    payload?.video?.url ||
    (Array.isArray(payload?.videos) && payload.videos[0]?.url) ||
    payload?.output?.video?.url ||
    payload?.response?.video?.url ||
    ""
  );
}

function pickInputImageUrl(payload) {
  // The stored request usually echoes the input we sent.
  const candidates = [
    payload?.input?.image_urls,
    payload?.request?.input?.image_urls,
    payload?.image_urls,
    payload?.request?.image_urls,
  ].filter(Boolean);
  for (const arr of candidates) {
    if (Array.isArray(arr) && arr[0]) return arr[0];
  }
  return "";
}

function extFromUrl(url, fallback) {
  try {
    const u = new URL(url);
    const p = u.pathname.split(".").pop()?.toLowerCase().split("?")[0];
    if (p && p.length <= 5) return p;
  } catch {}
  return fallback;
}

async function downloadToFile(url, outPath) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`Download failed ${res.status} for ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath, buf);
  return buf.length;
}

async function processOne(idx, requestId) {
  const cs = `cs${idx + 1}`;
  console.log(`\n── ${cs.toUpperCase()} (${requestId}) ──`);

  const payload = await fetchRequestResult(requestId);
  const videoUrl = pickVideoUrl(payload);
  const beforeUrl = pickInputImageUrl(payload);
  const prompt = payload?.input?.prompt || payload?.request?.input?.prompt || "";

  console.log(`  prompt: ${prompt ? prompt.slice(0, 90) + (prompt.length > 90 ? "…" : "") : "(none)"}`);
  console.log(`  before: ${beforeUrl || "(none)"}`);
  console.log(`  video : ${videoUrl || "(none)"}`);

  if (!videoUrl) {
    throw new Error("No video URL found in fal response");
  }

  // Save the video
  const videoOut = path.join(PUBLIC_DIR, `${cs}.mp4`);
  const videoBytes = await downloadToFile(videoUrl, videoOut);
  console.log(`  💾 video: ${path.relative(ROOT, videoOut)} (${(videoBytes / 1024).toFixed(0)} KB)`);

  // Save the before image (if any)
  let beforeOut = null;
  if (beforeUrl) {
    const ext = extFromUrl(beforeUrl, "jpg");
    beforeOut = path.join(PUBLIC_DIR, `${cs}-before.${ext}`);
    const beforeBytes = await downloadToFile(beforeUrl, beforeOut);
    console.log(`  💾 before: ${path.relative(ROOT, beforeOut)} (${(beforeBytes / 1024).toFixed(0)} KB)`);
  }

  return { id: cs, prompt, beforeUrl, videoUrl, beforeOut, videoOut };
}

async function main() {
  requireFalKey();
  await fs.mkdir(PUBLIC_DIR, { recursive: true });

  console.log(
    `\n📥 Pulling ${REQUEST_IDS.length} fal.ai generation results…\n`
  );

  const results = [];
  for (let i = 0; i < REQUEST_IDS.length; i++) {
    try {
      const r = await processOne(i, REQUEST_IDS[i]);
      results.push(r);
    } catch (err) {
      console.error(`   ❌  ${REQUEST_IDS[i]} failed: ${err.message}`);
      results.push({ id: `cs${i + 1}`, error: err.message });
    }
  }

  // Write a small manifest with the original prompts + URLs so we can
  // label the cards in case-studies.ts without re-fetching.
  const manifestPath = path.join(PUBLIC_DIR, "manifest.json");
  await fs.writeFile(
    manifestPath,
    JSON.stringify(
      results.map((r) => ({
        id: r.id,
        prompt: r.prompt || null,
        beforeUrl: r.beforeUrl || null,
        videoUrl: r.videoUrl || null,
        localBefore: r.beforeOut ? path.basename(r.beforeOut) : null,
        localVideo: r.videoOut ? path.basename(r.videoOut) : null,
        error: r.error || null,
      })),
      null,
      2
    )
  );

  console.log(`\n────── summary ──────`);
  const ok = results.filter((r) => !r.error);
  for (const r of results) {
    if (r.error) console.log(`  ❌  ${r.id} — ${r.error}`);
    else
      console.log(
        `  ✓  ${r.id}  prompt: ${r.prompt ? r.prompt.slice(0, 60) + (r.prompt.length > 60 ? "…" : "") : "(none)"}`
      );
  }
  console.log(`\n  ${ok.length}/${results.length} done.`);
  console.log(`  Manifest: ${path.relative(ROOT, manifestPath)}\n`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
