// src/app/api/cv/save/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

// Add this helper function at the top of your route.ts file, after the other helper functions

function normalizeLevelValue(
  level: string | undefined | null,
): 'beginner' | 'intermediate' | 'advanced' | 'fluent' | 'native' {
  if (!level) return 'beginner'

  const normalizedLevel = level.toLowerCase().trim()

  // Map common variations to the expected values
  const levelMap: Record<string, 'beginner' | 'intermediate' | 'advanced' | 'fluent' | 'native'> = {
    basic: 'beginner',
    beginner: 'beginner',
    elementary: 'beginner',

    intermediate: 'intermediate',
    medium: 'intermediate',
    conversational: 'intermediate',

    advanced: 'advanced',
    proficient: 'advanced',
    professional: 'advanced',

    fluent: 'fluent',
    excellent: 'fluent',

    native: 'native',
    'mother tongue': 'native',
    bilingual: 'native',
  }

  return levelMap[normalizedLevel] || 'beginner'
}

function normalizeDate(date: string | Date | null | undefined): string | null {
  if (!date) return null
  const d = new Date(date)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

// Helper function to check for duplicate skills
function hasDuplicateSkills(skills: any[]): { hasDuplicates: boolean; duplicates: string[] } {
  const skillNames = skills.map((s) => s.skillName?.toLowerCase().trim()).filter(Boolean)
  const duplicates = skillNames.filter((name, index) => skillNames.indexOf(name) !== index)
  const uniqueDuplicates = [...new Set(duplicates)]

  return {
    hasDuplicates: uniqueDuplicates.length > 0,
    duplicates: uniqueDuplicates,
  }
}

// Helper function to check for duplicate languages
function hasDuplicateLanguages(languages: any[]): { hasDuplicates: boolean; duplicates: string[] } {
  const languageNames = languages.map((l) => l.language?.toLowerCase().trim()).filter(Boolean)
  const duplicates = languageNames.filter((name, index) => languageNames.indexOf(name) !== index)
  const uniqueDuplicates = [...new Set(duplicates)]

  return {
    hasDuplicates: uniqueDuplicates.length > 0,
    duplicates: uniqueDuplicates,
  }
}

// Helper function to merge skills without duplicates
function mergeSkills(profileSkills: any[], cvSkills: any[]) {
  const mergedSkills = [...profileSkills]
  const existingSkillNames = new Set(
    profileSkills.map((s) => s.skillName?.toLowerCase().trim()).filter(Boolean),
  )

  for (const cvSkill of cvSkills) {
    const skillNameLower = cvSkill.skillName?.toLowerCase().trim()
    if (skillNameLower && !existingSkillNames.has(skillNameLower)) {
      mergedSkills.push({
        skillName: cvSkill.skillName,
        skillRating: cvSkill.skillRating || 0,
        skillYearsExperience: cvSkill.skillYearsExperience || 0,
      })
      existingSkillNames.add(skillNameLower)
    }
  }

  return mergedSkills
}

// Helper function to merge employers without duplicates
function mergeEmployers(profileEmployers: any[], cvEmployers: any[]) {
  const mergedEmployers = [...profileEmployers]
  const existingKeys = new Set(
    profileEmployers
      .map((e) => `${e.employer?.toLowerCase().trim()}_${e.title?.toLowerCase().trim()}`)
      .filter(Boolean),
  )

  for (const cvEmployer of cvEmployers) {
    const key = `${cvEmployer.employer?.toLowerCase().trim()}_${cvEmployer.title?.toLowerCase().trim()}`
    if (key && !existingKeys.has(key)) {
      mergedEmployers.push({
        employer: cvEmployer.employer || '',
        title: cvEmployer.title || '',
        startDate: normalizeDate(cvEmployer.startDate),
        endDate: normalizeDate(cvEmployer.endDate),
        ongoing: cvEmployer.ongoing || false,
        description: cvEmployer.description || '',
        link: cvEmployer.link || '',
      })
      existingKeys.add(key)
    }
  }

  return mergedEmployers
}

// Helper function to merge education without duplicates
function mergeEducation(profileEducation: any[], cvEducation: any[]) {
  const mergedEducation = [...profileEducation]
  const existingKeys = new Set(
    profileEducation
      .map((e) => `${e.school?.toLowerCase().trim()}_${e.program?.toLowerCase().trim()}`)
      .filter(Boolean),
  )

  for (const cvEdu of cvEducation) {
    const key = `${cvEdu.school?.toLowerCase().trim()}_${cvEdu.program?.toLowerCase().trim()}`
    if (key && !existingKeys.has(key)) {
      mergedEducation.push({
        school: cvEdu.school || '',
        program: cvEdu.program || '',
        level: cvEdu.level || '',
        place: cvEdu.place || '',
        startDate: normalizeDate(cvEdu.startDate),
        endDate: normalizeDate(cvEdu.endDate),
        ongoing: cvEdu.ongoing || false,
        description: cvEdu.description || '',
        link: cvEdu.link || '',
      })
      existingKeys.add(key)
    }
  }

  return mergedEducation
}

// Helper function to merge languages without duplicates
function mergeLanguages(profileLanguages: any[], cvLanguages: any[]) {
  const mergedLanguages = [...profileLanguages]
  const existingLanguages = new Set(
    profileLanguages.map((l) => l.language?.toLowerCase().trim()).filter(Boolean),
  )

  for (const cvLang of cvLanguages) {
    const langName = cvLang.language?.toLowerCase().trim()
    if (langName && !existingLanguages.has(langName)) {
      mergedLanguages.push({
        language: cvLang.language || '',
        level: cvLang.level || 'beginner', // This is fine for profile since it's just text
      })
      existingLanguages.add(langName)
    }
  }

  return mergedLanguages
}

// Helper function to merge certifications without duplicates
function mergeCertifications(profileCertifications: any[], cvCertifications: any[]) {
  const mergedCertifications = [...profileCertifications]
  const existingKeys = new Set(
    profileCertifications
      .map((c) => `${c.title?.toLowerCase().trim()}_${c.issuer?.toLowerCase().trim()}`)
      .filter(Boolean),
  )

  for (const cvCert of cvCertifications) {
    const key = `${cvCert.title?.toLowerCase().trim()}_${cvCert.issuer?.toLowerCase().trim()}`
    if (key && !existingKeys.has(key)) {
      mergedCertifications.push({
        type: cvCert.type?.toLowerCase() === 'course' ? 'course' : 'certificate',
        title: cvCert.title || '',
        issuer: cvCert.issuer || '',
        supplier: cvCert.supplier || '',
        startDate: normalizeDate(cvCert.startDate),
        validDate: normalizeDate(cvCert.validDate),
        code: cvCert.code || '',
        description: cvCert.description || '',
        link: cvCert.link || '',
      })
      existingKeys.add(key)
    }
  }

  return mergedCertifications
}

// Helper function to merge projects without duplicates
function mergeProjects(profileProjects: any[], cvProjects: any[]) {
  const mergedProjects = [...profileProjects]
  const existingKeys = new Set(
    profileProjects
      .map((p) => `${p.role?.toLowerCase().trim()}_${p.company?.toLowerCase().trim()}`)
      .filter(Boolean),
  )

  for (const cvProject of cvProjects) {
    const key = `${cvProject.role?.toLowerCase().trim()}_${cvProject.company?.toLowerCase().trim()}`
    if (key && !existingKeys.has(key)) {
      mergedProjects.push({
        role: cvProject.role || '',
        company: cvProject.company || '',
        location: cvProject.location || '',
        projectUrl: cvProject.projectUrl || '',
        startDate: normalizeDate(cvProject.startDate),
        endDate: normalizeDate(cvProject.endDate),
        isCurrent: cvProject.isCurrent || false,
        description: cvProject.description || '',
        skills: cvProject.skills || '',
      })
      existingKeys.add(key)
    }
  }

  return mergedProjects
}

// Helper function to merge references without duplicates
function mergeReferences(profileReferences: any[], cvReferences: any[]) {
  const mergedReferences = [...profileReferences]
  const existingKeys = new Set(
    profileReferences
      .map(
        (r) =>
          `${r.firstName?.toLowerCase().trim()}_${r.lastName?.toLowerCase().trim()}_${r.email?.toLowerCase().trim()}`,
      )
      .filter(Boolean),
  )

  for (const cvRef of cvReferences) {
    const key = `${cvRef.firstName?.toLowerCase().trim()}_${cvRef.lastName?.toLowerCase().trim()}_${cvRef.email?.toLowerCase().trim()}`
    if (key && !existingKeys.has(key)) {
      mergedReferences.push({
        firstName: cvRef.firstName || '',
        lastName: cvRef.lastName || '',
        email: cvRef.email || '',
        phoneNumber: cvRef.phoneNumber || '',
        company: cvRef.company || '',
        positionTitle: cvRef.positionTitle || '',
        relationship: cvRef.relationship || '',
      })
      existingKeys.add(key)
    }
  }

  return mergedReferences
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { cvData, visibility, template, userId, cvName, cvId, syncToProfile } = body

    if (!cvData || !userId) {
      return NextResponse.json({ error: 'CV data and user ID are required' }, { status: 400 })
    }

    const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId
    if (isNaN(numericUserId)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 })
    }

    // Validate user exists
    await payload.findByID({ collection: 'users', id: numericUserId })

    // Check for duplicate skills in CV
    const cvSkills = cvData.skills || []
    const duplicateCheck = hasDuplicateSkills(cvSkills)

    if (duplicateCheck.hasDuplicates) {
      return NextResponse.json(
        {
          error: 'Duplicate skills detected',
          message: `You have added the following skill(s) multiple times: ${duplicateCheck.duplicates.join(', ')}. Please remove duplicates before saving.`,
          duplicates: duplicateCheck.duplicates,
        },
        { status: 400 },
      )
    }

    // Check for duplicate languages in CV
    const cvLanguages = cvData.languages || []
    const languageDuplicateCheck = hasDuplicateLanguages(cvLanguages)

    if (languageDuplicateCheck.hasDuplicates) {
      return NextResponse.json(
        {
          error: 'Duplicate languages detected',
          message: `You have added the following language(s) multiple times: ${languageDuplicateCheck.duplicates.join(', ')}. Please remove duplicates before saving.`,
          duplicates: languageDuplicateCheck.duplicates,
        },
        { status: 400 },
      )
    }

    // Transform the incoming data structure to match CVs collection
    const cvDocument = {
      user: numericUserId,
      name: cvName || 'My CV',
      isPublic: false,
      url: '',
      personalInfo: {
        firstName: cvData.profile?.firstName || cvData.personalInfo?.firstName || 'First Name',
        lastName: cvData.profile?.lastName || cvData.personalInfo?.lastName || 'Last Name',
        homeAddress: cvData.profile?.homeAddress || cvData.personalInfo?.homeAddress || '',
        phoneNumber: cvData.profile?.phoneNumber || cvData.personalInfo?.phoneNumber || '',
        workPhoneNumber:
          cvData.profile?.workPhoneNumber || cvData.personalInfo?.workPhoneNumber || '',
        privateEmail: cvData.profile?.privateEmail || cvData.personalInfo?.privateEmail || '',
        workEmail: cvData.profile?.workEmail || cvData.personalInfo?.workEmail || '',
        recoveryEmail: cvData.profile?.recoveryEmail || cvData.personalInfo?.recoveryEmail || '',
        dateOfBirth: normalizeDate(cvData.profile?.dateOfBirth || cvData.personalInfo?.dateOfBirth),
        gender: (cvData.profile?.gender || cvData.personalInfo?.gender) as
          | 'male'
          | 'female'
          | 'other'
          | undefined,
        title: cvData.profile?.title || cvData.personalInfo?.title || '',
        professionalPresentation:
          cvData.profile?.professionalPresentation ||
          cvData.personalInfo?.professionalPresentation ||
          '',
        personalPresentation:
          cvData.profile?.personalPresentation || cvData.personalInfo?.personalPresentation || '',
        companyType: cvData.profile?.companyType || cvData.personalInfo?.companyType || '',
        profileImage:
          cvData.profile?.profileImage?.uploadImage ||
          cvData.personalInfo?.profileImage?.uploadImage ||
          null,
        companyLogo: {
          uploadImage:
            cvData.profile?.companyLogo?.uploadImage?.id ||
            cvData.personalInfo?.companyLogo?.uploadImage?.id ||
            null,
          staticImage:
            cvData.profile?.companyLogo?.staticImage ||
            cvData.personalInfo?.companyLogo?.staticImage ||
            '',
        },
      },
      experience: (cvData.employers || cvData.experience || []).map((e: any) => ({
        employer: e.employer || '',
        title: e.title || '',
        startDate: normalizeDate(e.startDate),
        endDate: normalizeDate(e.endDate),
        ongoing: e.ongoing || false,
        description: e.description || '',
        link: e.link || '',
        visible: e.visible !== false,
      })),
      education: (cvData.education || []).map((edu: any) => ({
        school: edu.school || '',
        program: edu.program || '',
        level: edu.level || '',
        place: edu.place || '',
        startDate: normalizeDate(edu.startDate),
        endDate: normalizeDate(edu.endDate),
        ongoing: edu.ongoing || false,
        description: edu.description || '',
        link: edu.link || '',
        visible: edu.visible !== false,
      })),
      projects: (cvData.projects || []).map((p: any) => ({
        role: p.role || '',
        company: p.company || '',
        location: p.location || '',
        projectUrl: p.projectUrl || '',
        startDate: normalizeDate(p.startDate),
        endDate: normalizeDate(p.endDate),
        isCurrent: p.isCurrent || false,
        description: p.description || '',
        skills: p.skills || '',
        visible: p.visible !== false,
      })),
      references: (cvData.references || []).map((r: any) => ({
        firstName: r.firstName || '',
        lastName: r.lastName || '',
        email: r.email || '',
        phoneNumber: r.phoneNumber || '',
        company: r.company || '',
        positionTitle: r.positionTitle || '',
        relationship: r.relationship || '',
        visible: r.visible !== false,
      })),
      skills: cvSkills.map((s: any) => ({
        skillName: s.skillName || '',
        skillRating: typeof s.skillRating === 'number' ? s.skillRating : 0,
        skillYearsExperience:
          typeof s.skillYearsExperience === 'number' ? s.skillYearsExperience : 0,
        visible: s.visible !== false,
      })),
      languages: (cvData.languages || []).map((l: any) => ({
        language: l.language || '',
        level: normalizeLevelValue(l.level), // Use the helper function instead
        visible: l.visible !== false,
      })),
      certifications: (cvData.certifications || []).map((c: any) => ({
        type: c.type?.toLowerCase() === 'course' ? ('course' as const) : ('certificate' as const),
        title: c.title || '',
        issuer: c.issuer || '',
        supplier: c.supplier || '',
        startDate: normalizeDate(c.startDate),
        validDate: normalizeDate(c.validDate),
        code: c.code || '',
        description: c.description || '',
        link: c.link || '',
        visible: c.visible !== false,
      })),
      template: template || 'modern',
      visibility: visibility || {},
      accentColor: body.selectedColor || body.accentColor || '',
      headingFontId: body.headingFontId || '',
      bodyFontId: body.bodyFontId || '',
      portfolioItems: (body.portfolioItems ?? []).map((p: any) => ({
        id: p.id,
        type: p.type,
        title: p.title,
        description: p.description || '',
        imageUrl: p.imageUrl || '',
        videoUrl: p.videoUrl || '',
        youtubeUrl: p.youtubeUrl || '',
        youtubeVideoId: p.youtubeVideoId || '',
        linkUrl: p.linkUrl || '',
        documentUrl: p.documentUrl || '',
        documentName: p.documentName || '',
      })),
    }

    console.log(
      'Transformed CV Document - personalInfo:',
      cvDocument.personalInfo.firstName,
      cvDocument.personalInfo.lastName,
    )

    let savedCV
    if (cvId) {
      const existingCV = await payload.findByID({ collection: 'cvs', id: cvId })
      const cvUserId = typeof existingCV.user === 'object' ? existingCV.user.id : existingCV.user
      if (cvUserId !== numericUserId) {
        return NextResponse.json({ error: 'CV not found or access denied' }, { status: 403 })
      }

      savedCV = await payload.update({
        collection: 'cvs',
        id: cvId,
        data: cvDocument,
      })
    } else {
      savedCV = await payload.create({
        collection: 'cvs',
        data: cvDocument,
      })
    }

    // Sync to profile
    try {
      const userProfile = await payload.find({
        collection: 'profiles',
        where: {
          user: {
            equals: numericUserId,
          },
        },
        limit: 1,
      })

      const profile = userProfile.docs[0]

      if (profile && profile.id) {
        const existingProfileSkills = profile.profileDetails?.skills || []
        const mergedSkills = mergeSkills(existingProfileSkills, cvSkills)

        // Prepare update data
        const updateData: any = {
          profileDetails: {
            ...profile.profileDetails,
            skills: mergedSkills,
          },
        }

        // Only sync other sections if user confirmed
        if (syncToProfile) {
          // Use merge functions to prevent duplicates
          updateData.profileDetails.employers = mergeEmployers(
            profile.profileDetails?.employers || [],
            cvData.employers || cvData.experience || [],
          )

          updateData.profileDetails.education = mergeEducation(
            profile.profileDetails?.education || [],
            cvData.education || [],
          )

          updateData.profileDetails.languages = mergeLanguages(
            profile.profileDetails?.languages || [],
            cvData.languages || [],
          )

          updateData.profileDetails.certifications = mergeCertifications(
            profile.profileDetails?.certifications || [],
            cvData.certifications || [],
          )

          updateData.profileDetails.projectDetails = mergeProjects(
            profile.profileDetails?.projectDetails || [],
            cvData.projects || [],
          )

          updateData.profileDetails.references = mergeReferences(
            profile.profileDetails?.references || [],
            cvData.references || [],
          )
        }

        // Update profile
        await payload.update({
          collection: 'profiles',
          id: profile.id,
          data: updateData,
        })

        console.log(
          `Synced ${cvSkills.length} skills to profile. ${syncToProfile ? 'Also synced other sections.' : 'Other sections not synced.'}`,
        )
      } else {
        console.warn(`No profile found for user ${numericUserId}. Skills were not synced.`)
      }
    } catch (profileError) {
      console.error('Error syncing to profile:', profileError)
      // Don't fail the CV save if profile sync fails
    }

    return NextResponse.json({
      success: true,
      message: cvId ? 'CV updated successfully' : 'CV created successfully',
      cvId: savedCV.id,
      data: savedCV,
      skillsSynced: cvSkills.length > 0,
      profileSynced: syncToProfile || false,
    })
  } catch (error) {
    console.error('Error saving CV:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save CV',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
