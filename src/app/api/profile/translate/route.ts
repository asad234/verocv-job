// app/api/profile/translate/route.ts

import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/authOptions'
import { getPayload } from 'payload'
import config from '@payload-config'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ─── Fields never translated ──────────────────────────────────────────────────

const SKIP_KEYS = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'user',
  'firstName',
  'lastName',
  'privateEmail',
  'workEmail',
  'recoveryEmail',
  'phoneNumber',
  'workPhoneNumber',
  'homeAddress',
  'dateOfBirth',
  'gender',
  'startDate',
  'endDate',
  'validDate',
  'completionDate',
  'isCurrent',
  'ongoing',
  'noExpiry',
  'privateEmailVerified',
  'recoveryEmailVerified',
  'privateEmailVerificationToken',
  'recoveryEmailVerificationToken',
  'verificationEmailsSentAt',
  'profileReminderSent',
  'profileReminderSentAt',
  'link',
  'projectUrl',
  'code',
  'emailNotifications',
  'pushNotifications',
  'smsNotifications',
  'skillRating',
  'skillYearsExperience',
  'type',
  'profileImage',
  'uploadImage',
  'staticImage',
  'linkedIn',
  'x',
  'gitHub',
  'website',
])

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface TranslationPair {
  path: string
  text: string
}

function collectTranslatableStrings(
  obj: any,
  path = '',
  pairs: TranslationPair[] = [],
): TranslationPair[] {
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => collectTranslatableStrings(item, `${path}[${i}]`, pairs))
  } else if (obj && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = path ? `${path}.${key}` : key
      if (SKIP_KEYS.has(key)) continue
      if (typeof value === 'string' && value.trim()) {
        pairs.push({ path: fullPath, text: value })
      } else if (typeof value === 'object' && value !== null) {
        collectTranslatableStrings(value, fullPath, pairs)
      }
    }
  }
  return pairs
}

function applyTranslations(obj: any, map: Record<string, string>, path = ''): any {
  if (Array.isArray(obj)) return obj.map((item, i) => applyTranslations(item, map, `${path}[${i}]`))
  if (obj && typeof obj === 'object') {
    const out: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = path ? `${path}.${key}` : key
      if (SKIP_KEYS.has(key)) {
        out[key] = value
      } else if (typeof value === 'string') {
        out[key] = map[fullPath] ?? value
      } else if (typeof value === 'object' && value !== null) {
        out[key] = applyTranslations(value, map, fullPath)
      } else {
        out[key] = value
      }
    }
    return out
  }
  return obj
}

/** Remove array-item IDs so Payload generates fresh ones for the new profile. */
function stripIds(obj: any): any {
  if (Array.isArray(obj)) return obj.map(stripIds)
  if (obj && typeof obj === 'object') {
    const out: any = {}
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'id') continue
      out[k] = stripIds(v)
    }
    return out
  }
  return obj
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  sv: 'Swedish',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  zh: 'Chinese',
  ja: 'Japanese',
}

