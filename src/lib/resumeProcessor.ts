const API_BASE        = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3000"
const INTERNAL_SECRET = process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? ""

const MAX_CHARS = 6_000

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/page \d+ of \d+/gi, "")
    .replace(/^\s*\d+\s*$/gm, "")          // lone page numbers
    .replace(/curriculum vitae/gi, "")
    .replace(/^(.+)\n(?:\1\n){2,}/gm, "$1\n") // repeated lines
    .replace(/https?:\/\/[^\s]+/g, "")     // URLs
    .replace(/[\w.-]+@[\w.-]+\.\w+/g, "")  // emails (parsed separately)
    .replace(/^[=\-_*•·|\\/#]{2,}$/gm, "") // separator lines
    .replace(/^[\s.,;:!?]{2,}$/gm, "")     // punctuation-only lines
    .trim()
    .slice(0, MAX_CHARS)
}

function detectAndFormatSections(text: string): string {
  const sectionHeaders = [
    "experience", "work experience", "employment", "career history",
    "education", "academic", "qualifications",
    "skills", "technical skills", "competencies", "expertise",
    "projects", "assignments", "consulting",
    "certifications", "certificates", "courses",
    "languages", "references",
    "summary", "profile", "objective", "about",
    "achievements", "accomplishments",
  ]
  const headerPattern = new RegExp(`^(${sectionHeaders.join("|")})[:\\s]*$`, "gim")
  return text.replace(headerPattern, (match) => `\n\n=== ${match.trim().toUpperCase()} ===\n`)
}

function formatForLLM(text: string): string {
  return `=== RESUME START ===\n\n${detectAndFormatSections(text)}\n\n=== RESUME END ===`
}

export type SupportedFileType = "pdf" | "docx" | "doc"

export function getFileType(file: File): SupportedFileType | null {
  const name = file.name.toLowerCase()
  if (file.type === "application/pdf"                                                          || name.endsWith(".pdf"))  return "pdf"
  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || name.endsWith(".docx")) return "docx"
  if (file.type === "application/msword" || file.type === "application/x-msword"             || name.endsWith(".doc"))  return "doc"
  return null
}

export async function processResumeFile(file: File): Promise<string> {
  const fileType = getFileType(file)
  if (!fileType) throw new Error("Unsupported file type. Please upload a PDF, DOCX, or DOC file.")

  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${API_BASE}/api/extract-text`, {
    method:  "POST",
    headers: { "x-internal-secret": INTERNAL_SECRET },
    body:    formData,
  })

  const data = await res.json()
  if (!res.ok || !data.success) throw new Error(data?.error || "Failed to extract text from file")

  // Clean and format the already-trimmed text from the server
  return formatForLLM(cleanText(data.text))
}

export async function sendToExtractionAPI(extractedText: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/extract-profile`, {
    method:  "POST",
    headers: {
      "Content-Type":      "application/json",
      "x-internal-secret": INTERNAL_SECRET,
    },
    body: JSON.stringify({ extractedText }),
  })

  const data = await res.json()
  if (!res.ok)       throw new Error(data?.error || "API error")
  if (!data.success) throw new Error(data?.error || "Extraction failed")
  return data.data
}