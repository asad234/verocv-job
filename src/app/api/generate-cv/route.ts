import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { posthogServer } from '@/lib/posthogServer';

// ---------------------------
// Initialize OpenAI (server-side safe)
// ---------------------------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ---------------------------
// SCHEMAS
// ---------------------------
const GenerateCVRequestSchema = z.object({
  jobAd: z.string().min(1, 'Job advertisement is required'),
  personalInfo: z
    .object({
      firstName: z.string().optional().or(z.literal('')).nullable(),
      lastName: z.string().optional().or(z.literal('')).nullable(),
      homeAddress: z.string().optional().or(z.literal('')).nullable(),
      phoneNumber: z.string().optional().or(z.literal('')).nullable(),
      workPhoneNumber: z.string().optional().or(z.literal('')).nullable(),
      privateEmail: z.string().email().optional().or(z.literal('')).nullable(),
      workEmail: z.string().email().optional().or(z.literal('')).nullable(),
      title: z.string().optional().or(z.literal('')).nullable(),
      professionalPresentation: z.string().optional().or(z.literal('')).nullable(),
      socialLinks: z.record(z.string().url().or(z.literal('')).nullable()).optional().nullable(),
    })
    .optional(),
  resumeData: z
    .object({
      projects: z
        .array(
          z.object({
            id: z.string(),
            role: z.string(),
            startDate: z.string(),
            endDate: z.string().optional().nullable(),
            isCurrent: z.boolean(),
            description: z.string(),
            skills: z.string().optional().nullable(),
            company: z.string().optional().nullable(),
            location: z.string().optional().nullable(),
            projectUrl: z.string().optional().nullable(),
            visible: z.boolean().optional().nullable(),
          }),
        )
        .optional(),
      skills: z
        .array(
          z.object({
            skillName: z.string().optional().nullable(),
            skillRating: z.number().optional().nullable(),
            skillYearsExperience: z.number().optional().nullable(),
          }),
        )
        .optional(),
      employers: z
        .array(
          z.object({
            employer: z.string().optional().nullable(),
            title: z.string().optional().nullable(),
            startDate: z.string().optional().nullable(),
            endDate: z.string().optional().nullable(),
            ongoing: z.boolean().optional().nullable(),
            description: z.string().optional().nullable(),
          }),
        )
        .optional(),
      education: z
        .array(
          z.object({
            school: z.string().optional().nullable(),
            program: z.string().optional().nullable(),
            level: z.string().optional().nullable(),
            startDate: z.string().optional().nullable(),
            endDate: z.string().optional().nullable(),
            ongoing: z.boolean().optional().nullable(),
            description: z.string().optional().nullable(),
          }),
        )
        .optional(),
      certifications: z
        .array(
          z.object({
            title: z.string().optional().nullable(),
            issuer: z.string().optional().nullable(),
            startDate: z.string().optional().nullable(),
            validDate: z.string().optional().nullable(),
            description: z.string().optional().nullable(),
          }),
        )
        .optional(),
      commitments: z
        .array(
          z.object({
            title: z.string().optional().nullable(),
            startDate: z.string().optional().nullable(),
            endDate: z.string().optional().nullable(),
            isOngoing: z.boolean().optional().nullable(),
            description: z.string().optional().nullable(),
          }),
        )
        .optional()
        .nullable(),
    })
    .optional()
    .nullable(),
});

const MightHaveSkillSchema = z.object({
  skillName: z.string(),
  reason: z.string(), // Why this skill is recommended (e.g., "mentioned as preferred", "good to have", "complements existing skills")
  relevance: z.enum(['preferred', 'good_to_have', 'complementary']),
});

