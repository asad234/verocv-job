// lib/detectMissingFields.ts

interface MissingField   { field: string; label: string }
interface CategoryIssues { category: string; icon: string; items: { name: string; missing: MissingField[] }[] }

// Values that count as "missing" — OpenAI often fills these instead of leaving blank
const EMPTY_VALUES = [
  "", "n/a", "na", "none", "unknown", "not specified", "not provided",
  "no description", "no description provided", "untitled", "-", "—",
]

function isEmpty(val: any): boolean {
  if (val === null || val === undefined) return true
  if (typeof val === "string") return EMPTY_VALUES.includes(val.trim().toLowerCase())
  return false
}

export function detectMissingFields(resume: any): CategoryIssues[] {
  console.log("detectMissingFields input:", resume)
  const issues: CategoryIssues[] = []

  // ── Experience ─────────────────────────────────────────────────────────────
  const expIssues = (resume.experience ?? []).flatMap((e: any, i: number) => {
    const missing: MissingField[] = []
    if (isEmpty(e.employer))    missing.push({ field: "employer",    label: "company name" })
    if (isEmpty(e.title))       missing.push({ field: "title",       label: "job title" })
    if (isEmpty(e.description)) missing.push({ field: "description", label: "description" })
    if (isEmpty(e.startDate))   missing.push({ field: "startDate",   label: "start date" })
    return missing.length ? [{ name: e.employer || `Experience ${i + 1}`, missing }] : []
  })
  if (expIssues.length) issues.push({ category: "Experience", icon: "💼", items: expIssues })

  // ── Education ──────────────────────────────────────────────────────────────
  const eduIssues = (resume.education ?? []).flatMap((e: any, i: number) => {
    const missing: MissingField[] = []
    if (isEmpty(e.school))    missing.push({ field: "school",    label: "institution" })
    if (isEmpty(e.program))   missing.push({ field: "program",   label: "program" })
    if (isEmpty(e.level))     missing.push({ field: "level",     label: "degree level" })
    if (isEmpty(e.place))     missing.push({ field: "place",     label: "location" })
    if (isEmpty(e.startDate)) missing.push({ field: "startDate", label: "start date" })
    return missing.length ? [{ name: e.school || `Education ${i + 1}`, missing }] : []
  })
  if (eduIssues.length) issues.push({ category: "Education", icon: "🎓", items: eduIssues })

  // ── Projects ───────────────────────────────────────────────────────────────
  const projIssues = (resume.projects ?? []).flatMap((p: any, i: number) => {
    const missing: MissingField[] = []
    if (isEmpty(p.role))        missing.push({ field: "role",        label: "role" })
    if (isEmpty(p.description)) missing.push({ field: "description", label: "description" })
    if (isEmpty(p.startDate))   missing.push({ field: "startDate",   label: "start date" })
    return missing.length ? [{ name: p.role || `Project ${i + 1}`, missing }] : []
  })
  if (projIssues.length) issues.push({ category: "Projects", icon: "🗂️", items: projIssues })

  // ── Skills ─────────────────────────────────────────────────────────────────
  const skillIssues = (resume.skills ?? []).flatMap((s: any, i: number) => {
    const missing: MissingField[] = []
    if (isEmpty(s.skillName)) missing.push({ field: "skillName", label: "skill name" })
    return missing.length ? [{ name: s.skillName || `Skill ${i + 1}`, missing }] : []
  })
  if (skillIssues.length) issues.push({ category: "Skills", icon: "⚡", items: skillIssues })

  // ── Certifications ─────────────────────────────────────────────────────────
  const certIssues = (resume.certifications ?? []).flatMap((c: any, i: number) => {
    const missing: MissingField[] = []
    if (isEmpty(c.title))     missing.push({ field: "title",     label: "title" })
    if (isEmpty(c.issuer))    missing.push({ field: "issuer",    label: "issuer" })
    if (isEmpty(c.startDate)) missing.push({ field: "startDate", label: "date earned" })
    return missing.length ? [{ name: c.title || `Certification ${i + 1}`, missing }] : []
  })
  if (certIssues.length) issues.push({ category: "Certifications", icon: "📜", items: certIssues })

  // ── Languages ──────────────────────────────────────────────────────────────
  const langIssues = (resume.languages ?? []).flatMap((l: any, i: number) => {
    const missing: MissingField[] = []
    if (isEmpty(l.language)) missing.push({ field: "language", label: "language name" })
    if (isEmpty(l.level))    missing.push({ field: "level",    label: "level" })
    return missing.length ? [{ name: l.language || `Language ${i + 1}`, missing }] : []
  })
  if (langIssues.length) issues.push({ category: "Languages", icon: "🌐", items: langIssues })

  console.log("detectMissingFields result:", issues)
  return issues
}