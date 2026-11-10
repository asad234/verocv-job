// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/app/(frontend)/api/company/managers/contract-templates/[id]/route.ts
// URL:            GET · DELETE  /api/company/managers/contract-templates/:id
// WHAT IT DOES:   Manager: open/download one of own reference files (GET — add
//                 ?download=1 to download instead of opening), or delete it (DELETE).
//
// If your app folder has no "(frontend)" group, use the same path without it:
//   src/app/api/company/managers/contract-templates/[id]/route.ts
// (Folders in parentheses don't change the URL. "[id]" is a real folder name.)
// ══════════════════════════════════════════════════════════════════════

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { relId, requireManagerId } from '@/utils/server/Contractaccess'
import { CONTRACT_TEMPLATES_DIR } from '@/collections/ContractTemplates'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

async function loadOwnTemplate(payload: any, id: string, managerId: number) {
  const doc = await payload.findByID({
    collection: 'contract-templates',
    id,
    depth: 0,
    overrideAccess: true,
    disableErrors: true,
  })
  if (!doc || Number(relId(doc.owner)) !== managerId) return null
  return doc
}

async function readTemplateFile(doc: any): Promise<Buffer | null> {
  if (doc.filename) {
    try {
      return await readFile(path.join(CONTRACT_TEMPLATES_DIR, path.basename(doc.filename)))
    } catch {
      // fall through to remote storage
    }
  }
  if (doc.url && /^https?:\/\//i.test(doc.url)) {
    const res = await fetch(doc.url)
    if (res.ok) return Buffer.from(await res.arrayBuffer())
  }
  return null
}

// GET — stream the file (inline by default, ?download=1 to download).
export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const payload = await getPayload({ config })
    const doc = await loadOwnTemplate(payload, id, managerId)
    if (!doc) return NextResponse.json({ message: 'File not found' }, { status: 404 })

    const file = await readTemplateFile(doc)
    if (!file)
      return NextResponse.json(
        { message: 'The file could not be found in storage' },
        { status: 404 },
      )

    const download = req.nextUrl.searchParams.get('download') === '1'
    const safeName = (doc.filename ?? `template-${doc.id}`).replace(/"/g, '')
    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: {
        'Content-Type': doc.mimeType || 'application/octet-stream',
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${safeName}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('❌ Failed to read contract template:', error)
    return NextResponse.json({ message: 'Failed to open the file' }, { status: 500 })
  }
}

// DELETE — remove one of the manager's own reference files.
export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const managerId = await requireManagerId(req)
    if (managerId === null) return NextResponse.json({ message: 'Not authorized' }, { status: 403 })

    const payload = await getPayload({ config })
    const doc = await loadOwnTemplate(payload, id, managerId)
    if (!doc) return NextResponse.json({ message: 'File not found' }, { status: 404 })

    await payload.delete({ collection: 'contract-templates', id: doc.id, overrideAccess: true })
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('❌ Failed to delete contract template:', error)
    return NextResponse.json({ message: 'Failed to delete the file' }, { status: 500 })
  }
}
