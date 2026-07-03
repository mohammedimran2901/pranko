/**
 * Watermark utility — overlays a Pranko watermark on free-tier images.
 * Used in API route to add watermark to generated images.
 *
 * For server-side canvas work, we use the `canvas` package on Node.js.
 * (Already declared in package.json)
 */
import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";

const WATERMARK_TEXT = "Made on Pranko 🤡 pranko.app";

/**
 * Apply watermark to an image buffer (PNG/JPEG).
 * Returns a new PNG buffer.
 */
export async function applyWatermark(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image for watermark: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);

  const image = await loadImage(imageBuffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  // Draw original image
  ctx.drawImage(image, 0, 0);

  // Calculate font size based on image dimensions
  const baseSize = Math.max(image.width, image.height);
  const fontSize = Math.max(14, Math.floor(baseSize / 30));

  // Draw diagonal repeated watermark across the image (subtle)
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${fontSize}px "Arial", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const stepX = fontSize * 12;
  const stepY = fontSize * 6;

  // Rotate context and tile watermark
  for (let y = -image.height; y < image.height * 2; y += stepY) {
    for (let x = -image.width; x < image.width * 2; x += stepX) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 8);
      ctx.fillText(WATERMARK_TEXT, 0, 0);
      ctx.restore();
    }
  }
  ctx.restore();

  // Add a solid footer band with the brand handle (more visible)
  const footerHeight = Math.floor(baseSize / 18);
  ctx.fillStyle = "rgba(199, 255, 61, 0.95)"; // Pranko lime
  ctx.fillRect(0, image.height - footerHeight, image.width, footerHeight);

  ctx.fillStyle = "#0A0118";
  ctx.font = `bold ${Math.floor(footerHeight * 0.5)}px "Arial", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    WATERMARK_TEXT,
    image.width / 2,
    image.height - footerHeight / 2
  );

  return canvas.toBuffer("image/png");
}
