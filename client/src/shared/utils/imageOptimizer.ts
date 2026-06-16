/**
 * Cloudinary image optimization utility.
 *
 * Automatically transforms raw Cloudinary upload URLs to serve optimized,
 * correctly-sized images. This can reduce image size by 60-90% without any
 * visible quality loss.
 *
 * Example:
 *   Input:  https://res.cloudinary.com/demo/image/upload/sample.jpg
 *   Output: https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,c_limit/sample.jpg
 */

export interface CloudinaryTransformOptions {
  /** Max width in pixels. Cloudinary won't upscale — only downscale. */
  width?: number;
  /** Quality setting. 'auto' lets Cloudinary pick the optimal value. */
  quality?: number | 'auto';
  /** Format. 'auto' serves WebP/AVIF to supported browsers, JPEG as fallback. */
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
}

const CLOUDINARY_HOST = 'res.cloudinary.com';

/**
 * Returns an optimized Cloudinary URL.
 * Returns the original URL unchanged for non-Cloudinary images.
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: CloudinaryTransformOptions = {}
): string {
  if (!url) return '/placeholder.png';

  if (!url.includes(CLOUDINARY_HOST)) {
    // Not a Cloudinary URL — return as-is (e.g. Supabase Storage, S3, etc.)
    return url;
  }

  const { width = 800, quality = 'auto', format = 'auto' } = options;

  // Build transformation string
  const transforms = [`f_${format}`, `q_${quality}`, `w_${width}`, 'c_limit'].join(',');

  // Insert transformation parameters after "/upload/"
  const uploadMarker = '/upload/';
  const uploadIndex = url.indexOf(uploadMarker);

  if (uploadIndex === -1) {
    // Unusual URL structure — return as-is
    return url;
  }

  const before = url.slice(0, uploadIndex + uploadMarker.length);
  const after = url.slice(uploadIndex + uploadMarker.length);

  // Don't double-apply — already has f_ transforms
  if (after.startsWith('f_') || after.startsWith('q_') || after.includes('/f_')) {
    return url;
  }

  return `${before}${transforms}/${after}`;
}

/** Convenience preset for full-size product gallery image (desktop). */
export function getProductMainImage(url: string | null | undefined): string {
  return getOptimizedImageUrl(url, { width: 800, quality: 'auto', format: 'auto' });
}

/** Convenience preset for small thumbnail (80×80 equivalent). */
export function getProductThumbnail(url: string | null | undefined): string {
  return getOptimizedImageUrl(url, { width: 200, quality: 'auto', format: 'auto' });
}

/** Convenience preset for product cards in listing/related sections. */
export function getProductCardImage(url: string | null | undefined): string {
  return getOptimizedImageUrl(url, { width: 400, quality: 'auto', format: 'auto' });
}
