/**
 * Fal.ai HTTP client for prank video generation using xAI Grok Imagine.
 * Uses FAL_KEY from env to call Fal.ai REST API directly.
 *
 * Model: fal-ai/xai/reference-to-video (Grok Imagine)
 * Input: image + text prompt → output: video
 *
 * Reliable xAI infrastructure. $0.25 per 5-second video at 480p.
 * 9:16 aspect ratio for TikTok/Reels/Shorts.
 */

const FAL_BASE = "https://queue.fal.run";
const STORAGE_BASE = "https://rest.fal.ai/storage";
const FAL_KEY = process.env.FAL_KEY || "";
const FAL_MODEL = "fal-ai/xai/reference-to-video";

function authHeaders(): Record<string, string> {
  return { Authorization: `Key ${FAL_KEY}` };
}

function requireFalKey(): void {
  if (!FAL_KEY || FAL_KEY.length < 10) {
    throw new Error("FAL_KEY is not configured. Add it to .env.");
  }
}

/** Helper: safely parse JSON from a response, throwing a clear error on failure. */
async function safeJson(res: Response, label: string): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Fal ${label} returned non-JSON (status ${res.status}): ${text.substring(0, 300)}`
    );
  }
}

export async function uploadImage(base64DataUri: string): Promise<string> {
  requireFalKey();
  const match = base64DataUri.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URI");
  const contentType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");
  const ext = contentType.split("/")[1] || "png";

  const initRes = await fetch(`${STORAGE_BASE}/upload/initiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Key ${FAL_KEY}` },
    body: JSON.stringify({ content_type: contentType, file_name: `selfie.${ext}` }),
  });
  if (!initRes.ok) {
    const text = await initRes.text();
    throw new Error(`Fal upload initiate failed: ${initRes.status} ${text.substring(0, 200)}`);
  }
  const { upload_url, file_url } = await safeJson(initRes, "upload initiate");

  const uploadRes = await fetch(upload_url, {
    method: "PUT", headers: { "Content-Type": contentType }, body: buffer,
  });
  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`Fal upload PUT failed: ${uploadRes.status} ${text.substring(0, 200)}`);
  }
  return file_url;
}

export async function submitVideoGeneration(prompt: string, imageUrl: string): Promise<{ requestId: string; statusUrl: string; resultUrl: string }> {
  requireFalKey();
  const response = await fetch(`${FAL_BASE}/${FAL_MODEL}`, {
    method: "POST",
    headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      reference_image_urls: [imageUrl],
      duration: 5,
      resolution: "480p",
      aspect_ratio: "9:16",
    }),
  });
  const data = await safeJson(response, "generation submit");
  if (!response.ok) {
    throw new Error(`Fal generation failed (${response.status}): ${JSON.stringify(data).substring(0, 300)}`);
  }
  return {
    requestId: data.request_id,
    statusUrl: data.status_url,
    resultUrl: data.response_url,
  };
}

export async function pollForVideoResult(
  requestId: string, maxRetries = 60, intervalMs = 2000
): Promise<{ videoUrl: string }> {
  const statusUrl = `${FAL_BASE}/${FAL_MODEL}/requests/${requestId}/status`;
  const resultUrl = `${FAL_BASE}/${FAL_MODEL}/requests/${requestId}`;

  for (let i = 0; i < maxRetries; i++) {
    const statusRes = await fetch(statusUrl, { method: "GET", headers: authHeaders() });
    if (!statusRes.ok) { await new Promise(r => setTimeout(r, intervalMs)); continue; }
    const statusData = await safeJson(statusRes, "status poll");

    if (statusData.status === "COMPLETED") {
      for (let r = 0; r < 10; r++) {
        const resultRes = await fetch(resultUrl, { method: "GET", headers: authHeaders() });
        if (resultRes.ok) {
          const resultData = await safeJson(resultRes, "result fetch");
          const videoUrl = resultData?.video?.url || "";
          if (videoUrl) return { videoUrl };
        }
        await new Promise(r => setTimeout(r, 2000));
      }
      throw new Error("Fal result fetch failed after retries");
    }
    if (statusData.status === "FAILED" || statusData.status === "ERROR") {
      throw new Error("Fal generation failed");
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error("Fal generation timed out");
}