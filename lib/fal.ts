/**
 * Fal.ai HTTP client for prank photo generation.
 * Uses FAL_KEY from env to call Fal.ai REST API directly.
 *
 * Two models are supported:
 *  - fal-ai/flux-pulid  → single-image face-preserving generation (default)
 *  - fal-ai/uso         → multi-image subject + scene merge (gomytho-style)
 */

const FAL_BASE = "https://queue.fal.run";
const FAL_STORAGE = "https://rest.fal.ai/storage";
const FAL_KEY = process.env.FAL_KEY || "";

const FAL_MODEL_PULID = "fal-ai/flux-pulid";
const FAL_MODEL_MERGE = "fal-ai/uso";

function getHeaders(): Record<string, string> {
  return {
    Authorization: `Key ${FAL_KEY}`,
    "Content-Type": "application/json",
  };
}

function requireFalKey(): void {
  if (!FAL_KEY || FAL_KEY.length < 10) {
    throw new Error(
      "FAL_KEY environment variable is not configured. " +
      "Set it in your .env.local or Vercel environment variables."
    );
  }
}

export async function uploadToFal(base64DataUri: string): Promise<string> {
  requireFalKey();

  const match = base64DataUri.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URI");

  const contentType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");

  const fileExt = contentType.split("/")[1] || "png";
  const initRes = await fetch(`${FAL_STORAGE}/upload/initiate`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      content_type: contentType,
      file_name: `selfie.${fileExt}`,
    }),
  });

  if (!initRes.ok) {
    const text = await initRes.text();
    throw new Error(`Fal upload initiate failed: ${initRes.status} ${text}`);
  }

  const { upload_url, file_url } = await initRes.json();

  const uploadRes = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: buffer,
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`Fal upload PUT failed: ${uploadRes.status} ${text}`);
  }

  return file_url;
}

/**
 * Single-image generation: takes a subject photo and renders it into a
 * scene described by `prompt`. Face-preserving via PuLID.
 */
export async function submitGeneration(
  prompt: string,
  uploadedImageUrl: string
): Promise<string> {
  requireFalKey();

  const url = `${FAL_BASE}/${FAL_MODEL_PULID}`;

  const body = {
    prompt,
    reference_image_url: uploadedImageUrl,
    image_size: "portrait_4_3",
    num_inference_steps: 30,
    guidance_scale: 4,
    id_weight: 0.85,
    enable_safety_checker: true,
    negative_prompt:
      "cartoon, anime, 3d render, low quality, blurry, distorted face, deformed features, nsfw, nudity",
  };

  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fal generation failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.request_id;
}

/**
 * Multi-image merge generation: takes a SUBJECT (the person/object to
 * preserve) and a SCENE (the background / setting) and merges them via
 * fal-ai/uso (subject-driven generation).
 *
 * USO's `input_image_urls` accepts a list: [content_image, style_image, ...]
 *  - index 0 = content (the subject — e.g. the homeless man)
 *  - index 1 = style  (the scene  — e.g. a luxury house)
 *
 * The `prompt` describes what the merged result should look like.
 */
export async function submitMergeGeneration(
  prompt: string,
  subjectImageUrl: string,
  sceneImageUrl: string
): Promise<string> {
  requireFalKey();

  const url = `${FAL_BASE}/${FAL_MODEL_MERGE}`;

  const body = {
    prompt,
    input_image_urls: [subjectImageUrl, sceneImageUrl],
    image_size: "portrait_4_3",
    num_inference_steps: 28,
    guidance_scale: 4,
    enable_safety_checker: true,
    output_format: "png",
    negative_prompt:
      "cartoon, anime, 3d render, low quality, blurry, distorted face, deformed features, nsfw, nudity, watermark, text",
  };

  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fal merge generation failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.request_id;
}

/**
 * Poll a fal.ai queue request for completion and return the result image URL.
 * Works for both PuLID and USO (same queue contract).
 */
export async function pollForResult(
  requestId: string,
  model: "pulid" | "merge" = "pulid",
  maxRetries = 120,
  intervalMs = 2000
): Promise<string> {
  const endpoint = model === "merge" ? FAL_MODEL_MERGE : FAL_MODEL_PULID;
  const statusUrl = `${FAL_BASE}/${endpoint}/requests/${requestId}/status`;
  const resultUrl = `${FAL_BASE}/${endpoint}/requests/${requestId}`;

  for (let i = 0; i < maxRetries; i++) {
    const statusRes = await fetch(statusUrl, {
      headers: getHeaders(),
    });

    if (!statusRes.ok) {
      await new Promise((r) => setTimeout(r, intervalMs));
      continue;
    }

    const statusData = await statusRes.json();

    if (statusData.status === "COMPLETED") {
      for (let r = 0; r < 5; r++) {
        const resultRes = await fetch(resultUrl, {
          headers: getHeaders(),
        });

        if (resultRes.ok) {
          const resultData = await resultRes.json();
          return resultData.images?.[0]?.url || "";
        }

        await new Promise((r) => setTimeout(r, 1000));
      }

      throw new Error(`Fal result fetch failed after retries`);
    }

    if (statusData.status === "FAILED" || statusData.status === "ERROR") {
      throw new Error("Fal generation failed");
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error("Fal generation timed out");
}
