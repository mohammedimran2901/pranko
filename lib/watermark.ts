/**
 * Watermark utility — overlays a Pranko watermark on free-tier images.
 * Uses `sharp` for image processing (works on Vercel serverless).
 */
import sharp from "sharp";

const WATERMARK_TEXT = "Made on Pranko 🤡 pranko.app";

/**
 * Apply watermark to an image from a URL.
 * Returns a new PNG buffer.
 */
export async function applyWatermark(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image for watermark: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);

  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 1024;
  const height = metadata.height || 1024;
  const baseSize = Math.max(width, height);

  // Create watermark overlay SVG
  const fontSize = Math.max(14, Math.floor(baseSize / 30));
  const footerHeight = Math.floor(baseSize / 18);
  const stepX = fontSize * 12;
  const stepY = fontSize * 6;

  // Build diagonal tiled watermark SVG
  let textElements = "";
  for (let y = -height; y < height * 2; y += stepY) {
    for (let x = -width; x < width * 2; x += stepX) {
      textElements += `<text x="${x}" y="${y}" transform="rotate(-22.5, ${x}, ${y})" fill="white" opacity="0.18" font-size="${fontSize}" font-weight="bold" font-family="Arial, sans-serif" text-anchor="middle" dominant-baseline="middle">${WATERMARK_TEXT}</text>`;
    }
  }

  const overlaySvg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${textElements}
      <rect x="0" y="${height - footerHeight}" width="${width}" height="${footerHeight}" fill="rgba(199, 255, 61, 0.95)" />
      <text x="${width / 2}" y="${height - footerHeight / 2}" fill="#0A0118" font-size="${Math.floor(footerHeight * 0.5)}" font-weight="bold" font-family="Arial, sans-serif" text-anchor="middle" dominant-baseline="middle">${WATERMARK_TEXT}</text>
    </svg>
  `);

  // Composite the watermark overlay onto the original image
  const result = await sharp(imageBuffer)
    .composite([
      {
        input: overlaySvg,
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();

  return result;
}