const GenerateCVResponseSchema = z.object({
  filteredResume: z.object({
    projects: z
      .array(
        z.object({
          id: z.string(),
          role: z.string(),
          startDate: z.string(),
          endDate: z.string().nullable(),
          isCurrent: z.boolean(),
          description: z.string(),
          skills: z.string().nullable(),
          company: z.string().nullable(),
          location: z.string().nullable(),
          projectUrl: z.string().nullable(),
        }),
      )
      .nullable(),
    skills: z
      .array(
        z.object({
          skillName: z.string(),
          skillRating: z.number().nullable(),
          skillYearsExperience: z.number().nullable(),
        }),
      )
      .nullable(),
    employers: z
      .array(
        z.object({
          employer: z.string(),
          title: z.string().nullable(),
          startDate: z.string().nullable(),
          endDate: z.string().nullable(),
          ongoing: z.boolean().nullable(),
          description: z.string().nullable(),
        }),
      )
      .nullable(),
    education: z
      .array(
        z.object({
          school: z.string(),
          program: z.string().nullable(),
          level: z.string().nullable(),
          startDate: z.string().nullable(),
          endDate: z.string().nullable(),
          ongoing: z.boolean().nullable(),
          description: z.string().nullable(),
        }),
      )
      .nullable(),
    certifications: z
      .array(
        z.object({
          title: z.string(),
          issuer: z.string().nullable(),
          startDate: z.string().nullable(),
          validDate: z.string().nullable(),
          description: z.string().nullable(),
        }),
      )
      .nullable(),
    commitments: z
      .array(
        z.object({
          title: z.string(),
          startDate: z.string().nullable(),
          endDate: z.string().nullable(),
          isOngoing: z.boolean().nullable(),
          description: z.string().nullable(),
        }),
      )
      .nullable(),
  }),
  mightHave: z.array(MightHaveSkillSchema).nullable(),
  relevanceScore: z.number().min(0).max(100).nullable(),
});

export const runtime = 'nodejs';
export const maxDuration = 60; 

