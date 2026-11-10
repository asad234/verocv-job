// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/utils/server/contractPdf.ts
// WHAT IT DOES:   SERVER ONLY — builds the fully signed contract PDF (text + employee AND
//                 employer signatures + signing certificate) and stores it in "contract-pdfs".
//                 Created once BOTH parties have signed.
// Requires:       pnpm add pdf-lib
// ══════════════════════════════════════════════════════════════════════

import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib'
import { SECTION_KEYS } from './Contractprompt'
import { findContractDocument, relId } from './Contractaccess'
import { CONTRACT_SECTION_LABELS } from '@/utils/contractSectionLabels'
import { CONTRACT_PDFS_DIR } from '@/collections/ContractPdfs'

/* ─────────────────────────────────────────────
   Page geometry (A4, points)
───────────────────────────────────────────── */
const W = 595.28
const H = 841.89
const MARGIN_X = 56
const MARGIN_TOP = 64
const MARGIN_BOTTOM = 70
const CONTENT_W = W - MARGIN_X * 2

const GRAY = rgb(0.42, 0.45, 0.5)
const LIGHT_GRAY = rgb(0.82, 0.84, 0.87)
const INK = rgb(0.07, 0.09, 0.15)

/* ─────────────────────────────────────────────
   Labels (Swedish by default, English if the contract is in English)
───────────────────────────────────────────── */
const LABELS = {
  sv: {
    employer: 'Arbetsgivare',
    employee: 'Arbetstagare',
    orgNo: 'Org.nr',
    personalNo: 'Personnr',
    contact: 'Kontaktperson',
    signedElectronically: 'Signerat elektroniskt',
    page: 'Sida',
    of: 'av',
    certificate: 'Signeringsintyg',
    certIntro:
      'Detta intyg visar hur och när avtalet signerades elektroniskt i VeroCV av båda parter.',
    contract: 'Avtal',
    contractId: 'Kontrakts-ID',
    signedBy: 'Signerat av',
    signedAtLabel: 'Tidpunkt',
    method: 'Signeringsmetod',
    methodValue: 'Elektronisk signatur i VeroCV (ritad eller skriven)',
    ip: 'IP-adress',
    device: 'Webbläsare / enhet',
    checksum: 'Kontrollsumma för avtalstexten (SHA-256)',
    checksumNote: 'Kontrollsumman ändras om något i avtalstexten ändras efter signering.',
    signature: 'Signatur',
    untitled: 'Anställningsavtal',
    signedWithBankId: 'Signerat med BankID',
    methodBankId: 'BankID (svensk e-legitimation)',
  },
  en: {
    employer: 'Employer',
    employee: 'Employee',
    orgNo: 'Org. no.',
    personalNo: 'Personal no.',
    contact: 'Contact',
    signedElectronically: 'Signed electronically',
    page: 'Page',
    of: 'of',
    certificate: 'Signing certificate',
    certIntro:
      'This certificate shows how and when the agreement was signed electronically in VeroCV by both parties.',
    contract: 'Agreement',
    contractId: 'Contract ID',
    signedBy: 'Signed by',
    signedAtLabel: 'Time',
    method: 'Signing method',
    methodValue: 'Electronic signature in VeroCV (drawn or typed)',
    ip: 'IP address',
    device: 'Browser / device',
    checksum: 'Checksum of the agreement text (SHA-256)',
    checksumNote:
      'The checksum changes if anything in the agreement text is changed after signing.',
    signature: 'Signature',
    untitled: 'Employment Agreement',
    signedWithBankId: 'Signed with BankID',
    methodBankId: 'BankID (Swedish e-ID)',
  },
}
type Lang = keyof typeof LABELS

/* ─────────────────────────────────────────────
   Input
───────────────────────────────────────────── */
export interface ContractPdfInput {
  contractId: string | number
  title: string
  sections: Record<string, unknown>
  documentStyle: Record<string, unknown>
  companyName: string
  orgNumber: string
  companyAddress: string
  contactPerson: string
  employeeName: string
  personalNumber: string
  employeeAddress: string
  signingPlace: string
  signingDate: string | null
  /** Employee signature — "bankid" means there is no drawn image */
  employeeSigningMethod: 'bankid' | 'verocv'
  signedAt: string
  signedByName: string
  signatureDataUrl: string | null
  audit: { ip: string; userAgent: string }
  /** Employer (manager) signature */
  managerSignedAt: string
  managerSignedByName: string
  managerSignatureDataUrl: string | null
  managerAudit: { ip: string; userAgent: string }
  /** Company logo (PNG/JPEG data URL): small at the top of each page + faint watermark behind the text. */
  companyLogoDataUrl?: string | null
}

