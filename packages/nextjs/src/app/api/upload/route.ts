import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { requireAuth } from '@/lib/middleware'
import { apiRatelimit } from '@/lib/ratelimit'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const EXT_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
  },
})

export const POST = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const formData = await req.formData().catch(() => null)
    if (!formData) {
      return NextResponse.json({ error: 'INVALID_FORM_DATA' }, { status: 400 })
    }

    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'NO_FILE' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'INVALID_FILE_TYPE', detail: 'Only JPEG, PNG and WebP are allowed.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'FILE_TOO_LARGE', detail: 'Max file size is 5 MB.' },
        { status: 400 }
      )
    }

    const ext = EXT_MAP[file.type]
    const key = `uploads/${crypto.randomUUID()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    // Validate magic bytes — client-supplied Content-Type is untrustworthy
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8
    const isPng  = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
    const isWebp = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46
                && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    if (!isJpeg && !isPng && !isWebp) {
      return NextResponse.json({ error: 'INVALID_FILE_CONTENT' }, { status: 400 })
    }

    await s3.send(new PutObjectCommand({
      Bucket:      process.env.CLOUDFLARE_R2_BUCKET!,
      Key:         key,
      Body:        buffer,
      ContentType: file.type,
    }))

    const url = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`
    return NextResponse.json({ data: { url } }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/upload]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
