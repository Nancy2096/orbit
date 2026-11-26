export const MIN_TEXT_CONTRAST = 4.5

export const DOCUMENT_TEXT = "#111827"
export const DOCUMENT_TEXT_MUTED = "#4b5563"
export const DOCUMENT_BORDER = "#e5e7eb"
export const DOCUMENT_BACKGROUND = "#ffffff"
const FALLBACK_BRAND = "#374151"

type Rgb = { r: number; g: number; b: number }

export function parseHexColor(value: string | null | undefined): Rgb | null {
  if (!value) return null
  const hex = value.trim().replace(/^#/, "")
  const full =
    hex.length === 3 || hex.length === 4
      ? hex.slice(0, 3).split("").map((c) => c + c).join("")
      : hex.length === 6 || hex.length === 8
        ? hex.slice(0, 6)
        : null
  if (!full || !/^[0-9a-f]{6}$/i.test(full)) return null
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

function toHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`
}

export function relativeLuminance(color: Rgb): number {
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b)
}

/** WCAG 2.x contrast ratio between two hex colors (1 to 21). Returns 1 if either color is invalid. */
export function contrastRatio(foreground: string, background: string = DOCUMENT_BACKGROUND): number {
  const fg = parseHexColor(foreground)
  const bg = parseHexColor(background)
  if (!fg || !bg) return 1
  const l1 = relativeLuminance(fg)
  const l2 = relativeLuminance(bg)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

export function hasReadableContrast(
  foreground: string,
  background: string = DOCUMENT_BACKGROUND,
  minimum: number = MIN_TEXT_CONTRAST,
): boolean {
  return contrastRatio(foreground, background) >= minimum
}

/** Darkens a color toward black until it reaches the minimum contrast on the background. */
export function darkenUntilReadable(
  color: string,
  background: string = DOCUMENT_BACKGROUND,
  minimum: number = MIN_TEXT_CONTRAST,
): string {
  const rgb = parseHexColor(color)
  if (!rgb) return DOCUMENT_TEXT
  for (let step = 0; step <= 20; step++) {
    const factor = 1 - step * 0.05
    const candidate = toHex({ r: rgb.r * factor, g: rgb.g * factor, b: rgb.b * factor })
    if (hasReadableContrast(candidate, background, minimum)) return candidate
  }
  return DOCUMENT_TEXT
}

/** Near-black, near-white or gray colors don't work as a visible brand accent on a white page. */
function isUsableAccent(color: string): boolean {
  const rgb = parseHexColor(color)
  if (!rgb) return false
  const spread = Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b)
  const luminance = relativeLuminance(rgb)
  if (spread < 24 && (luminance < 0.02 || luminance > 0.85)) return false
  return true
}

function withAlpha(color: string, alphaHex: string): string {
  const rgb = parseHexColor(color)
  return rgb ? `${toHex(rgb)}${alphaHex}` : color
}

export interface BrandingColors {
  primary_color?: string | null
  secondary_color?: string | null
  accent_color?: string | null
}

export interface DocumentPalette {
  /** Main text: always dark, whatever the agency's colors are. */
  text: string
  textMuted: string
  border: string
  background: string
  /** Brand color for details only (lines, table header, soft fills). */
  brand: string
  brandSoft: string
  brandBorder: string
  /** Readable text on top of `brand` (dark or white). */
  onBrand: string
  /** Brand color for text: the brand itself if it reaches 4.5:1, otherwise a darker version of it. */
  brandText: string
  /** The brand color if it is readable as-is on white; otherwise the main text color. */
  brandOrText: string
}

export function getDocumentPalette(branding?: BrandingColors | null): DocumentPalette {
  const candidates = [branding?.primary_color, branding?.accent_color, branding?.secondary_color]
  const brandRaw = candidates.find((c): c is string => !!c && isUsableAccent(c)) ?? FALLBACK_BRAND
  const brand = toHex(parseHexColor(brandRaw) ?? parseHexColor(FALLBACK_BRAND)!)

  const onBrand =
    contrastRatio(DOCUMENT_TEXT, brand) >= contrastRatio("#ffffff", brand) ? DOCUMENT_TEXT : "#ffffff"
  const readable = hasReadableContrast(brand)

  return {
    text: DOCUMENT_TEXT,
    textMuted: DOCUMENT_TEXT_MUTED,
    border: DOCUMENT_BORDER,
    background: DOCUMENT_BACKGROUND,
    brand,
    brandSoft: withAlpha(brand, "14"),
    brandBorder: withAlpha(brand, "59"),
    onBrand,
    brandText: readable ? brand : darkenUntilReadable(brand),
    brandOrText: readable ? brand : DOCUMENT_TEXT,
  }
}
