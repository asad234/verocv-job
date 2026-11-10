import { NextResponse } from "next/server"
import pdfParse from "pdf-parse"
import mammoth from "mammoth"

export const runtime = "nodejs"
export const maxDuration = 60

const MAX_TEXT_CHARS = 6000

function setCorsHeaders(res: NextResponse, request: Request) {
  const origin = request.headers.get("origin") || ""

  if (
    origin.includes("localhost") ||
    origin.includes("vercel.app") ||
    origin === "https://verocv.se"
  ) {
    res.headers.set("Access-Control-Allow-Origin", origin)
  }

  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, x-internal-secret"
  )

  return res
}

export async function OPTIONS(request: Request) {
  const res = new NextResponse(null, { status: 204 })
  return setCorsHeaders(res, request)
}

export async function POST(request: Request) {
  try {
    // ── Auth (disabled) ───────────────────────────────────────────────────────
    // const secret = request.headers.get("x-internal-secret")
    // if (process.env.INTERNAL_API_SECRET) {
    //   if (secret !== process.env.INTERNAL_API_SECRET) {
    //     return setCorsHeaders(
    //       NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    //       request
    //     )
    //   }
    // }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return setCorsHeaders(
        NextResponse.json({ error: "No file provided" }, { status: 400 }),
        request
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name.toLowerCase()

    let text = ""

    if (fileName.endsWith(".pdf")) {
      const result = await pdfParse(buffer)
      text = result.text
    } else if (fileName.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else {
      return setCorsHeaders(
        NextResponse.json(
          { error: "Only PDF and DOCX are supported" },
          { status: 400 }
        ),
        request
      )
    }

    if (!text || !text.trim()) {
      return setCorsHeaders(
        NextResponse.json(
          { error: "No readable text found (maybe scanned PDF)" },
          { status: 422 }
        ),
        request
      )
    }

    const trimmedText = text.trim().slice(0, MAX_TEXT_CHARS)

    return setCorsHeaders(
      NextResponse.json({
        success: true,
        text: trimmedText,
        length: trimmedText.length,
      }),
      request
    )
  } catch (error: any) {
    console.error("❌ extract error:", error)

    return setCorsHeaders(
      NextResponse.json(
        {
          error: "Extraction failed",
          details: error?.message || "Unknown error",
        },
        { status: 500 }
      ),
      request
    )
  }
}