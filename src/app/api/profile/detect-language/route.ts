// app/api/profile/detect-language/route.ts
// Detects whether a block of text is Swedish (sv) or English (en).
// Called after CV parsing, before profile creation.

import { type NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ language: 'sv' }) // safe default
    }

    // Only send the first 500 chars — enough for language detection, cheap to run
    const sample = text.slice(0, 500)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 5,
      messages: [
        {
          role: 'system',
          content:
            'You are a language detector. Reply with exactly one word: either "sv" for Swedish or "en" for English. Nothing else.',
        },
        {
          role: 'user',
          content: `Detect the language of this CV text:\n\n${sample}`,
        },
      ],
    })

    const raw = completion.choices[0]?.message.content?.trim().toLowerCase() ?? ''
    const language = raw === 'en' ? 'en' : 'sv' // default to sv if uncertain

    return NextResponse.json({ language })
  } catch (error) {
    console.error('[detect-language] Error:', error)
    // On error, default to Swedish (the primary language of the platform)
    return NextResponse.json({ language: 'sv' })
  }
}
