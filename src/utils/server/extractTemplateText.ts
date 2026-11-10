/* ═════════════════════════════════════════════════════════════
   SERVER ONLY — reads an uploaded contract template (PDF / DOCX)
   and returns its plain text for the AI.
   Requires:  pnpm add unpdf mammoth
═════════════════════════════════════════════════════════════ */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import mammoth from 'mammoth'
import { extractText, getDocumentProxy } from 'unpdf'
import { CONTRACT_TEMPLATES_DIR } from '@/collections/ContractTemplates'

/** ~15k tokens — plenty for a contract, keeps cost and latency predictable. */
export const MAX_TEMPLATE_CHARS = 60_000
const MIN_TEMPLATE_CHARS = 200

export class TemplateReadError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = 'TemplateReadError'
  }
}

interface TemplateDoc {
  filename?: string | null
  mimeType?: string | null
  url?: string | null
}

async function readTemplateBuffer(doc: TemplateDoc): Promise<Buffer> {
  // 1. Local disk storage (Payload default)
  if (doc.filename) {
    try {
      return await readFile(path.join(CONTRACT_TEMPLATES_DIR, path.basename(doc.filename)))
    } catch {
      // fall through to remote storage
    }
  }
  // 2. Cloud storage adapters (S3, Vercel Blob…) expose an absolute URL
  if (doc.url && /^https?:\/\//i.test(doc.url)) {
    const res = await fetch(doc.url)
    if (res.ok) return Buffer.from(await res.arrayBuffer())
  }
  throw new TemplateReadError('The template file could not be found in storage.', 404)
}

function normalize(text: string) {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Largest PDF sent to the AI as a file when its text can't be extracted. */
const MAX_PDF_ATTACHMENT_BYTES = 20 * 1024 * 1024

/** What the AI receives for one template: its text, or the PDF file itself. */
export type TemplateForAi =
  | { name: string; kind: 'text'; text: string }
  | { name: string; kind: 'pdf'; dataUrl: string }

function classify(doc: TemplateDoc) {
  const mime = (doc.mimeType ?? '').toLowerCase()
  const name = (doc.filename ?? '').toLowerCase()
  const isPdf = mime === 'application/pdf' || name.endsWith('.pdf')
  const isDocx =
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  const isOldDoc = mime === 'application/msword' || name.endsWith('.doc')

  if (isOldDoc && !isDocx) {
    throw new TemplateReadError(
      'Old Word files (.doc) cannot be read. Save the template as .docx or PDF and upload it again.',
      422,
    )
  }
  if (!isPdf && !isDocx) {
    throw new TemplateReadError('Unsupported template format. Use PDF or DOCX.', 422)
  }
  return { isPdf, isDocx }
}

const shorten = (text: string, maxChars: number) =>
  text.length > maxChars ? `${text.slice(0, maxChars)}\n[… the template was shortened …]` : text

/**
 * pdf.js refuses to run when something has added an *enumerable* property to
 * Array.prototype (e.g. `Array.prototype.random = function () {…}`), because that
 * breaks `for…in` loops over arrays. Such additions are turned non-enumerable here:
 * they keep working exactly as before, they just no longer show up in `for…in`.
 */
function hideEnumerableArrayExtensions() {
  for (const key in Array.prototype) {
    const desc = Object.getOwnPropertyDescriptor(Array.prototype, key)
    if (desc?.enumerable && desc.configurable) {
      Object.defineProperty(Array.prototype, key, { ...desc, enumerable: false })
    }
  }
}

/** Extracts the text of a PDF. Returns '' (and logs why) when that fails. */
async function pdfText(buffer: Buffer, filename: string): Promise<string> {
  try {
    hideEnumerableArrayExtensions()
    const pdf = await getDocumentProxy(new Uint8Array(buffer))
    const result = await extractText(pdf, { mergePages: true })
    return normalize(Array.isArray(result.text) ? result.text.join('\n') : result.text)
  } catch (err) {
    console.error(`⚠️ Could not extract text from PDF "${filename}":`, err)
    return ''
  }
}

/**
 * Loads one template for the AI.
 * - DOCX → its text.
 * - PDF with readable text → its text.
 * - PDF whose text can't be extracted (scanned, form-based, or the PDF library
 *   failing on the server) → the PDF file itself, which GPT-4o can read directly.
 */
export async function loadTemplateForAi(
  doc: TemplateDoc,
  maxChars: number = MAX_TEMPLATE_CHARS,
): Promise<TemplateForAi> {
  const name = doc.filename ?? 'template'
  const { isPdf } = classify(doc)
  const buffer = await readTemplateBuffer(doc)

  if (isPdf) {
    const text = await pdfText(buffer, name)
    if (text.length >= MIN_TEMPLATE_CHARS)
      return { name, kind: 'text', text: shorten(text, maxChars) }

    if (buffer.length > MAX_PDF_ATTACHMENT_BYTES) {
      throw new TemplateReadError(
        'No readable text was found in this PDF, and it is too large to send to the AI as a file. Upload a smaller PDF or a DOCX.',
        422,
      )
    }
    if (!buffer.subarray(0, 5).toString('latin1').startsWith('%PDF')) {
      throw new TemplateReadError(
        'This file is not a valid PDF. Upload it again or save it as DOCX.',
        422,
      )
    }
    return {
      name,
      kind: 'pdf',
      dataUrl: `data:application/pdf;base64,${buffer.toString('base64')}`,
    }
  }

  // DOCX
  let text = ''
  try {
    text = normalize((await mammoth.extractRawText({ buffer })).value)
  } catch (err) {
    console.error(`⚠️ Could not read DOCX "${name}":`, err)
    throw new TemplateReadError(
      'The Word file could not be read. Open it in Word, save it again as .docx and re-upload it.',
      422,
    )
  }
  if (text.length < MIN_TEMPLATE_CHARS) {
    throw new TemplateReadError('No readable text was found in this Word file.', 422)
  }
  return { name, kind: 'text', text: shorten(text, maxChars) }
}

/** Text-only version (kept for other callers). Throws when no text can be extracted. */
export async function extractTemplateText(
  doc: TemplateDoc,
  maxChars: number = MAX_TEMPLATE_CHARS,
): Promise<string> {
  const t = await loadTemplateForAi(doc, maxChars)
  if (t.kind === 'text') return t.text
  throw new TemplateReadError(
    'No readable text was found in the template. Upload a text-based PDF or DOCX.',
    422,
  )
}