/* ─────────────────────────────────────────────
   Fonts — standard PDF fonts (no font files needed)
───────────────────────────────────────────── */
type Family = 'helvetica' | 'times' | 'courier'

const STANDARD: Record<Family, [StandardFonts, StandardFonts, StandardFonts, StandardFonts]> = {
  helvetica: [
    StandardFonts.Helvetica,
    StandardFonts.HelveticaBold,
    StandardFonts.HelveticaOblique,
    StandardFonts.HelveticaBoldOblique,
  ],
  times: [
    StandardFonts.TimesRoman,
    StandardFonts.TimesRomanBold,
    StandardFonts.TimesRomanItalic,
    StandardFonts.TimesRomanBoldItalic,
  ],
  courier: [
    StandardFonts.Courier,
    StandardFonts.CourierBold,
    StandardFonts.CourierOblique,
    StandardFonts.CourierBoldOblique,
  ],
}

/** Maps the editor's font names to the closest standard PDF font family. */
function familyOf(name: unknown): Family {
  const s = String(name ?? '').toLowerCase()
  if (/mono|courier/.test(s)) return 'courier'
  if (/sans/.test(s)) return 'helvetica'
  if (/serif|times|georgia|garamond|merriweather|playfair|lora|baskerville/.test(s)) return 'times'
  return 'helvetica'
}

class Fonts {
  private map = new Map<string, PDFFont>()
  static async create(pdf: PDFDocument) {
    const f = new Fonts()
    for (const family of Object.keys(STANDARD) as Family[]) {
      for (let i = 0; i < 4; i++)
        f.map.set(`${family}-${i}`, await pdf.embedFont(STANDARD[family][i]!))
    }
    return f
  }
  get(family: Family, bold = false, italic = false): PDFFont {
    return this.map.get(`${family}-${(bold ? 1 : 0) + (italic ? 2 : 0)}`)!
  }
}

/* Standard fonts only cover Latin-1 (incl. å ä ö é). Replace anything else. */
const REPLACEMENTS: Record<string, string> = {
  '\u2011': '-',
  '\u2212': '-',
  '\u00a0': ' ',
  '\u2009': ' ',
  '\u202f': ' ',
  '\u200b': '',
  '≥': '>=',
  '≤': '<=',
  '→': '->',
  '←': '<-',
  '✓': 'v',
  '✔': 'v',
}
const supportCache = new WeakMap<PDFFont, Map<string, boolean>>()
function safeText(font: PDFFont, text: string): string {
  let cache = supportCache.get(font)
  if (!cache) supportCache.set(font, (cache = new Map()))
  let out = ''
  for (const ch of text) {
    if (ch === '\n') {
      out += ch
      continue
    }
    let ok = cache.get(ch)
    if (ok === undefined) {
      try {
        font.encodeText(ch)
        ok = true
      } catch {
        ok = false
      }
      cache.set(ch, ok)
    }
    out += ok ? ch : (REPLACEMENTS[ch] ?? '?')
  }
  return out
}

/* ─────────────────────────────────────────────
   Style helpers
───────────────────────────────────────────── */
function parseColor(value: unknown, fallback: RGB): RGB {
  if (typeof value !== 'string') return fallback
  const s = value.trim()
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    let h = hex[1]!
    if (h.length === 3)
      h = h
        .split('')
        .map((c) => c + c)
        .join('')
    const n = parseInt(h, 16)
    return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
  }
  const m = s.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i)
  if (m) return rgb(Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255)
  return fallback
}

function toPt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null
  const n = parseFloat(value)
  if (!Number.isFinite(n)) return null
  return value.trim().endsWith('px') ? n * 0.75 : n
}

const clampSize = (n: number) => Math.min(48, Math.max(6, n))