async function batchTranslate(
  pairs: TranslationPair[],
  sourceLang: string,
  targetLang: string,
): Promise<Record<string, string>> {
  if (pairs.length === 0) return {}

  const from = LANGUAGE_NAMES[sourceLang] ?? sourceLang
  const to = LANGUAGE_NAMES[targetLang] ?? targetLang
  const CHUNK = 80
  const out: Record<string, string> = {}

  for (let i = 0; i < pairs.length; i += CHUNK) {
    const chunk = pairs.slice(i, i + CHUNK)
    const numbered = chunk.map((p, idx) => `${idx + 1}. ${p.text}`).join('\n\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a professional translator for CV documents.
Translate each numbered text from ${from} into ${to}.
- Translate ALL text: titles, descriptions, skill names, education levels.
- Keep internationally known proper nouns unchanged (company names, tool names like "JavaScript", "Figma").
- Preserve \\n line breaks and formatting.
- Return ONLY valid JSON: {"1":"translation","2":"translation",...}`,
        },
        { role: 'user', content: numbered },
      ],
    })

    const raw = completion.choices[0]?.message.content ?? '{}'
    const result = JSON.parse(raw) as Record<string, string>
    chunk.forEach((p, idx) => {
      const t = result[String(idx + 1)]
      if (t) out[p.path] = t
    })
  }
  return out
}

// ─── POST /api/profile/translate ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sourceProfileId, targetLanguage } = body

    if (!sourceProfileId || !targetLanguage) {
      return NextResponse.json(
        { error: 'sourceProfileId and targetLanguage are required' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })
    const userId = session.user.id

    // ── 1. Fetch source profile (READ ONLY — never modified) ──────────────────
    const source = await payload.findByID({
      collection: 'profiles',
      id: sourceProfileId,
      depth: 1, // depth=1 populates the personalInformation relationship
    })

    if (!source) {
      return NextResponse.json({ error: 'Source profile not found' }, { status: 404 })
    }

    // Ownership check
    const sourceOwner = typeof source.user === 'object' ? source.user.id : source.user
    if (String(sourceOwner) !== String(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const sourceLang = source.language ?? 'sv'

    console.log(
      `[translate] source profile id=${source.id}, language=${sourceLang} → ${targetLanguage}`,
    )

    // ── 2. Guard: refuse if a profile in the target language already exists ────
    const dup = await payload.find({
      collection: 'profiles',
      where: {
        and: [{ user: { equals: userId } }, { language: { equals: targetLanguage } }],
      },
      limit: 1,
    })

    if (dup.docs.length > 0) {
      return NextResponse.json(
        {
          error: `A ${LANGUAGE_NAMES[targetLanguage] ?? targetLanguage} profile already exists`,
          existingProfileId: dup.docs[0]!.id,
        },
        { status: 409 },
      )
    }

    // ── 3. Resolve source personalInformation ID ──────────────────────────────
    //
    // KEY DESIGN DECISION: the translated profile REUSES the source's PI record.
    // We do NOT create a new personal-information row.
    //
    // Why: personal-information has a 1-to-1 relationship with user in practice.
    // Any query like `?where[user][equals]=X&limit=1` would return whichever PI
    // was created most recently — if we created a Swedish PI record, it would
    // appear in place of the original English one everywhere else in the app,
    // making the main profile look translated.
    //
    // Names, email, phone etc. are the same in all languages anyway.
    // Translatable text fields (title, professionalPresentation) can be edited
    // manually on the slave profile after creation if needed.
    const sourcePIId =
      typeof source.personalInformation === 'object'
        ? (source.personalInformation as any).id
        : source.personalInformation

    if (!sourcePIId) {
      return NextResponse.json(
        { error: 'Source profile has no linked personal information' },
        { status: 400 },
      )
    }

    // ── 4. Collect translatable text from profileDetails ──────────────────────
    const sourceDetails = source.profileDetails ?? {}
    const pairs = collectTranslatableStrings(sourceDetails, 'profileDetails')

    console.log(`[translate] ${pairs.length} text fields to translate`)

    // ── 5. Translate ──────────────────────────────────────────────────────────
    const translationMap = await batchTranslate(pairs, sourceLang, targetLanguage)

    // ── 6. Build translated profileDetails ────────────────────────────────────
    //    stripIds removes array-item IDs so Payload creates new ones.
    const translatedDetails = applyTranslations(
      stripIds(sourceDetails),
      translationMap,
      'profileDetails',
    )

    // ── 7. Create the slave profile ───────────────────────────────────────────
    const slaveProfile = await payload.create({
      collection: 'profiles',
      data: {
        user: Number(userId),
        language: targetLanguage as any,
        personalInformation: sourcePIId,
        profileDetails: translatedDetails,
      },
    })

    // ── 8. Verify language was saved correctly ────────────────────────────────
    // If "sv" is missing from the Profiles collection options OR the database
    // hasn't been migrated, Payload silently stores the defaultValue ("en")
    // instead — both profiles then appear to have the same language.
    // Fix: add "sv" to language options, then run `npx payload migrate`.
    if (String(slaveProfile.language) !== String(targetLanguage)) {
      console.error(
        `[translate] ❌ Language mismatch! Requested "${targetLanguage}" but ` +
          `Payload stored "${slaveProfile.language}". ` +
          `Ensure "${targetLanguage}" is in the Profiles collection language options ` +
          `and run: npx payload migrate`,
      )
      await payload.delete({ collection: 'profiles', where: { id: { equals: slaveProfile.id } } })
      return NextResponse.json(
        {
          error: `Language "${targetLanguage}" is not valid in your Profiles collection. Add it to the language field options and run: npx payload migrate`,
        },
        { status: 500 },
      )
    }

    // ── 9. Re-read BOTH profiles from DB to confirm nothing was mutated ─────────
    const [verifySource, verifySlave] = await Promise.all([
      payload.findByID({ collection: 'profiles', id: String(source.id), depth: 0 }),
      payload.findByID({ collection: 'profiles', id: String(slaveProfile.id), depth: 0 }),
    ])

    console.log('[translate] DB state after create:')
    console.log(
      `  source  id=${verifySource?.id}  language=${verifySource?.language}  (should be: ${source.language})`,
    )
    console.log(
      `  slave   id=${verifySlave?.id}  language=${verifySlave?.language}  (should be: ${targetLanguage})`,
    )

    if (String(verifySource?.language) !== String(source.language)) {
      console.error(
        `[translate] ❌ BUG: source profile language changed in DB from "${source.language}" to "${verifySource?.language}"`,
      )
    } else {
      console.log(`[translate] ✅ Source profile unchanged. Both profiles are separate.`)
    }

    return NextResponse.json({
      success: true,
      sourceProfileId: source.id,
      sourceLanguage: verifySource?.language,
      newProfileId: slaveProfile.id,
      newLanguage: verifySlave?.language,
      translatedFields: pairs.length,
    })
  } catch (error: any) {
    console.error('[translate] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create translated profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
