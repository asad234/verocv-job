// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/contract-templates/route.ts
// URL:            GET · POST  /api/company/managers/contract-templates
// WHAT IT DOES:   Manager: list own reference files / contract templates (GET),
//                 upload a new one (POST, multipart: file + optional notes).
//
// If your app folder has no "(frontend)" group, use the same path without it:
//   src/app/api/company/managers/contract-templates/route.ts
// (Folders in parentheses don't change the URL.)
// ══════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireManagerId } from '@/utils/server/Contractaccess'

export const runtime = 'nodejs'

const MAX_FILE_BYTES = 8 * 1024 * 1024
const ALLOWED = new Map([
  ['application/pdf', '.pdf'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
  ['application/msword', '.doc'],
])

/** What the browser gets for each file (the download link goes through our own route). */
function toTemplateDto(doc: any) {
  return {
    id: String(doc.id),
    name: doc.filename ?? '',
    sizeBytes: doc.filesize ?? 0,
    mimeType: doc.mimeType ?? 'application/pdf',
    uploadedAt: doc.createdAt ?? null,
    notes: doc.notes ?? null,
    url: `/api/company/managers/contract-templates/${doc.id}`,
  }
}

// GET — the logged-in manager's own reference files, newest first.
export async function GET(req: NextRequest) {
  try {
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'contract-templates',
      where: { owner: { equals: managerId } },
      sort: '-createdAt',
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })

    return NextResponse.json({ data: result.docs.map(toTemplateDto) }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to list contract templates:', error)
    return NextResponse.json({ message: 'Failed to load reference files' }, { status: 500 })
  }
}

// POST — upload a reference file. multipart/form-data: file (required), notes (optional)
export async function POST(req: NextRequest) {
  try {
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const form = await req.formData().catch(() => null)
    const file = form?.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ message: 'Choose a file to upload' }, { status: 400 })
    }

    const name = (file.name || 'template').slice(0, 200)
    const lower = name.toLowerCase()
    const mimetype =
      file.type && ALLOWED.has(file.type)
        ? file.type
        : lower.endsWith('.pdf')
          ? 'application/pdf'
          : lower.endsWith('.docx')
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : lower.endsWith('.doc')
              ? 'application/msword'
              : ''
    if (!mimetype) {
      return NextResponse.json(
        { message: 'Only PDF and Word files can be uploaded' },
        { status: 415 },
      )
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ message: 'The file is larger than 8 MB' }, { status: 413 })
    }

    const notesRaw = form?.get('notes')
    const notes =
      typeof notesRaw === 'string' && notesRaw.trim() ? notesRaw.trim().slice(0, 2000) : null

    const payload = await getPayload({ config })
    const buffer = Buffer.from(await file.arrayBuffer())

    const doc = await payload.create({
      collection: 'contract-templates',
      data: { owner: managerId, notes } as any,
      file: { data: buffer, mimetype, name, size: buffer.length },
      overrideAccess: true,
    })

    return NextResponse.json({ data: toTemplateDto(doc) }, { status: 201 })
  } catch (error) {
    console.error('❌ Failed to upload contract template:', error)
    return NextResponse.json({ message: 'Failed to upload the file' }, { status: 500 })
  }
}
