/**
 * End-to-end test of the Pranko + fal.ai pipeline.
 *
 * Usage:
 *   node pranko/test-fal-pipeline.mjs
 *
 * This script:
 *   1. Submits a video generation job to fal.ai
 *   2. Polls for completion
 *   3. Fetches the result
 *   4. Prints the FULL response shape so we can see how to extract the video URL
 */
const FAL_BASE = "https://queue.fal.run";
const FAL_MODEL = "fal-ai/seedance-2/mini/reference-to-video";

// Read FAL_KEY from .env.local
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(join(__dirname, ".env.local"), "utf-8");
const match = envContent.match(/^FAL_KEY=(.+)$/m);
if (!match) { console.error("FAL_KEY not found in .env.local"); process.exit(1); }
const FAL_KEY = match[1].trim();

function headers() {
  return { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" };
}

async function main() {
  console.log("=== Pranko fal.ai Pipeline Test ===");

  // Step 1: Submit a job
  console.log("\n1. Submitting video generation...");
  const submitBody = {
    prompt: "A person smiling and waving at the camera",
    image_urls: ["https://v3.fal.media/files/tiger.png"], // any valid public image
    duration: "5",
    resolution: "480p",
    aspect_ratio: "9:16",
    generate_audio: false,
  };
  const submitRes = await fetch(`${FAL_BASE}/${FAL_MODEL}`, {
    method: "POST", headers: headers(),
    body: JSON.stringify(submitBody),
  });
  const submitData = await submitRes.json();
  console.log("   Status:", submitRes.status);
  console.log("   Keys:", Object.keys(submitData));
  const requestId = submitData.request_id;
  console.log("   request_id:", requestId);

  if (!requestId) {
    console.error("   No request_id returned. Response:", JSON.stringify(submitData).substring(0, 500));
    process.exit(1);
  }

  // Step 2: Poll status
  console.log("\n2. Polling status...");
  const statusUrl = `${FAL_BASE}/${FAL_MODEL}/requests/${requestId}/status`;
  for (let i = 0; i < 120; i++) {
    await sleep(3000);
    const statusRes = await fetch(statusUrl, { headers: headers() });
    if (!statusRes.ok) { console.log(`   Poll ${i + 1}: HTTP ${statusRes.status}`); continue; }
    const statusData = await statusRes.json();
    const s = statusData.status;
    console.log(`   Poll ${i + 1}: status=${s}`);
    if (s === "COMPLETED") break;
    if (s === "FAILED" || s === "ERROR") {
      console.error("   Generation failed:", JSON.stringify(statusData).substring(0, 500));
      process.exit(1);
    }
  }

  // Step 3: Fetch result (POST!)
  console.log("\n3. Fetching result (POST)...");
  const resultUrl = `${FAL_BASE}/${FAL_MODEL}/requests/${requestId}`;
  const resultRes = await fetch(resultUrl, { method: "POST", headers: headers() });
  console.log("   HTTP status:", resultRes.status);
  const resultText = await resultRes.text();
  console.log("   Response length:", resultText.length, "chars");

  let resultData;
  try {
    resultData = JSON.parse(resultText);
  } catch {
    console.error("   NOT VALID JSON. First 500 chars:", resultText.substring(0, 500));
    process.exit(1);
  }

  // Step 4: Full shape dump
  console.log("\n4. Full response structure:");
  dumpStructure(resultData);

  // Step 5: Try to find video URL
  console.log("\n5. Searching for video URL...");
  const videoUrl = findVideoUrl(resultData);
  if (videoUrl) {
    console.log("   FOUND:", videoUrl);
  } else {
    console.log("   NOT FOUND. Here are ALL string values in the response:");
    printAllUrls(resultData);
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function dumpStructure(obj, depth = 0) {
  const pad = "  ".repeat(depth);
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    console.log(pad + (Array.isArray(obj) ? `Array(${obj.length})` : String(obj).substring(0, 100)));
    return;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") {
      const display = v.length > 120 ? v.substring(0, 120) + "..." : v;
      console.log(`${pad}${k}: "${display}"`);
    } else if (typeof v === "object" && v !== null) {
      console.log(`${pad}${k}:`);
      dumpStructure(v, depth + 1);
    } else {
      console.log(`${pad}${k}: ${v}`);
    }
  }
}

function findVideoUrl(obj, depth = 0) {
  if (!obj || depth > 15 || typeof obj !== "object") return null;
  if (Array.isArray(obj)) {
    for (const item of obj) { const f = findVideoUrl(item, depth + 1); if (f) return f; }
    return null;
  }
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value.length > 10) {
      if (!value.startsWith("http")) continue;
      if (/\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(value)) return value;
      if (key.toLowerCase() === "url") return value;
      if (/fal\.|falcdn|v\d+\.fal\.|storage\.googleapis|delivery\.fal|cloudfront/i.test(value)) return value;
      if (/\/(output|result|media|video|generated|files)\//i.test(value)) return value;
    }
    if (typeof value === "object" && value !== null) {
      const f = findVideoUrl(value, depth + 1);
      if (f) return f;
    }
  }
  return null;
}

function printAllUrls(obj, prefix = "") {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) { obj.forEach((item, i) => printAllUrls(item, `${prefix}[${i}]`)); return; }
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string" && v.startsWith("http")) {
      console.log(`   ${prefix}.${k} = ${v}`);
    } else if (typeof v === "object" && v !== null) {
      printAllUrls(v, `${prefix}.${k}`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });