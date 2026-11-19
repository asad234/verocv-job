// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/imageRules.ts   (NEW — browser + server)
// Which pictures can be uploaded as a profile photo / company logo.
// SVG is left out on purpose: an SVG can contain scripts.
// ══════════════════════════════════════════════════════════════════════

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024 // 2 MB
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
export const IMAGE_ACCEPT = IMAGE_TYPES.join(',')

/** null when the file is fine, otherwise the reason (sv / en). */
export function imageProblem(file: { type: string; size: number }, isEn: boolean): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return isEn
      ? 'Choose a JPG, PNG, GIF or WebP image.'
      : 'Välj en JPG-, PNG-, GIF- eller WebP-bild.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return isEn ? 'The image is larger than 2 MB.' : 'Bilden är större än 2 MB.'
  }
  return null
}
