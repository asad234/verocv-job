import { NextRequest, NextResponse } from 'next/server'
import {
  S3Client,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/authOptions'

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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { uploadId, key, publicUrl, parts } = await req.json()

    if (!uploadId || !key || !parts?.length) {
      return NextResponse.json({ error: 'uploadId, key and parts are required' }, { status: 400 })
    }

    // 1. Tell S3 to assemble the parts
    try {
      await s3.send(
        new CompleteMultipartUploadCommand({
          Bucket: BUCKET,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: {
            Parts: parts.map((p: { PartNumber: number; ETag: string }) => ({
              PartNumber: p.PartNumber,
              ETag: p.ETag,
            })),
          },
        }),
      )
    } catch (err) {
      await s3
        .send(new AbortMultipartUploadCommand({ Bucket: BUCKET, Key: key, UploadId: uploadId }))
        .catch(() => {})
      throw err
    }

    // 2. File is already in S3 — return the URL directly
    return NextResponse.json({ id: `s3-${Date.now()}`, url: publicUrl }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/presign/complete]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