interface Seg {
  text: string
  font: PDFFont
  size: number
  color: RGB
  underline?: boolean
}

interface BaseStyle {
  family: Family
  bold: boolean
  italic: boolean
  color: RGB
  size: number
}

/**
 * Reads one rich-text run. Accepts the common shapes
 * ({ bold, italic, underline, color, fontSize, fontFamily } at the top level,
 * or inside run.style / run.marks) so it works with your RichRun type.
 */
function runToSeg(run: any, base: BaseStyle, fonts: Fonts): Seg {
  const s = { ...(run ?? {}), ...(run?.style ?? {}), ...(run?.marks ?? {}) }
  const fw = s.fontWeight
  const bold = Boolean(
    s.bold ?? s.isBold ?? (fw != null ? fw === 'bold' || Number(fw) >= 600 : base.bold),
  )
  const italic = Boolean(
    s.italic ?? s.isItalic ?? (s.fontStyle != null ? s.fontStyle === 'italic' : base.italic),
  )
  const underline = Boolean(
    s.underline ?? (typeof s.textDecoration === 'string' && s.textDecoration.includes('underline')),
  )
  const size = clampSize(toPt(s.fontSize ?? s.size) ?? base.size)
  const family = s.fontFamily || s.font ? familyOf(s.fontFamily ?? s.font) : base.family
  return {
    text: typeof s.text === 'string' ? s.text : '',
    font: fonts.get(family, bold, italic),
    size,
    color: parseColor(s.color, base.color),
    underline,
  }
}

/* ─────────────────────────────────────────────
   Simple flowing-text layout with page breaks
───────────────────────────────────────────── */
class Writer {
  page!: PDFPage
  y = 0
  readonly pages: PDFPage[] = []

  /** Runs on every new page before any text is written (used for the watermark + header logo). */
  private decorate?: (page: PDFPage) => void

  constructor(
    private pdf: PDFDocument,
    decorate?: (page: PDFPage) => void,
  ) {
    this.decorate = decorate
    this.newPage()
  }

  newPage() {
    this.page = this.pdf.addPage([W, H])
    this.pages.push(this.page)
    this.y = H - MARGIN_TOP
    this.decorate?.(this.page)
  }

  /** Start a new page if fewer than `h` points are left. */
  ensure(h: number) {
    if (this.y - h < MARGIN_BOTTOM) this.newPage()
  }

  space(h: number) {
    this.y -= h
    if (this.y < MARGIN_BOTTOM) this.newPage()
  }

  /** Writes styled segments with word wrapping. "\n" = line break, "\n\n" = blank line. */
  paragraph(segs: Seg[], opts: { x?: number; width?: number; lineHeight?: number } = {}) {
    const x0 = opts.x ?? MARGIN_X
    const maxW = opts.width ?? CONTENT_W
    const lhFactor = opts.lineHeight ?? 1.45
    const fallbackSize = segs[0]?.size ?? 10

    type Piece = { text: string; seg: Seg; width: number }
    let line: Piece[] = []
    let lineW = 0

    const flush = () => {
      while (line.length && !line[line.length - 1]!.text.trim()) lineW -= line.pop()!.width
      const size = line.length ? Math.max(...line.map((p) => p.seg.size)) : fallbackSize
      const lh = size * lhFactor
      this.ensure(lh)
      const baseline = this.y - size
      let x = x0
      for (const p of line) {
        if (p.text) {
          this.page.drawText(p.text, {
            x,
            y: baseline,
            size: p.seg.size,
            font: p.seg.font,
            color: p.seg.color,
          })
          if (p.seg.underline && p.text.trim()) {
            this.page.drawLine({
              start: { x, y: baseline - 1.5 },
              end: { x: x + p.width, y: baseline - 1.5 },
              thickness: 0.6,
              color: p.seg.color,
            })
          }
        }
        x += p.width
      }
      this.y -= lh
      line = []
      lineW = 0
    }

    for (const seg of segs) {
      const text = safeText(seg.font, seg.text.replace(/\r\n?/g, '\n').replace(/\t/g, '    '))
      for (const tok of text.split(/(\n| +)/)) {
        if (!tok) continue
        if (tok === '\n') {
          flush()
          continue
        }
        const isSpace = /^ +$/.test(tok)
        if (isSpace && line.length === 0) continue
        const w = seg.font.widthOfTextAtSize(tok, seg.size)

        if (isSpace) {
          if (lineW + w > maxW) flush()
          else {
            line.push({ text: tok, seg, width: w })
            lineW += w
          }
          continue
        }
        if (lineW + w > maxW && line.length) flush()

        if (w > maxW) {
          // A single word wider than the line — break it by characters.
          let chunk = ''
          for (const ch of tok) {
            const cw = seg.font.widthOfTextAtSize(chunk + ch, seg.size)
            if (lineW + cw > maxW && chunk) {
              line.push({ text: chunk, seg, width: seg.font.widthOfTextAtSize(chunk, seg.size) })
              flush()
              chunk = ch
            } else chunk += ch
          }
          if (chunk) {
            const cw = seg.font.widthOfTextAtSize(chunk, seg.size)
            line.push({ text: chunk, seg, width: cw })
            lineW += cw
          }
          continue
        }

        line.push({ text: tok, seg, width: w })
        lineW += w
      }
    }
    if (line.length) flush()
  }
}

