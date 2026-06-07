import Tesseract from 'tesseract.js';

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff',
  'image/x-icon',
  'image/heic',
  'image/heif',
  'image/avif',
  'image/svg+xml',
]);

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|bmp|tiff?|heic|heif|avif|ico|svg)$/i;

export const MAX_QUESTION_IMAGE_BYTES = 25 * 1024 * 1024;

export function isSupportedQuestionImage(file: File): boolean {
  if (file.type && (file.type.startsWith('image/') || IMAGE_MIME_TYPES.has(file.type))) {
    return true;
  }
  return IMAGE_EXTENSIONS.test(file.name);
}

export function formatImageSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Fotoğraftaki soru metnini yerel OCR ile çıkarır (ücretsiz, cihazda). */
export async function extractTextFromQuestionImage(
  dataUrl: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const result = await Tesseract.recognize(dataUrl, 'tur+eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.(Math.round(m.progress * 100));
      }
    },
  });

  return result.data.text
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}