export async function POST(request: Request) {
  console.time('generate-cv-duration');
  const startTime = Date.now();

  let requestBody: any = null;

  try {
    requestBody = await request.json();
    const parsedInput = GenerateCVRequestSchema.safeParse(requestBody);

    if (!parsedInput.success) {
      const errorDetails = parsedInput.error.issues.map(issue => ({
        field: issue.path.join('.'),
        problem: issue.message,
      }));

      // Capture validation failure in PostHog
      await posthogServer.capture({
        distinctId: requestBody.personalInfo?.privateEmail || 'anonymous',
        event: 'cv_generation_failed_validation',
        properties: {
          errorDetails,
          requestBody,
          timestamp: new Date().toISOString(),
        },
      });

      await posthogServer.shutdown(); // flush events

      console.timeEnd('generate-cv-duration');
      return NextResponse.json(
        { error: 'Invalid input data', details: errorDetails },
        { status: 400 }
      );
    }

    const { jobAd, resumeData, personalInfo } = parsedInput.data;
    const resumeText = JSON.stringify({ personalInfo, ...resumeData });

    // OpenAI CV analysis and generation
const completion = await openai.beta.chat.completions.parse({
  model: 'gpt-4o-mini-2024-07-18',
  messages: [
    {
      role: 'system',
      content: `# CV Analysis Expert Role

## PRIMARY MISSION
Transform candidate resumes into job-targeted CVs that maximize relevance and impact.

## PROCESSING RULES

### 1. MATCH & ENHANCE (Skills, Projects, Employers only)
**FILTERING:**
- Extract ONLY highly relevant items that match job requirements
- Remove unrelated or weakly connected items
- Prioritize quality over quantity

**ENHANCEMENT:**
- Rewrite descriptions using job ad terminology and keywords
- Quantify achievements where possible (metrics, results, impact)
- Strengthen action verbs and technical language
- Maintain factual accuracy - NO invention of data

### 2. PRESERVE UNCHANGED (Education, Certifications, Commitments)
- Return exactly as provided, verbatim
- No filtering, rewriting, or modification
- Maintain original formatting and content

### 3. STRATEGIC SKILL DEVELOPMENT ("mightHave" section)
- Analyze job ad for preferred skills, nice-to-have skills, or complementary skills
- Suggest skills that the candidate might want to develop or highlight
- Include the reason and relevance level for each suggested skill

### 4. RELEVANCE SCORING (0-100)
Calculate relevance score based on the match between the candidate's profile and job requirements.

## OUTPUT REQUIREMENTS
- Strict JSON format adherence
- Clear, professional language
- Job-focused positioning
- Authentic representation of candidate's capabilities`
    },
    {
      role: 'user',
      content: `## JOB OPPORTUNITY ANALYSIS
**JOB ADVERTISEMENT:**
${jobAd}

## CANDIDATE PROFILE
**RESUME DATA:**
${resumeText}

## PROCESSING INSTRUCTIONS
1. **MATCH & IMPROVE**: Skills, projects, employers - filter and improve for job alignment
2. **KEEP AS-IS**: Education, certifications, commitments - keep original
3. **GENERATE**: "mightHave" skills with reasons and relevance levels
4. **CALCULATE**: Relevance score (0-100) based on profile-job match`
    }
  ],
  response_format: zodResponseFormat(GenerateCVResponseSchema, 'filteredResume'),
  temperature: 0.2, // Lower temperature for more consistent results
  max_tokens: 4096 // output length
});

    const parsedOutput = completion.choices[0]?.message.parsed;
    if (!parsedOutput) throw new Error('No response received from AI');

    const validatedOutput = GenerateCVResponseSchema.safeParse(parsedOutput);
    if (!validatedOutput.success) {
      console.warn('CV output validation warnings:', validatedOutput.error.issues);
    }

    const addVisible = (arr: any[] | null) => arr?.map(item => ({ ...item, visible: true })) ?? null;

    const finalData = validatedOutput.success
      ? {
          ...validatedOutput.data,
          filteredResume: {
            projects: addVisible(validatedOutput.data.filteredResume.projects),
            skills: addVisible(validatedOutput.data.filteredResume.skills),
            employers: addVisible(validatedOutput.data.filteredResume.employers),
            education: addVisible(validatedOutput.data.filteredResume.education),
            certifications: addVisible(validatedOutput.data.filteredResume.certifications),
            commitments: addVisible(validatedOutput.data.filteredResume.commitments),
          },
        }
      : null;

    const hasMatches =
      finalData &&
      Object.values(finalData.filteredResume).some(section => section && section.length > 0);

    const response = {
      success: true,
      data: finalData,
      metadata: {
        generatedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        candidateName: `${personalInfo?.firstName || ''} ${personalInfo?.lastName || ''}`.trim() || 'Unknown',
        hasMatches,
        mightHave: validatedOutput.data!.mightHave,
      },
    };

    // Capture success event in PostHog
    await posthogServer.capture({
      distinctId: personalInfo?.privateEmail || 'anonymous',
      event: 'cv_generation_success',
      properties: {
        relevanceScore: validatedOutput.data?.relevanceScore,
        hasMatches,
        mightHaveCount: finalData?.mightHave?.length || 0,
        durationMs: Date.now() - startTime,
        candidateName: `${personalInfo?.firstName || ''} ${personalInfo?.lastName || ''}`.trim() || 'Unknown',
        timestamp: new Date().toISOString(),
      },
    });

    await posthogServer.shutdown(); // flush events

    console.timeEnd('generate-cv-duration');
    return NextResponse.json(response);
  } catch (error) {
    console.error('CV generation error:', error);

    await posthogServer.capture({
      distinctId: requestBody?.personalInfo?.privateEmail || 'server_error',
      event: 'cv_generation_error',
      properties: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
        requestBody,
        timestamp: new Date().toISOString(),
      },
    });

    await posthogServer.shutdown(); // flush events

    console.timeEnd('generate-cv-duration');
    return NextResponse.json(
      {
        error: 'Error generating CV',
        details: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
}