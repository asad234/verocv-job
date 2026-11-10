"use client"

import { PDFViewer } from "@react-pdf/renderer"
import ModernResumeTemplate from "@/components/CV/PdfViewer/ModernTemplate"
import ClassicResumeTemplate from "@/components/CV/PdfViewer/ClassicTemplate"
import MinimalistResumeTemplate from "@/components/CV/PdfViewer/MinimalistTemplate"
import ATSResumeTemplate from "@/components/CV/PdfViewer/ATS-Template"
import KonsultResumeTemplate from "@/components/CV/PdfViewer/Konsulttemplate"
import { dashboardTranslations } from "@/utils/dashboardTranslations"
import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_HEADING_FONT,
  DEFAULT_BODY_FONT,
} from "@/components/CV/PdfViewer/Cvfontregistry"


function toDate(value: unknown): Date | undefined {
  if (!value) return undefined
  const d = new Date(value as string)
  return isNaN(d.getTime()) ? undefined : d
}

function toCvData(cv: any) {
  return {
    ...cv,
    personalInfo: {
      ...(cv.personalInfo ?? {}),
      dateOfBirth: toDate(cv.personalInfo?.dateOfBirth),
    },
    experience: (cv.experience ?? []).map((e: any) => ({
      ...e,
      startDate: toDate(e.startDate),
      endDate: toDate(e.endDate),
    })),
    education: (cv.education ?? []).map((e: any) => ({
      ...e,
      startDate: toDate(e.startDate),
      endDate: toDate(e.endDate),
    })),
    skills: cv.skills ?? [],
    projects: (cv.projects ?? []).map((p: any) => ({
      ...p,
      startDate: toDate(p.startDate),
      endDate: toDate(p.endDate),
    })),
    languages: cv.languages ?? [],
    certifications: (cv.certifications ?? []).map((c: any) => ({
      ...c,
      startDate: toDate(c.startDate),
      validDate: toDate(c.validDate),
    })),
    references: cv.references ?? [],
  }
}

export default function CVPdfPreviewCore({ cv }: { cv: any }) {
  const cvData = toCvData(cv)
  const visibility = cv.visibility ?? {}
  const portfolioItems = cv.portfolioItems ?? []
  const styleProps = {
    accentColor: cv.accentColor || DEFAULT_ACCENT_COLOR,
    headingFont: cv.headingFontId || DEFAULT_HEADING_FONT,
    bodyFont: cv.bodyFontId || DEFAULT_BODY_FONT,
  }
  const sidebarColor = cv.sidebarColor || "#172A45"
  const translations = (dashboardTranslations.en ?? dashboardTranslations) as typeof dashboardTranslations["en"]

  let element
  switch (cv.template) {
    case "minimalist":
      element = <MinimalistResumeTemplate data={cvData} visibility={visibility} translations={translations} {...styleProps} sidebarColor={sidebarColor} />
      break
    case "classic":
      element = <ClassicResumeTemplate data={cvData} visibility={visibility} translations={translations} {...styleProps} />
      break
    case "ats":
      element = <ATSResumeTemplate data={cvData} visibility={visibility} {...styleProps} />
      break
    case "konsult":
      element = <KonsultResumeTemplate data={cvData} visibility={visibility} translations={translations} {...styleProps} />
      break
    case "modern":
    default:
      element = <ModernResumeTemplate data={cvData} visibility={visibility} translations={translations} portfolioItems={portfolioItems} {...styleProps} />
      break
  }

  return (
    <PDFViewer style={{ width: "100%", height: "100%", border: "none" }} showToolbar>
      {element}
    </PDFViewer>
  )
}
