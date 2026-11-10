import { Font } from '@react-pdf/renderer'

export const PDF_FONTS = {
  PLAYFAIR: 'Playfair Display',
  MONTSERRAT: 'Montserrat',
  CORMORANT: 'Cormorant Garamond',
  RALEWAY: 'Raleway',
  JOSEFIN: 'Josefin Sans',
  DM_SERIF: 'DM Serif Display',
  OUTFIT: 'Outfit',
  EB_GARAMOND: 'EB Garamond',
  LIBRE_BASK: 'Libre Baskerville',
  SPACE_GROTESK: 'Space Grotesk',
  INTER: 'Inter',
  LATO: 'Lato',
  OPEN_SANS: 'Open Sans',
  SOURCE_SANS: 'Source Sans 3',
  NUNITO: 'Nunito',
  DM_SANS: 'DM Sans',
  JOST: 'Jost',
  PT_SANS: 'PT Sans',
  MERRIWEATHER: 'Merriweather',
  CRIMSON: 'Crimson Pro',
} as const

export type PdfFontKey = keyof typeof PDF_FONTS
export type PdfFontValue = (typeof PDF_FONTS)[PdfFontKey]

export const HEADING_FONT_ID_TO_PDF: Record<string, PdfFontValue> = {
  playfair: PDF_FONTS.PLAYFAIR,
  montserrat: PDF_FONTS.MONTSERRAT,
  cormorant: PDF_FONTS.CORMORANT,
  raleway: PDF_FONTS.RALEWAY,
  josefin: PDF_FONTS.JOSEFIN,
  'dm-serif': PDF_FONTS.DM_SERIF,
  outfit: PDF_FONTS.OUTFIT,
  'eb-garamond': PDF_FONTS.EB_GARAMOND,
  'libre-bask': PDF_FONTS.LIBRE_BASK,
  'space-grotesk': PDF_FONTS.SPACE_GROTESK,
}

export const BODY_FONT_ID_TO_PDF: Record<string, PdfFontValue> = {
  inter: PDF_FONTS.INTER,
  lato: PDF_FONTS.LATO,
  'open-sans': PDF_FONTS.OPEN_SANS,
  'source-sans': PDF_FONTS.SOURCE_SANS,
  nunito: PDF_FONTS.NUNITO,
  'dm-sans': PDF_FONTS.DM_SANS,
  jost: PDF_FONTS.JOST,
  'pt-sans': PDF_FONTS.PT_SANS,
  merriweather: PDF_FONTS.MERRIWEATHER,
  crimson: PDF_FONTS.CRIMSON,
}

export const DEFAULT_HEADING_FONT: PdfFontValue = PDF_FONTS.MONTSERRAT
export const DEFAULT_BODY_FONT: PdfFontValue = PDF_FONTS.INTER
export const DEFAULT_ACCENT_COLOR = '#051650'

// ─── CDN font URLs ────────────────────────────────────────────────────────────
// WOFF format — react-pdf's fontkit parses WOFF reliably.
// WOFF2 causes "DataView bounds" errors in many react-pdf versions.
// bunny.net = GDPR-friendly Google Fonts mirror, always available on Vercel.

const B = 'https://fonts.bunny.net'

