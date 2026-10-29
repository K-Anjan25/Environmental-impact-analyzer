import { BRAND_NAME } from './result-workbook';

/**
 * Builds a transparent diagonal "ESTIMATE" watermark as PNG bytes for the workbook background.
 * Returns null when canvas is unavailable, so the export still works without it.
 */
export async function makeWatermarkPng(): Promise<Uint8Array | null> {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.translate(320, 180);
    context.rotate(-Math.PI / 7);
    context.textAlign = 'center';
    context.fillStyle = 'rgba(90, 90, 90, 0.10)';
    context.font = 'bold 56px Arial, sans-serif';
    context.fillText('ESTIMATE', 0, -18);
    context.font = 'bold 26px Arial, sans-serif';
    context.fillText(BRAND_NAME, 0, 30);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    return blob ? new Uint8Array(await blob.arrayBuffer()) : null;
  } catch {
    return null;
  }
}