/* ─────────────────────────────────────────────
   Build the PDF
───────────────────────────────────────────── */
const runsText = (runs: unknown) =>
  Array.isArray(runs)
    ? runs.map((r: any) => (typeof r?.text === 'string' ? r.text : '')).join('')
    : ''

const isFilled = (runs: unknown) => runsText(runs).trim().length > 0

function detectLang(title: string): Lang {
  return /employment|agreement|contract/i.test(title) && !/anställning|avtal/i.test(title)
    ? 'en'
    : 'sv'
}

function fmtDateTime(iso: string, lang: Lang) {
  return (
    new Date(iso).toLocaleString(lang === 'sv' ? 'sv-SE' : 'en-GB', {
      timeZone: 'Europe/Stockholm',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' (Europe/Stockholm)'
  )
}
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : '')

/** SHA-256 over the signed content — proves the text hasn't changed since signing. */
export function contractChecksum(input: ContractPdfInput): string {
  const canonical = JSON.stringify({
    title: input.title,
    employer: [input.companyName, input.orgNumber, input.companyAddress],
    employee: [input.employeeName, input.personalNumber, input.employeeAddress],
    sections: SECTION_KEYS.map((k) => [k, runsText(input.sections[k])]),
  })
  return createHash('sha256').update(canonical).digest('hex')
}

/** Embeds a PNG or JPEG data URL. Returns null for anything else or on failure. */
async function embedImage(pdf: PDFDocument, dataUrl: string | null | undefined) {
  if (!dataUrl) return null
  const match = dataUrl.match(/^data:image\/(png|jpe?g);base64,(.+)$/i)
  if (!match) return null
  try {
    // pdf-lib expects a plain Uint8Array (newer TypeScript rejects Node's Buffer here).
    const bytes = new Uint8Array(Buffer.from(match[2]!, 'base64'))
    return match[1]!.toLowerCase() === 'png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes)
  } catch {
    return null
  }
}

const LOGO_MAX_W = 110
const LOGO_MAX_H = 32
const WATERMARK_OPACITY = 0.06

export async function buildContractPdf(input: ContractPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const fonts = await Fonts.create(pdf)

  // Company logo: faint, large watermark in the middle of every page (drawn first, so
  // it sits *behind* the text) + a small logo in the top-left corner of every page.
  const logo = await embedImage(pdf, input.companyLogoDataUrl)
  const decorate = logo
    ? (page: PDFPage) => {
        const wmScale = Math.min((W * 0.6) / logo.width, (H * 0.45) / logo.height)
        const wmW = logo.width * wmScale
        const wmH = logo.height * wmScale
        page.drawImage(logo, {
          x: (W - wmW) / 2,
          y: (H - wmH) / 2,
          width: wmW,
          height: wmH,
          opacity: WATERMARK_OPACITY,
        })

        const s = Math.min(LOGO_MAX_W / logo.width, LOGO_MAX_H / logo.height)
        const lh = logo.height * s
        page.drawImage(logo, { x: MARGIN_X, y: H - 22 - lh, width: logo.width * s, height: lh })
      }
    : undefined
  const w = new Writer(pdf, decorate)
  // Leave room under the header logo before the first line of text.
  if (logo) w.y = Math.min(w.y, H - 22 - LOGO_MAX_H - 16)

  const titleText =
    runsText(input.sections.agreementTitle).trim() || input.title || LABELS.sv.untitled
  const lang = detectLang(titleText)
  const L = LABELS[lang]
  const style = input.documentStyle ?? {}

  const heading: BaseStyle = {
    family: familyOf(style.headingFont),
    bold: style.headingBold !== false,
    italic: false,
    color: parseColor(style.headingColor, rgb(0.02, 0.09, 0.31)),
    size: clampSize(Number(style.headingSize) || 13),
  }
  const body: BaseStyle = {
    family: familyOf(style.bodyFont),
    bold: false,
    italic: false,
    color: parseColor(style.bodyColor, rgb(0.12, 0.16, 0.22)),
    size: clampSize(Number(style.bodySize) || 10),
  }
  const seg = (
    text: string,
    s: BaseStyle,
    over: Partial<Seg> & { bold?: boolean; italic?: boolean } = {},
  ): Seg => ({
    text,
    font: fonts.get(s.family, over.bold ?? s.bold, over.italic ?? s.italic),
    size: over.size ?? s.size,
    color: over.color ?? s.color,
  })

  pdf.setTitle(titleText)
  pdf.setAuthor(input.companyName || 'VeroCV')
  pdf.setSubject(lang === 'sv' ? 'Signerat anställningsavtal' : 'Signed employment agreement')
  pdf.setProducer('VeroCV')
  pdf.setCreator('VeroCV')
  pdf.setCreationDate(new Date(input.managerSignedAt || input.signedAt))

  /* ── Title ── */
  w.paragraph([seg(titleText, heading, { size: clampSize(heading.size + 6) })], { lineHeight: 1.3 })
  w.space(14)

  /* ── Parties (two columns) ── */
  w.ensure(110)
  const colW = (CONTENT_W - 24) / 2
  const startY = w.y
  const startPage = w.page
  const party = (x: number, label: string, lines: string[]) => {
    w.page = startPage
    w.y = startY
    w.paragraph([seg(label.toUpperCase(), body, { size: 7.5, bold: true, color: GRAY })], {
      x,
      width: colW,
      lineHeight: 1.6,
    })
    lines
      .filter(Boolean)
      .forEach((l, i) =>
        w.paragraph([seg(l, body, { bold: i === 0, size: body.size })], {
          x,
          width: colW,
          lineHeight: 1.4,
        }),
      )
    return w.y
  }
  const yLeft = party(MARGIN_X, L.employer, [
    input.companyName,
    input.orgNumber && `${L.orgNo} ${input.orgNumber}`,
    input.companyAddress,
    input.contactPerson && `${L.contact}: ${input.contactPerson}`,
  ])
  const yRight = party(MARGIN_X + colW + 24, L.employee, [
    input.employeeName,
    input.personalNumber && `${L.personalNo} ${input.personalNumber}`,
    input.employeeAddress,
  ])
  w.y = Math.min(yLeft, yRight)
  w.space(10)
  w.page.drawLine({
    start: { x: MARGIN_X, y: w.y },
    end: { x: W - MARGIN_X, y: w.y },
    thickness: 0.6,
    color: LIGHT_GRAY,
  })
  w.space(16)

  /* ── Sections ── */
  for (const key of SECTION_KEYS) {
    if (key === 'agreementTitle') continue
    const runs = input.sections[key]
    if (!isFilled(runs)) continue
    // Keep the heading together with at least a few lines of its text.
    w.ensure(heading.size * 1.5 + body.size * 1.45 * 3)
    w.paragraph([seg(CONTRACT_SECTION_LABELS[key][lang], heading)], { lineHeight: 1.5 })
    w.space(2)
    w.paragraph((runs as any[]).map((r) => runToSeg(r, body, fonts)))
    w.space(12)
  }

  /* ── Signatures ── */
  w.ensure(170)
  w.space(10)
  const placeDate = [input.signingPlace, fmtDate(input.signingDate)].filter(Boolean).join(', ')
  if (placeDate) {
    w.paragraph([seg(placeDate, body, { color: GRAY })])
    w.space(18)
  }

  // pdf-lib expects a plain Uint8Array (newer TypeScript rejects Node's Buffer here).
  const embedSignature = async (dataUrl: string | null) => {
    if (!dataUrl?.startsWith('data:image/png;base64,')) return null
    try {
      return await pdf.embedPng(new Uint8Array(Buffer.from(dataUrl.split(',')[1]!, 'base64')))
    } catch {
      return null
    }
  }
  const signatureImage = await embedSignature(input.signatureDataUrl)
  const managerSignatureImage = await embedSignature(input.managerSignatureDataUrl)

  const lineY = w.y - 64
  const leftX = MARGIN_X
  const rightX = MARGIN_X + colW + 24
  const page = w.page

  // Signature images above each line (employer left, employee right)
  const drawSignature = (img: typeof signatureImage, x: number) => {
    if (!img) return
    const scale = Math.min(colW / img.width, 58 / img.height)
    const iw = img.width * scale
    const ih = img.height * scale
    page.drawImage(img, { x: x + (colW - iw) / 2, y: lineY + 2, width: iw, height: ih })
  }
  drawSignature(managerSignatureImage, leftX)
  drawSignature(signatureImage, rightX)
  // BankID signatures have no drawn image — show a "Signed with BankID" mark instead.
  if (!signatureImage && input.employeeSigningMethod === 'bankid') {
    const markFont = fonts.get('helvetica', true)
    const text = L.signedWithBankId
    const tw = markFont.widthOfTextAtSize(text, 10)
    page.drawRectangle({
      x: rightX + (colW - tw) / 2 - 10,
      y: lineY + 12,
      width: tw + 20,
      height: 22,
      color: rgb(0.93, 0.95, 1),
      borderColor: rgb(0.75, 0.82, 0.95),
      borderWidth: 0.6,
    })
    page.drawText(text, {
      x: rightX + (colW - tw) / 2,
      y: lineY + 19,
      size: 10,
      font: markFont,
      color: rgb(0.1, 0.19, 0.39),
    })
  }
  for (const x of [leftX, rightX]) {
    page.drawLine({
      start: { x, y: lineY },
      end: { x: x + colW, y: lineY },
      thickness: 0.8,
      color: INK,
    })
  }
  w.y = lineY - 4
  const ySig = w.y
  w.paragraph([seg(L.employer, body, { bold: true })], { x: leftX, width: colW })
  w.paragraph(
    [
      seg([input.managerSignedByName, input.companyName].filter(Boolean).join(' — '), body, {
        size: body.size - 1,
      }),
    ],
    { x: leftX, width: colW },
  )
  w.paragraph(
    [
      seg(`${L.signedElectronically} ${fmtDateTime(input.managerSignedAt, lang)}`, body, {
        color: GRAY,
        size: 7.5,
      }),
    ],
    { x: leftX, width: colW },
  )
  const yAfterLeft = w.y
  w.page = page
  w.y = ySig
  w.paragraph([seg(L.employee, body, { bold: true })], { x: rightX, width: colW })
  w.paragraph([seg(input.signedByName || input.employeeName, body, { size: body.size - 1 })], {
    x: rightX,
    width: colW,
  })
  w.paragraph(
    [
      seg(`${L.signedElectronically} ${fmtDateTime(input.signedAt, lang)}`, body, {
        color: GRAY,
        size: 7.5,
      }),
    ],
    { x: rightX, width: colW },
  )
  w.y = Math.min(yAfterLeft, w.y)

  /* ── Signing certificate (own page) ── */
  w.newPage()
  w.paragraph([seg(L.certificate, heading, { size: clampSize(heading.size + 4) })], {
    lineHeight: 1.4,
  })
  w.paragraph([seg(L.certIntro, body, { color: GRAY })])
  w.space(14)

  const checksum = contractChecksum(input)
  const row = (label: string, value: string, mono = false) => {
    w.ensure(36)
    w.paragraph([seg(label.toUpperCase(), body, { size: 7.5, bold: true, color: GRAY })], {
      lineHeight: 1.6,
    })
    w.paragraph([
      mono
        ? { text: value || '—', font: fonts.get('courier'), size: 8.5, color: INK }
        : seg(value || '—', body),
    ])
    w.space(8)
  }
  row(L.contract, titleText)
  row(L.contractId, String(input.contractId))
  row(
    L.employer,
    [input.companyName, input.orgNumber && `${L.orgNo} ${input.orgNumber}`]
      .filter(Boolean)
      .join(', '),
  )
  row(L.checksum, checksum, true)
  w.paragraph([seg(L.checksumNote, body, { size: 8, color: GRAY })])

  // The two signers side by side: who, when, from where, and the signature itself.
  w.space(14)
  w.ensure(250)
  w.page.drawLine({
    start: { x: MARGIN_X, y: w.y },
    end: { x: W - MARGIN_X, y: w.y },
    thickness: 0.6,
    color: LIGHT_GRAY,
  })
  w.space(14)
  const certTop = w.y
  const certPage = w.page
  const signerColumn = (
    x: number,
    title: string,
    who: string,
    at: string,
    audit: { ip: string; userAgent: string },
    img: typeof signatureImage,
    method: string,
  ) => {
    w.page = certPage
    w.y = certTop
    const field = (label: string, value: string) => {
      w.paragraph([seg(label.toUpperCase(), body, { size: 7, bold: true, color: GRAY })], {
        x,
        width: colW,
        lineHeight: 1.5,
      })
      w.paragraph([seg(value || '—', body, { size: Math.min(body.size, 9.5) })], {
        x,
        width: colW,
        lineHeight: 1.35,
      })
      w.y -= 5
    }
    w.paragraph([seg(title, heading)], { x, width: colW, lineHeight: 1.6 })
    field(L.signedBy, who)
    field(L.method, method)
    field(L.signedAtLabel, fmtDateTime(at, lang))
    field(L.ip, audit.ip)
    field(L.device, audit.userAgent)
    if (img) {
      w.paragraph([seg(L.signature.toUpperCase(), body, { size: 7, bold: true, color: GRAY })], {
        x,
        width: colW,
        lineHeight: 1.5,
      })
      const scale = Math.min(colW / img.width, 50 / img.height)
      const ih = img.height * scale
      w.page.drawImage(img, { x, y: w.y - ih, width: img.width * scale, height: ih })
      w.y -= ih + 6
    }
    return w.y
  }
  const yEmployee = signerColumn(
    MARGIN_X,
    L.employee,
    input.signedByName || input.employeeName,
    input.signedAt,
    input.audit,
    signatureImage,
    input.employeeSigningMethod === 'bankid' ? L.methodBankId : L.methodValue,
  )
  const yEmployer = signerColumn(
    MARGIN_X + colW + 24,
    L.employer,
    [input.managerSignedByName, input.companyName].filter(Boolean).join(', '),
    input.managerSignedAt,
    input.managerAudit,
    managerSignatureImage,
    L.methodValue, // the manager always signs with the VeroCV signature
  )
  w.y = Math.min(yEmployee, yEmployer)

  /* ── Footer on every page ── */
  const footerFont = fonts.get('helvetica')
  const total = w.pages.length
  w.pages.forEach((p, i) => {
    const left = safeText(footerFont, `${titleText} · ${L.contractId} ${input.contractId}`).slice(
      0,
      95,
    )
    const right = `${L.page} ${i + 1} ${L.of} ${total}`
    p.drawLine({
      start: { x: MARGIN_X, y: 46 },
      end: { x: W - MARGIN_X, y: 46 },
      thickness: 0.5,
      color: LIGHT_GRAY,
    })
    p.drawText(left, { x: MARGIN_X, y: 34, size: 7.5, font: footerFont, color: GRAY })
    p.drawText(right, {
      x: W - MARGIN_X - footerFont.widthOfTextAtSize(right, 7.5),
      y: 34,
      size: 7.5,
      font: footerFont,
      color: GRAY,
    })
  })

  return pdf.save()
}

/* ─────────────────────────────────────────────
   Store / read in the "contract-pdfs" collection
───────────────────────────────────────────── */

/** Audit data saved in the "signed" / "manager_signed" history notes by the sign routes. */
function auditFromHistory(history: any[] = [], type: 'signed' | 'manager_signed') {
  const signed = [...history].reverse().find((h) => h?.type === type)
  const note: string = signed?.note ?? ''
  return {
    ip: note.match(/ip:([^;]*)/)?.[1]?.trim() || 'unknown',
    userAgent: note.match(/ua:(.*)$/)?.[1]?.trim() || 'unknown',
  }
}

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)

