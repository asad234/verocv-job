import { NextResponse } from "next/server"
import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { OpenAIResumeSchema } from "./schema"
import { posthogServer } from "@/lib/posthogServer"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const runtime     = "nodejs"
export const maxDuration = 60

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://verocv.se",
  "https://job-portal-website-ten.vercel.app",
]

const MAX_TEXT_LENGTH = 6_000

// ── Rate limiter ──────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(ip: string, limit = 10, windowMs = 60_000): boolean {
  const now   = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

function createCorsJsonResponse(body: object, request: Request, status = 200) {
  const res    = NextResponse.json(body, { status })
  const origin = request.headers.get("origin") || ""
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin)
  }
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, x-internal-secret")
  return res
}

export async function OPTIONS(request: Request) {
  const origin  = request.headers.get("origin") || ""
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-internal-secret",
  }
  if (ALLOWED_ORIGINS.includes(origin)) headers["Access-Control-Allow-Origin"] = origin
  return new Response(null, { status: 204, headers })
}

const SYSTEM_PROMPT = `
You are an expert resume parser with 10+ years of experience in HR and recruitment.
Your task is to extract structured data from resume text with maximum accuracy and completeness.

━━━ EXTRACTION RULES ━━━

COMPLETENESS (most important):
- Extract EVERY piece of information — never skip or drop content
- If unsure which section something belongs to, place it in the closest match
- Descriptions must contain the FULL text — never truncate or summarize
- Preserve all bullet points, numbers, percentages, and technical terms

ACCURACY:
- Copy text EXACTLY as written — do not paraphrase, rewrite, or "improve"
- Preserve original capitalization, punctuation, and formatting
- Do not infer, assume, or hallucinate any information
- If a field is genuinely absent, omit it — never invent placeholder values

DATES:
- Use ISO format: YYYY-MM-DD when full date known, YYYY-MM when only month/year, YYYY when only year
- If a role says "Present", "Current", "Now" or similar → set ongoing/isCurrent = true, omit endDate
- If no dates at all → omit startDate and endDate entirely

DESCRIPTIONS:
- Join multiple bullet points with \n (newline) as separator
- Keep ALL original bullet text — do not summarize
- Include responsibilities, technologies, outcomes, and metrics

━━━ SECTION MAPPING ━━━

personalInfo:
  firstName, lastName         → from name at top of resume
  title                       → current job title or headline
  professionalPresentation    → professional summary / objective / about section (full text)
  personalPresentation        → personal statement if separate from professional summary
  phoneNumber, privateEmail   → contact details
  homeAddress                 → full address if present
  companyType                 → preferred company type if mentioned (startup, enterprise etc.)

experience (work history):
  employer     → company / organization name
  title        → exact job title
  description  → full role description with ALL bullet points joined by \n
  achievements → ONLY if there is a clearly separate "Achievements" subsection
  ongoing      → true if currently employed there
  startDate, endDate → ISO format

projects (freelance / consulting / side projects / assignments):
  role        → role or title within the project
  company     → client or organization if mentioned
  description → full project description
  skills      → comma-separated list of technologies/tools used
  isCurrent   → true if ongoing

education:
  school   → institution name
  program  → degree / program name
  level    → e.g. "Bachelor's Degree", "Master's Degree", "High School", "Bootcamp", translate from given text when possible to match these standard levels correctly.
  place    → city, country
  description → any extra info (thesis, GPA, honors)
  ongoing  → true if currently studying

skills:
  skillName            → individual skill name (one per entry)
  skillRating          → 1–5 if explicitly stated, otherwise 1 if listed among other skills without details
  skillYearsExperience → number of years if explicitly stated, otherwise 1 year if mentioned as "experienced", "proficient" etc., otherwise 1 if listed among other skills without details

certifications:
  type      → "certificate" or "course"
  title     → exact certification name
  issuer    → issuing organization
  code      → certification ID / credential number if present
  startDate → date earned
  validDate → expiry date if present
  noExpiry  → true if explicitly stated as non-expiring

languages:
  language → language name
  level    → one of: Native, Fluent, Advanced, Intermediate, Basic
             Map common equivalents: "mother tongue" → Native, "professional" → Fluent,
             "conversational" → Intermediate, "basic knowledge" → Basic

references:
  Extract ONLY if explicitly listed with contact details
  Do not infer references from other sections

━━━ OUTPUT ━━━
Return valid JSON matching the schema exactly. Nothing else.
`.trim()

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    // ── Auth (disabled) ───────────────────────────────────────────────────────
    // const secret = request.headers.get("x-internal-secret")
    // if (secret !== process.env.INTERNAL_API_SECRET) {
    //   return createCorsJsonResponse({ error: "Unauthorized" }, request, 401)
    // }

    // ── Rate limit ────────────────────────────────────────────────────────────
    const ip = request.headers.get("x-forwarded-for") ?? "unknown"
    if (!checkRateLimit(ip)) {
      return createCorsJsonResponse(
        { error: "Too many requests. Please wait a minute." },
        request,
        429
      )
    }

    // ── Validate + truncate input ─────────────────────────────────────────────
    const { extractedText } = await request.json()

    if (!extractedText || typeof extractedText !== "string" || !extractedText.trim()) {
      return createCorsJsonResponse({ error: "Invalid or empty resume text" }, request, 400)
    }

    // Hard truncate — covers any real resume, keeps OpenAI fast
    const trimmedText = extractedText.slice(0, MAX_TEXT_LENGTH)

    console.log("Text length sent to OpenAI:", trimmedText.length, "chars")
    console.log("Text preview:", trimmedText.slice(0, 200))

    // ── Stream OpenAI ─────────────────────────────────────────────────────────
    const stream = openai.beta.chat.completions.stream({
      model:           "gpt-4o-mini",
      temperature:     0,
      max_tokens:      4000,
      response_format: zodResponseFormat(OpenAIResumeSchema, "resume"),
      messages: [
        {
          role:    "system",
          content: SYSTEM_PROMPT,
        },
        {
          role:    "user",
          content: `Please extract all structured data from the following resume:\n\n${trimmedText}`,
        },
      ],
    })

    const completion = await Promise.race([
      stream.finalChatCompletion(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("OpenAI request timed out after 55s")),
          process.env.NODE_ENV === "development" ? 120_000 : 55_000
        )
      ),
    ])

    const rawOutput = completion.choices[0]?.message.parsed
    if (!rawOutput) throw new Error("The resume parser did not return any data.")

    // ── Inject UUIDs ──────────────────────────────────────────────────────────
    const data = {
      ...rawOutput,
      projects:       (rawOutput.projects       ?? []).map(i => ({ ...i, id: crypto.randomUUID() })),
      skills:         (rawOutput.skills         ?? []).map(i => ({ ...i, id: crypto.randomUUID() })),
      references:     (rawOutput.references     ?? []).map(i => ({ ...i, id: crypto.randomUUID() })),
      certifications: (rawOutput.certifications ?? []).map(i => ({ ...i, id: crypto.randomUUID() })),
      experience:     (rawOutput.experience     ?? []).map(i => ({ ...i, id: crypto.randomUUID() })),
      education:      (rawOutput.education      ?? []).map(i => ({ ...i, id: crypto.randomUUID() })),
      languages:      (rawOutput.languages      ?? []).map(i => ({ ...i, id: crypto.randomUUID() })),
    }

    await posthogServer.capture({
      distinctId: "anonymous",
      event:      "resume_parse_success",
      properties: { durationMs: Date.now() - startTime, timestamp: new Date().toISOString() },
    })
    await posthogServer.shutdown()

    return createCorsJsonResponse({ success: true, data }, request)

  } catch (error: any) {
    console.error("extract-profile error:", error)

    await posthogServer.capture({
      distinctId: "server_error",
      event:      "resume_parse_error",
      properties: { message: error.message, timestamp: new Date().toISOString() },
    })
    await posthogServer.shutdown()

    return createCorsJsonResponse(
      { error: error.message || "Unknown error", solution: "Please try again later" },
      request,
      500
    )
  }
}