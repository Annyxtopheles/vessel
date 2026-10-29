import { photoRepo } from '../repositories';
import { generateUuid } from '../repositories/base';
import type { PhotoRecord } from '../types';

const urlCache = new Map<string, string>();

/**
 * Loads an image file or blob into an HTMLImageElement
 */
function loadImage(fileOrBlob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fileOrBlob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Resizes an image onto a canvas and converts it to a Blob
 */
function canvasToBlob(canvas: HTMLCanvasElement, mimeType = 'image/webp', quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob conversion failed'));
      },
      mimeType,
      quality
    );
  });
}

/**
 * Resizes an image element to fit within maxWidth / maxHeight keeping aspect ratio
 */
function resizeImageToCanvas(
  img: HTMLImageElement,
  maxDimension: number
): { canvas: HTMLCanvasElement; width: number; height: number } {
  let { width, height } = img;
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);
  }

  return { canvas, width, height };
}

/**
 * Processes an uploaded photo:
 * 1. Resizes to max 1600px for full resolution
 * 2. Generates a max 400px thumbnail
 * 3. Saves both as Blobs in Dexie photoRepo
 */
export async function processAndStorePhoto(
  fileOrBlob: Blob | File,
  itemId?: string
): Promise<PhotoRecord> {
  const img = await loadImage(fileOrBlob);

  // 1. Full Image (max 1600px)
  const fullRes = resizeImageToCanvas(img, 1600);
  const fullBlob = await canvasToBlob(fullRes.canvas, 'image/webp', 0.85);

  // 2. Thumbnail (max 400px)
  const thumbRes = resizeImageToCanvas(img, 400);
  const thumbBlob = await canvasToBlob(thumbRes.canvas, 'image/webp', 0.80);

  const now = new Date().toISOString();
  const photoRecord: PhotoRecord = {
    id: generateUuid(),
    itemId,
    fullBlob,
    thumbBlob,
    mimeType: 'image/webp',
    width: fullRes.width,
    height: fullRes.height,
    fileName: fileOrBlob instanceof File ? fileOrBlob.name : 'photo.webp',
    created_at: now,
    updated_at: now,
    deleted_at: null,
    revision: 1,
  };

  await photoRepo.batchPut([photoRecord]);
  return photoRecord;
}

/**
 * Retrieves a cached object URL for a stored photo
 */
export async function getPhotoBlobUrl(
  photoId: string,
  variant: 'thumb' | 'full' = 'thumb'
): Promise<string | undefined> {
  const cacheKey = `${photoId}_${variant}`;
  if (urlCache.has(cacheKey)) {
    return urlCache.get(cacheKey);
  }

  const photo = await photoRepo.get(photoId);
  if (!photo) return undefined;

  const blob = variant === 'thumb' ? photo.thumbBlob : photo.fullBlob;
  if (!blob) return undefined;

  const url = URL.createObjectURL(blob);
  urlCache.set(cacheKey, url);
  return url;
}

/**
 * Revokes all cached object URLs
 */
export function clearPhotoUrlCache(): void {
  urlCache.forEach((url) => URL.revokeObjectURL(url));
  urlCache.clear();
}
