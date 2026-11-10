import { NextRequest, NextResponse } from 'next/server'
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/authOptions'

// ─── Sanitize filename for S3 ────────────────────────────────────────────────
function sanitizeKey(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  const base = lastDot > 0 ? filename.slice(0, lastDot) : filename
  const ext = lastDot > 0 ? filename.slice(lastDot).toLowerCase() : ''
  const safe =
    base
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '') || 'file'
  return `${safe}${ext}`
}

const s3 = new S3Client({
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  region: process.env.S3_REGION,
  endpoint: process.env.S3_ENDPOINT,
})

const BUCKET = process.env.S3_BUCKET!
const PREFIX = 'media'
const PART_SIZE = 5 * 1024 * 1024 // 5 MB — minimum S3 part size

// ─── POST /api/presign ────────────────────────────────────────────────────────
// Initiates a multipart upload and returns one presigned URL per part.
// The browser uploads each part directly to S3, then calls /api/presign/complete.

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { filename, mimeType, fileSize } = await req.json()
    if (!filename || !mimeType || !fileSize) {
      return NextResponse.json(
        { error: 'filename, mimeType and fileSize are required' },
        { status: 400 },
      )
    }

    const safeName = sanitizeKey(filename)
    const timestamp = Date.now()
    const key = `${PREFIX}/${timestamp}-${safeName}`

    // 1. Initiate the multipart upload
    const create = await s3.send(
      new CreateMultipartUploadCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: mimeType,
      }),
    )
    const uploadId = create.UploadId!

    // 2. Generate one presigned URL per part
    const partCount = Math.ceil(fileSize / PART_SIZE)
    const partUrls: string[] = []
    for (let i = 0; i < partCount; i++) {
      const url = await getSignedUrl(
        s3,
        new UploadPartCommand({
          Bucket: BUCKET,
          Key: key,
          UploadId: uploadId,
          PartNumber: i + 1,
        }),
        { expiresIn: 3600 }, // 1 hour — large files may take a while
      )
      partUrls.push(url)
    }

    const endpoint = process.env.S3_ENDPOINT?.replace(/\/$/, '') ?? ''
    const publicUrl = `${endpoint}/${BUCKET}/${key}`

    return NextResponse.json(
      { uploadId, key, publicUrl, safeName, partUrls, partSize: PART_SIZE },
      { status: 200 },
    )
  } catch (err) {
    console.error('[POST /api/presign]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
