// app/api/generate-cover/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { posthogServer } from '@/lib/posthogServer';
//posthog already server
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Input validation schema - all fields optional except jobAd
const CoverLetterRequestSchema = z.object({
  jobAd: z.string().min(1, 'Job advertisement is required'),
  personalInfo: z.object({
    firstName: z.string().optional().or(z.literal('')),
    lastName: z.string().optional().or(z.literal('')),
    homeAddress: z.string().optional().or(z.literal('')),
    phoneNumber: z.string().optional().or(z.literal('')),
    workPhoneNumber: z.string().optional().or(z.literal('')),
    privateEmail: z.string().email().optional().or(z.literal('')),
    workEmail: z.string().email().optional().or(z.literal('')),
    title: z.string().optional().or(z.literal('')),
    professionalPresentation: z.string().optional().or(z.literal('')),
    socialLinks: z.record(z.string().url().or(z.literal('')).nullable()).optional().nullable(),
  }).optional(),
  resumeData: z.object({
    skills: z.array(z.object({
      skillName: z.string().optional(),
      skillRating: z.number().optional(),
      skillYearsExperience: z.number().optional(),
    })).optional(),
    employers: z.array(z.object({
      employer: z.string().optional(),
      title: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      ongoing: z.boolean().optional(),
      description: z.string().optional(),
    })).optional(),
    education: z.array(z.object({
      school: z.string().optional(),
      program: z.string().optional(),
      level: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      ongoing: z.boolean().optional(),
      description: z.string().optional(),
    })).optional(),
    certifications: z.array(z.object({
      title: z.string().optional(),
      issuer: z.string().optional(),
      startDate: z.string().optional(),
      validDate: z.string().nullable().optional(),
      description: z.string().optional(),
    })).optional(),
    commitments: z.array(z.object({
      title: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      isOngoing: z.boolean().optional(),
      description: z.string().optional(),
    })).optional(),
  }).optional(),
  tone: z.enum(['professional', 'enthusiastic', 'formal', 'casual']).default('professional'),
  maxLength: z.number().min(50).max(1000).default(300),
  language: z.string().default('en'),
});