/**
 * Returns the fully signed PDF for a contract, creating and storing it first if it
 * doesn't exist yet. Returns null until BOTH the employee and the manager have signed.
 */
export async function ensureSignedPdf(
  payload: any,
  contractId: string | number,
): Promise<any | null> {
  const contract: any = await payload.findByID({
    collection: 'employee-contracts',
    id: contractId,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  })
  if (!contract?.signedAt || !contract?.managerSignedAt) return null

  // Reuse a stored PDF only if it was made AFTER the manager signed. An older one
  // (e.g. created when only the employee had signed) lacks the employer's signature,
  // so a new, complete PDF is generated instead.
  const existing = await payload.find({
    collection: 'contract-pdfs',
    where: { and: [{ contract: { equals: contractId } }, { kind: { equals: 'signed' } }] },
    sort: '-createdAt',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const latest = existing.docs[0]
  const content: any = (await findContractDocument(payload, contract.id)) ?? {}

  // ...and only if it already reflects the company logo: when a logo was added to the
  // contract after that PDF was made, a new PDF (with logo + watermark) is generated.
  const madeAt = latest ? new Date(latest.createdAt).getTime() : 0
  const logoAddedLater =
    !!content.companyLogo && new Date(content.updatedAt ?? 0).getTime() > madeAt
  if (latest && madeAt >= new Date(contract.managerSignedAt).getTime() && !logoAddedLater) {
    return latest
  }

  const bytes = await buildContractPdf({
    contractId: contract.id,
    title: contract.title ?? '',
    sections: content.sections ?? {},
    documentStyle: content.documentStyle ?? {},
    companyName: content.companyName ?? '',
    orgNumber: content.orgNumber ?? '',
    companyAddress: content.companyAddress ?? '',
    contactPerson: content.contactPerson ?? '',
    employeeName: contract.employeeName ?? '',
    personalNumber: content.personalNumber ?? '',
    employeeAddress: content.employeeAddress ?? '',
    signingPlace: content.signingPlace ?? '',
    signingDate: content.signingDate ?? null,
    signedAt: contract.signedAt,
    signedByName: contract.signedByName ?? '',
    signatureDataUrl: contract.signatureDataUrl ?? null,
    employeeSigningMethod: contract.bankIdSignedAt ? 'bankid' : 'verocv',
    audit: auditFromHistory(contract.history, 'signed'),
    managerSignedAt: contract.managerSignedAt,
    managerSignedByName: contract.managerSignedByName ?? '',
    managerSignatureDataUrl: contract.managerSignatureDataUrl ?? null,
    managerAudit: auditFromHistory(contract.history, 'manager_signed'),
    companyLogoDataUrl: content.companyLogo ?? null,
  })

  const buffer = Buffer.from(bytes)
  const name = `anstallningsavtal-${slug(contract.employeeName || 'kontrakt') || 'kontrakt'}-${contract.id}-signerat.pdf`

  return payload.create({
    collection: 'contract-pdfs',
    data: {
      contract: contract.id,
      kind: 'signed',
      manager: relId(contract.manager),
      employee: relId(contract.employee),
    },
    file: { data: buffer, mimetype: 'application/pdf', name, size: buffer.length },
    overrideAccess: true,
  })
}

/** Reads a stored PDF file (local disk, or an absolute URL from a storage adapter). */
export async function readPdfFile(doc: {
  filename?: string | null
  url?: string | null
}): Promise<Buffer | null> {
  if (doc.filename) {
    try {
      return await readFile(path.join(CONTRACT_PDFS_DIR, path.basename(doc.filename)))
    } catch {
      // fall through
    }
  }
  if (doc.url && /^https?:\/\//i.test(doc.url)) {
    const res = await fetch(doc.url)
    if (res.ok) return Buffer.from(await res.arrayBuffer())
  }
  return null
}