const FONT_DEFS: Array<{ family: PdfFontValue; regular: string; bold?: string }> = [
  {
    family: PDF_FONTS.INTER,
    regular: `${B}/inter/files/inter-latin-400-normal.woff`,
    bold: `${B}/inter/files/inter-latin-700-normal.woff`,
  },
  {
    family: PDF_FONTS.MONTSERRAT,
    regular: `${B}/montserrat/files/montserrat-latin-400-normal.woff`,
    bold: `${B}/montserrat/files/montserrat-latin-700-normal.woff`,
  },
  {
    family: PDF_FONTS.PLAYFAIR,
    regular: `${B}/playfair-display/files/playfair-display-latin-400-normal.woff`,
    bold: `${B}/playfair-display/files/playfair-display-latin-700-normal.woff`,
  },
  {
    family: PDF_FONTS.CORMORANT,
    regular: `${B}/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff`,
    bold: `${B}/cormorant-garamond/files/cormorant-garamond-latin-700-normal.woff`,
  },
  {
    family: PDF_FONTS.RALEWAY,
    regular: `${B}/raleway/files/raleway-latin-400-normal.woff`,
    bold: `${B}/raleway/files/raleway-latin-700-normal.woff`,
  },
  {
    family: PDF_FONTS.JOSEFIN,
    regular: `${B}/josefin-sans/files/josefin-sans-latin-400-normal.woff`,
    bold: `${B}/josefin-sans/files/josefin-sans-latin-700-normal.woff`,
  },
  {
    family: PDF_FONTS.DM_SERIF,
    regular: `${B}/dm-serif-display/files/dm-serif-display-latin-400-normal.woff`,
  },
  {
    family: PDF_FONTS.OUTFIT,
    regular: `${B}/outfit/files/outfit-latin-400-normal.woff`,
    bold: `${B}/outfit/files/outfit-latin-700-normal.woff`,
  },
  {
    family: PDF_FONTS.EB_GARAMOND,
    regular: `${B}/eb-garamond/files/eb-garamond-latin-400-normal.woff`,
    bold: `${B}/eb-garamond/files/eb-garamond-latin-700-normal.woff`,
  },
  {
    family: PDF_FONTS.LIBRE_BASK,
    regular: `${B}/libre-baskerville/files/libre-baskerville-latin-400-normal.woff`,
    bold: `${B}/libre-baskerville/files/libre-baskerville-latin-700-normal.woff`,
  },
  {
    family: PDF_FONTS.SPACE_GROTESK,
    regular: `${B}/space-grotesk/files/space-grotesk-latin-400-normal.woff`,
    bold: `${B}/space-grotesk/files/space-grotesk-latin-700-normal.woff`,
  },
  {
    family: PDF_FONTS.LATO,
    regular: `${B}/lato/files/lato-latin-400-normal.woff`,
    bold: `${B}/lato/files/lato-latin-700-normal.woff`,
  },
  {
    family: PDF_FONTS.OPEN_SANS,
    regular: `${B}/open-sans/files/open-sans-latin-400-normal.woff`,
    bold: `${B}/open-sans/files/open-sans-latin-700-normal.woff`,
  },
  {
    family: PDF_FONTS.SOURCE_SANS,
    regular: `${B}/source-sans-3/files/source-sans-3-latin-400-normal.woff`,
    bold: `${B}/source-sans-3/files/source-sans-3-latin-700-normal.woff`,
  },
  {
    family: PDF_FONTS.NUNITO,
    regular: `${B}/nunito/files/nunito-latin-400-normal.woff`,
    bold: `${B}/nunito/files/nunito-latin-700-normal.woff`,
  },
  {
    family: PDF_FONTS.DM_SANS,
    regular: `${B}/dm-sans/files/dm-sans-latin-400-normal.woff`,
    bold: `${B}/dm-sans/files/dm-sans-latin-700-normal.woff`,
  },
  {
    family: PDF_FONTS.JOST,
    regular: `${B}/jost/files/jost-latin-400-normal.woff`,
    bold: `${B}/jost/files/jost-latin-700-normal.woff`,
  },
  {
    family: PDF_FONTS.PT_SANS,
    regular: `${B}/pt-sans/files/pt-sans-latin-400-normal.woff`,
    bold: `${B}/pt-sans/files/pt-sans-latin-700-normal.woff`,
  },
  {
    family: PDF_FONTS.MERRIWEATHER,
    regular: `${B}/merriweather/files/merriweather-latin-400-normal.woff`,
    bold: `${B}/merriweather/files/merriweather-latin-700-normal.woff`,
  },
  {
    family: PDF_FONTS.CRIMSON,
    regular: `${B}/crimson-pro/files/crimson-pro-latin-400-normal.woff`,
    bold: `${B}/crimson-pro/files/crimson-pro-latin-700-normal.woff`,
  },
]

// ─── Registration ─────────────────────────────────────────────────────────────
// Synchronous — Font.register() is synchronous in react-pdf.
// The `registered` guard prevents duplicate registrations across hot reloads.

let registered = false

export function registerCvFonts(): Promise<void> {
  if (registered) return Promise.resolve()
  registered = true

  for (const { family, regular, bold } of FONT_DEFS) {
    const fonts: { src: string; fontWeight: number }[] = [{ src: regular, fontWeight: 400 }]
    if (bold) fonts.push({ src: bold, fontWeight: 700 })
    Font.register({ family, fonts })
  }

  Font.registerHyphenationCallback((word) => [word])

  return Promise.resolve()
}