// Output validation schema - ALL FIELDS MUST BE REQUIRED for OpenAI structured outputs
const CoverLetterResponseSchema = z.object({
  coverLetter: z.string().nullable(),
  strengthsHighlighted: z.array(z.string()).nullable(),
  tailoredToJob: z.boolean().nullable(),
  matchScore: z.number().min(0).max(100).nullable(),
});

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  console.time('generate-cover-function-duration');
  const startTime = Date.now();

  let requestBody: any = null;

  try {
    requestBody = await request.json();

    if (!requestBody || typeof requestBody !== 'object') {
      const errorData = {
        error: 'Invalid request format',
        solution: 'Please provide a valid JSON object with required fields',
      };

      // PostHog capture
      await posthogServer.capture({
        distinctId: 'anonymous',
        event: 'cover_generation_invalid_request',
        properties: { requestBody, timestamp: new Date().toISOString() },
      });
      await posthogServer.shutdown();

      console.timeEnd('generate-cover-function-duration');
      return NextResponse.json(errorData, { status: 400 });
    }

    // Validate request
    const parsedInput = CoverLetterRequestSchema.safeParse(requestBody);
    if (!parsedInput.success) {
      const errorDetails = parsedInput.error.issues.map(issue => ({
        field: issue.path.join('.'),
        problem: issue.message,
      }));

      // PostHog capture
      await posthogServer.capture({
        distinctId: requestBody.personalInfo?.privateEmail || 'anonymous',
        event: 'cover_generation_failed_validation',
        properties: { errorDetails, requestBody, timestamp: new Date().toISOString() },
      });
      await posthogServer.shutdown();

      console.timeEnd('generate-cover-function-duration');
      return NextResponse.json(
        {
          error: 'Invalid input data',
          solution: 'Please check that all required fields are provided and valid',
          details: errorDetails,
        },
        { status: 400 }
      );
    }

    const { jobAd, personalInfo, resumeData, tone, maxLength, language } = parsedInput.data;

    // Prepare candidate info
    const fullName = personalInfo ? `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim() : '';
    const email = personalInfo?.workEmail || personalInfo?.privateEmail || '';
    const phone = personalInfo?.workPhoneNumber || personalInfo?.phoneNumber || '';
    
    const skillsText = resumeData?.skills?.map(skill => {
      let text = skill.skillName || 'Unnamed skill';
      if (skill.skillYearsExperience) text += ` (${skill.skillYearsExperience} years)`;
      if (skill.skillRating) text += ` - Rating: ${skill.skillRating}/10`;
      return text;
    }).join(', ') || 'No skills specified';

    const experienceText = resumeData?.employers?.map(exp => {
      const duration = exp.ongoing
        ? `since ${exp.startDate ? new Date(exp.startDate).getFullYear() : 'present'}`
        : exp.endDate
        ? `${exp.startDate ? new Date(exp.startDate).getFullYear() : '?'} - ${exp.endDate ? new Date(exp.endDate).getFullYear() : '?'}`
        : '';
      return `${exp.title || 'Unknown position'} at ${exp.employer || 'Unknown company'} ${duration}`;
    }).join('; ') || 'No work experience specified';

    const educationText = resumeData?.education?.map(edu => {
      const duration = edu.ongoing
        ? `since ${edu.startDate ? new Date(edu.startDate).getFullYear() : 'present'}`
        : edu.endDate
        ? `${edu.startDate ? new Date(edu.startDate).getFullYear() : '?'} - ${edu.endDate ? new Date(edu.endDate).getFullYear() : '?'}`
        : '';
      return `${edu.program || 'Unknown program'} at ${edu.school || 'Unknown school'} ${duration}`;
    }).join('; ') || 'No education specified';

    // Generate cover letter
    console.time('openai-cover-letter-duration');
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: `
You are an expert cover letter writer. 

STRICT RULE:
Write the cover letter in the SAME language as the job advertisement.
If the job advertisement is in Swedish, write in Swedish.
If the job advertisement is in English, write in English.
Do NOT translate or change the language.
Do NOT translate names or contact information.
Do NOT mix languages.

Generate a compelling cover letter that:
- Tailored to the job ad
- Highlights relevant skills and experience
- Matches the tone: ${tone}
- Concise, professional (~${maxLength} words)
- Includes candidate contact info
- Shows enthusiasm for the role and company

Use proper formatting, paragraphs, salutations.
Return plain text.
          `,
        },
        {
          role: "user",
          content: `
IMPORTANT:
The language of the job advertisement below MUST determine the output language.

JOB ADVERTISEMENT:
${jobAd}

CANDIDATE:
- Name: ${fullName || 'Not provided'}
- Email: ${email || 'Not provided'}
- Phone: ${phone || 'Not provided'}
- Title: ${personalInfo?.title || 'Not specified'}
- Address: ${personalInfo?.homeAddress || 'Not provided'}
- LinkedIn: ${personalInfo?.socialLinks?.linkedIn || 'Not provided'}
- Portfolio: ${personalInfo?.socialLinks?.website || 'Not provided'}
- Professional Summary: ${personalInfo?.professionalPresentation || 'Not provided'}

SKILLS: ${skillsText}
EXPERIENCE: ${experienceText}
EDUCATION: ${educationText}
CERTIFICATIONS: ${resumeData?.certifications?.map(c => `${c.title || 'Unknown'} from ${c.issuer || 'Unknown'}`).join('; ') || 'Not specified'}
COMMITMENTS: ${resumeData?.commitments?.map(c => c.title || 'Unknown').join('; ') || 'Not specified'}
          `,
        },
      ],
      response_format: zodResponseFormat(CoverLetterResponseSchema, "coverLetter"),
      temperature: 0.7,
      max_tokens: 2000,
    });
    console.timeEnd('openai-cover-letter-duration');

    const rawOutput = completion.choices[0]?.message.parsed;
    if (!rawOutput) throw new Error('No cover letter data returned');

    const parsedOutput = CoverLetterResponseSchema.safeParse(rawOutput);
    if (!parsedOutput.success) console.warn("Validation warnings:", parsedOutput.error.issues);

    const responseData = parsedOutput.success ? parsedOutput.data : rawOutput;

    // PostHog capture success
    await posthogServer.capture({
      distinctId: personalInfo?.privateEmail || 'anonymous',
      event: 'cover_generation_success',
      properties: {
        tone,
        maxLength,
        language,
        candidateName: fullName || 'Unknown',
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    });
      await posthogServer.shutdown();

    console.timeEnd('generate-cover-function-duration');
    return NextResponse.json({
      success: true,
      data: responseData,
      metadata: {
        tone,
        maxLength,
        language,
        candidateName: fullName || 'Unknown',
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Cover letter generation error:', error);

    // Capture error in PostHog
    await posthogServer.capture({
      distinctId: requestBody?.personalInfo?.privateEmail || 'server_error',
      event: 'cover_generation_error',
      properties: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
        requestBody,
        timestamp: new Date().toISOString(),
      },
    });
      await posthogServer.shutdown();

    console.timeEnd('generate-cover-function-duration');
    return NextResponse.json(
      {
        error: 'Error generating cover letter',
        solution: 'Please try again later',
        details: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
}
