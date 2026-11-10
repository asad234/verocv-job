"use client"  // Todo: add button to show again might have skills popup and also fix addVisibleTrue function on local data.
import { useState, useEffect } from "react"
import {
  Briefcase,
  Code,
  Globe,
  Award,
  User,
  Plus,
  Edit,
  Eye,
  Download,
  Printer,
  GraduationCap,
  Building,
  EyeOff,
  Sparkles,
  FileText,
  Wand2,
  SaveAllIcon,
  AlertCircle,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { v4 as uuidv4 } from "uuid";
import { CollapsibleSection } from "./collapsible-section"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import type {
  PersonalInformation,
  Skill,
  ProjectDetails,
  Language,
  Reference,
  Certification,
  Education,
  SectionType,
  CVData,
  Experience
} from "@/utils/types"
import { PersonalInfoForm } from "./edit-forms/personal-info-form"
import { CertificationForm } from "./edit-forms/certification-form"
import { EducationForm } from "./edit-forms/education-form"
import { EmployerForm } from "./edit-forms/employer-form"
import { LanguageForm } from "./edit-forms/language-form"
import { ProjectForm } from "./edit-forms/project-form"
import { ReferenceForm } from "./edit-forms/reference-form"
import { SkillForm } from "./edit-forms/skill-form"
import { useToast } from "@/hooks/use-toast"
import { useProfileStore } from "@/utils/profileStore"
import { Icon } from "@iconify/react/dist/iconify.js"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { useDashboardTranslation, useDashboardTranslations } from "@/hooks/useDashboardTranslation"
import { useRouter } from "next/navigation"
import { ProfileRequiredDialog } from "@/components/Common/ProfileRequiredDialog"
import { Input } from "../ui/input"
import { toast as toastS } from "sonner"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import MightHaveSkillsPopup from "./mightHaveSkillsPopup"
import { MightHaveSkill } from "@/types/payloadTypes"
import LivePdfPreview from "./PdfViewer/livePdfViewer"
import MinimalistResumeTemplate from "./PdfViewer/MinimalistTemplate"
import ClassicResumeTemplate from "./PdfViewer/ClassicTemplate"
import ModernResumeTemplate from "./PdfViewer/ModernTemplate"
import { pdf } from "@react-pdf/renderer"
import ATSResumeTemplate from "./PdfViewer/ATS-Template";
import { downloadCvPdf } from "@/utils/pdfDownloadLink";
import { CardFooter } from "../ui/card";
import { SavedCoverLettersDialog } from "./SavedCoverLettersDialog";
import KonsultResumeTemplate from "./PdfViewer/Konsulttemplate";
import { BODY_FONT_ID_TO_PDF, HEADING_FONT_ID_TO_PDF } from "./PdfViewer/Cvfontregistry";
import { dashboardTranslations, DashboardTranslations } from '@/utils/dashboardTranslations';
import type { PortfolioItem } from "./PdfViewer/ModernTemplate"
import { ProfileLanguageSelector } from "./ProfileLanguageSelector";


interface SaveCVDialogProps {
  showSaveDialog: boolean
  setShowSaveDialog: (show: boolean) => void
  customCvName: string
  setCustomCvName: (name: string) => void
  isSaving: boolean
  handleConfirmSave: () => void
  cvData: {
    profile?: {
      title?: string
      firstName?: string
      lastName?: string
    }
  }
}

export function SaveCVDialog({
  showSaveDialog,
  setShowSaveDialog,
  customCvName,
  setCustomCvName,
  isSaving,
  handleConfirmSave,
  cvData,
}: SaveCVDialogProps) {
  const { t } = useDashboardTranslation()
}

export interface SectionVisibility {
  personalInfo: boolean
  skills: boolean
  languages: boolean
  projects: boolean
  references: boolean
  certifications: boolean
  experience?: boolean
  employers?: boolean
  education: boolean
  portfolios?: boolean
}
const defaultVisibility: SectionVisibility = {
  personalInfo: true,
  skills: true,
  languages: true,
  projects: true,
  references: true,
  certifications: true,
  employers: true,
  education: true,
  experience: true,
  portfolios: true,
};


type TemplateType = "minimalist" | "classic" | "modern" | "ats" | "konsult"


export const CV_HEADING_FONTS = [
  { id: 'playfair', name: 'Playfair Display', family: "'Playfair Display', serif", style: 'serif', sample: 'Elegant & Classic' },
  { id: 'montserrat', name: 'Montserrat', family: "'Montserrat', sans-serif", style: 'sans', sample: 'Bold & Modern' },
  { id: 'cormorant', name: 'Cormorant Garamond', family: "'Cormorant Garamond', serif", style: 'serif', sample: 'Refined & Literary' },
  { id: 'raleway', name: 'Raleway', family: "'Raleway', sans-serif", style: 'sans', sample: 'Sleek & Geometric' },
  { id: 'josefin', name: 'Josefin Sans', family: "'Josefin Sans', sans-serif", style: 'sans', sample: 'Clean & Minimal' },
  { id: 'dm-serif', name: 'DM Serif Display', family: "'DM Serif Display', serif", style: 'serif', sample: 'Sharp & Editorial' },
  { id: 'outfit', name: 'Outfit', family: "'Outfit', sans-serif", style: 'sans', sample: 'Friendly & Fresh' },
  { id: 'eb-garamond', name: 'EB Garamond', family: "'EB Garamond', serif", style: 'serif', sample: 'Scholarly & Timeless' },
  { id: 'libre-bask', name: 'Libre Baskerville', family: "'Libre Baskerville', serif", style: 'serif', sample: 'Authoritative' },
  { id: 'space-grotesk', name: 'Space Grotesk', family: "'Space Grotesk', sans-serif", style: 'sans', sample: 'Technical & Precise' },
] as const

export const CV_BODY_FONTS = [
  { id: 'inter', name: 'Inter', family: "'Inter', sans-serif", sample: 'Clean and highly readable at any size.' },
  { id: 'lato', name: 'Lato', family: "'Lato', sans-serif", sample: 'Warm and friendly for body copy.' },
  { id: 'open-sans', name: 'Open Sans', family: "'Open Sans', sans-serif", sample: 'Neutral and universally legible.' },
  { id: 'source-sans', name: 'Source Sans 3', family: "'Source Sans 3', sans-serif", sample: 'Optimized for long-form reading.' },
  { id: 'nunito', name: 'Nunito', family: "'Nunito', sans-serif", sample: 'Rounded and approachable in tone.' },
  { id: 'dm-sans', name: 'DM Sans', family: "'DM Sans', sans-serif", sample: 'Modern geometry with clarity.' },
  { id: 'jost', name: 'Jost', family: "'Jost', sans-serif", sample: 'Geometric yet warm in body text.' },
  { id: 'pt-sans', name: 'PT Sans', family: "'PT Sans', sans-serif", sample: 'Sturdy and reliable for dense content.' },
  { id: 'merriweather', name: 'Merriweather', family: "'Merriweather', serif", sample: 'Crisp serif optimized for screens.' },
  { id: 'crimson', name: 'Crimson Pro', family: "'Crimson Pro', serif", sample: 'Elegant serif for a refined document.' },
] as const


export type HeadingFontId = typeof CV_HEADING_FONTS[number]['id']
export type BodyFontId = typeof CV_BODY_FONTS[number]['id']

export function CVBuilder({ cvDataDigital }: { cvDataDigital?: CVData }) {
  // 2. Call the hook at the top level of the component
  const { data: session } = useSession();
  const { toast } = useToast()
  const { t } = useDashboardTranslations()
  const router = useRouter()
  const params = useParams()
  const { personalInformation, projectDetails, skills, references, certifications, employers, education, languages } =
    useProfileStore()

  const [cvData, setCvData] = useState<CVData>({});
  const [showProfileEmptyDialog, setShowProfileEmptyDialog] = useState(false)
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [savingCoverLetter, setSavingCoverLetter] = useState(false)

  const [hasCoverLetters, setHasCoverLetters] = useState(false)
  const [showSavedCoverLettersDialog, setShowSavedCoverLettersDialog] = useState(false)



  const allowedTemplates: TemplateType[] = ["modern", "classic", "minimalist", "ats", "konsult"];

  const addVisibleTrue = <T extends { visible?: boolean }>(items?: T[]): T[] =>
    Array.isArray(items)
      ? items.map(item => ({ ...item, visible: item.visible ?? true }))
      : [];


  // Section visibility state

  const [visibility, setVisibility] = useState(defaultVisibility);

  const getCvId = (): string => {
    const digitalId = cvDataDigital?.id
    const paramId = params?.id

    // Try digital CV ID first
    if (digitalId) return digitalId

    // Then try params ID
    if (!paramId) return ""

    // Handle array or string from params
    if (Array.isArray(paramId)) {
      return paramId[0] || ""  // Array element could be undefined
    }

    return paramId
  }

  useEffect(() => {
    if (isDataInitialized) return;

    const hasDigitalData =
      !!cvDataDigital?.personalInfo &&
      [
        cvDataDigital.skills,
        cvDataDigital.experience ?? cvDataDigital.employers,
        cvDataDigital.education,
        cvDataDigital.projects,
        cvDataDigital.languages,
        cvDataDigital.certifications,
        cvDataDigital.references,
      ].some(arr => (arr?.length ?? 0) > 0);

    if (hasDigitalData) {
      setCvData({
        personalInfo: cvDataDigital.personalInfo,
        projects: addVisibleTrue(cvDataDigital.projects),
        skills: addVisibleTrue(cvDataDigital.skills),
        references: addVisibleTrue(cvDataDigital.references),
        certifications: addVisibleTrue(cvDataDigital.certifications),
        experience: addVisibleTrue(
          cvDataDigital.experience ?? cvDataDigital.employers
        ),
        education: addVisibleTrue(cvDataDigital.education),
        languages: addVisibleTrue(cvDataDigital.languages),
      });

      // FIX: Merge saved visibility with defaults to ensure all properties exist
      setVisibility({
        ...defaultVisibility,
        ...cvDataDigital.visibility
      });

      setTemplate(
        allowedTemplates.includes(cvDataDigital.template as TemplateType)
          ? (cvDataDigital.template as TemplateType)
          : "modern"

      );
      setSelectedColor(cvDataDigital.accentColor ?? '#051650');
      setSelectedHeadingFont((cvDataDigital.headingFontId ?? 'montserrat') as HeadingFontId);
      setSelectedBodyFont((cvDataDigital.bodyFontId ?? 'inter') as BodyFontId);
    } else {
      setCvData({
        personalInfo: personalInformation!,
        projects: addVisibleTrue(projectDetails),
        skills: addVisibleTrue(skills),
        references: addVisibleTrue(references),
        certifications: addVisibleTrue(certifications),
        experience: addVisibleTrue(employers),
        education: addVisibleTrue(education),
        languages: addVisibleTrue(languages),
      });

      setVisibility(defaultVisibility);
      setTemplate("modern");
    }

    setIsDataInitialized(true);
  }, [
    cvDataDigital,
    personalInformation,
    projectDetails,
    skills,
    references,
    certifications,
    employers,
    education,
    languages,
    isDataInitialized,
  ]);

  useEffect(() => {
    if (!isDataInitialized) return;
    if (!session?.user?.id) return;

    const hasPersonalInfo =
      !!cvData.personalInfo?.firstName ||
      !!cvData.personalInfo?.lastName ||
      !!cvData.personalInfo?.title;

    const hasAnyData =
      hasPersonalInfo ||
      (cvData.skills?.length ?? 0) > 0 ||
      (cvData.experience?.length ?? 0) > 0 ||
      (cvData.education?.length ?? 0) > 0 ||
      (cvData.projects?.length ?? 0) > 0;

    setShowProfileEmptyDialog(!hasAnyData);
  }, [isDataInitialized, session?.user?.id, cvData]);



  // Template state
  const [template, setTemplate] = useState<TemplateType>("modern")

  //Cover Letter
  const [createCoverLetterOpen, setCreateCoverLetterOpen] = useState(false)
  const [jobTitle, setJobTitle] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [selectedTone, setSelectedTone] = useState<"professional" | "enthusiastic" | "formal" | "casual">(
    "professional",
  )
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false)
  const [showCoverLetterResult, setShowCoverLetterResult] = useState(false)
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState("")
  const [isClosing, setIsClosing] = useState(false)

  // Form states
  const [personalInfoFormOpen, setPersonalInfoFormOpen] = useState(false)
  const [skillFormOpen, setSkillFormOpen] = useState(false)
  const [projectFormOpen, setProjectFormOpen] = useState(false)
  const [languageFormOpen, setLanguageFormOpen] = useState(false)
  const [referenceFormOpen, setReferenceFormOpen] = useState(false)
  const [certificationFormOpen, setCertificationFormOpen] = useState(false)
  const [employerFormOpen, setEmployerFormOpen] = useState(false)
  const [educationFormOpen, setEducationFormOpen] = useState(false)

  const [selectedColor, setSelectedColor] = useState('#051650')
  const [selectedSidebarColor, setSelectedSidebarColor] = useState('#172A45')

  const [activeProfileId, setActiveProfileId] = useState<number | string | null>(null)


  const CV_ACCENT_COLORS = [
    { hex: '#051650', label: t.colorNavy },
    { hex: '#1a0a3d', label: t.colorViolet },
    { hex: '#0d3b2a', label: t.colorForest },
    { hex: '#5c1a2e', label: t.colorBurgundy },
    { hex: '#1b3a5c', label: t.colorSteel },
    { hex: '#0a4a4a', label: t.colorTeal },
    { hex: '#2c2c3e', label: t.colorCharcoal },
    { hex: '#7a2718', label: t.colorRust },
    { hex: '#2d1b69', label: t.colorIndigo },
    { hex: '#1e3a4a', label: t.colorSlate },
  ]


  const [selectedHeadingFont, setSelectedHeadingFont] = useState<HeadingFontId>('montserrat')
  const [selectedBodyFont, setSelectedBodyFont] = useState<BodyFontId>('inter')


  // New states for the tailor CV popup
  const [tailorCVOpen, setTailorCVOpen] = useState(false)
  const [isTailoring, setIsTailoring] = useState(false)

  // NEW: Add this function right after getDuplicateSkills
  const getDuplicateLanguages = () => {
    const languages = cvData!.languages || []
    const languageNames = languages.map(l => l.language?.toLowerCase().trim()).filter(Boolean)
    const duplicates = new Set(languageNames.filter((name, index) => languageNames.indexOf(name) !== index))
    return duplicates
  }

  // NEW: Add these two lines
  const duplicateLanguages = getDuplicateLanguages()
  const hasDuplicateLanguages = duplicateLanguages.size > 0

  // Add this function in cv-builder.tsx after the state declarations

  const getDuplicateSkills = () => {
    const skills = cvData!.skills || []
    const skillNames = skills.map(s => s.skillName?.toLowerCase().trim()).filter(Boolean)
    const duplicates = new Set(skillNames.filter((name, index) => skillNames.indexOf(name) !== index))
    return duplicates
  }

  // Then you can use it to show a warning in the UI
  const duplicateSkills = getDuplicateSkills()
  const hasDuplicateSkills = duplicateSkills.size > 0

  // Edit states
  const [editingSkill, setEditingSkill] = useState<Skill | undefined>()
  const [editingProject, setEditingProject] = useState<ProjectDetails | undefined>()
  const [editingLanguage, setEditingLanguage] = useState<Language | undefined>()
  const [editingReference, setEditingReference] = useState<Reference | undefined>()
  const [editingCertification, setCertificationEditing] = useState<Certification | undefined>()
  const [editingEmployer, setEditingEmployer] = useState<Experience | undefined>()
  const [editingEducation, setEditingEducation] = useState<Education | undefined>()
  // ── Portfolio ──────────────────────────────────────────────────────────────
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])

  // Add these new states after the existing state declarations
  const [showSyncDialog, setShowSyncDialog] = useState(false)
  const [itemsToSync, setItemsToSync] = useState<{
    employers: any[]
    education: any[]
    languages: any[]
    certifications: any[]
    projects: any[]
    references: any[]
  }>({
    employers: [],
    education: [],
    languages: [],
    certifications: [],
    projects: [],
    references: [],
  })
  const [pendingSaveData, setPendingSaveData] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false) // collapsible state for visiblity section
  const [isTemplateOpen, setIsTemplateOpen] = useState(false)
  const [isAccentColorOpen, setIsAccentColorOpen] = useState(false)
  const [isFontOpen, setIsFontOpen] = useState(false)
  //CV states
  // Loading state
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);

  // The final filtered CV data returned from the API
  const [filteredCV, setFilteredCV] = useState<any>({});

  // Toggle showing the CV result modal or section
  const [showCVResult, setShowCVResult] = useState(false);

  // Toggle creating CV form/modal open or closed
  const [createCVOpen, setCreateCVOpen] = useState(false);


  // Add these new states to your CV Builder component (add to the existing state declarations)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [customCvName, setCustomCvName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const [itemToToggleVisibility, setItemToToggleVisibility] = useState<{
    type: SectionType
    id: string
    visible: boolean
  } | null>(null)

  // Toggle section visibility
  const toggleVisibility = (section: keyof SectionVisibility) => {
    setVisibility({
      ...visibility,
      [section]: !visibility[section],
    })
  }

  const [isDownloading, setIsDownloading] = useState(false)

  // View mode state for tablet/small laptop screens
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')

  // More robust version with better error handling
  const handleItemToggleVisibility = (
    type: SectionType | 'projectDetails' | 'employers', // include legacy
    id: string,
    currentVisible: boolean
  ) => {
    setCvData((prev) => {
      if (!prev) return prev;

      // Map both modern and legacy section keys to CVData keys
      const sectionKeyMap: Record<string, keyof CVData> = {
        personalInfo: 'personalInfo',
        skills: 'skills',
        projects: 'projects',
        projectDetails: 'projects', // legacy
        references: 'references',
        certifications: 'certifications',
        employers: 'employers', // legacy
        education: 'education',
        languages: 'languages',
        experience: 'experience',
      };

      const key = sectionKeyMap[type];
      if (!key) return prev;

      const array = prev[key] as Array<{ id: string; visible?: boolean }> | undefined;
      if (!array || array.length === 0) {
        console.warn(`No ${type} array found or array is empty`);
        return prev;
      }

      const itemExists = array.some((item) => item.id === id);
      if (!itemExists) {
        console.warn(`Item with id ${id} not found in ${type}`);
        return prev;
      }

      const updatedArray = array.map((item) =>
        item.id === id ? { ...item, visible: !currentVisible } : item
      );

      const updatedData: CVData = { ...prev, [key]: updatedArray };

      requestAnimationFrame(() => {
        toast({
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} ${!currentVisible ? t.itemShown : t.itemHidden
            }`,
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} ${t.has
            } ${!currentVisible ? t.itemMadeVisible : t.itemHiddenDesc}.`,
        });
      });

      setItemToToggleVisibility(null);
      return updatedData;
    });
  };

  const handleProfileLoaded = (profileData: any) => {
    setActiveProfileId(profileData.id)
    setIsDataInitialized(false) // forces CVBuilder to re-initialize with new data

    // Map profile data into the cvData shape
    const details = profileData.profileDetails ?? {}
    setCvData({
      personalInfo: profileData.personalInformation ?? {},
      projects: addVisibleTrue(details.projectDetails ?? []),
      skills: addVisibleTrue(details.skills ?? []),
      employers: addVisibleTrue(details.employers ?? []),
      experience: addVisibleTrue(details.employers ?? []),
      education: addVisibleTrue(details.education ?? []),
      certifications: addVisibleTrue(details.certifications ?? []),
      languages: addVisibleTrue(details.languages ?? []),
      references: addVisibleTrue(details.references ?? []),
    })
    setIsDataInitialized(true)
  }


  //Might Have Skills popup
  const [open, setOpen] = useState(false)
  const [MightHaveSkills, setMightHaveSkills] = useState<MightHaveSkill[]>([])

  const handleSaveMightHaveSkills = (
    selected: { skillName: string; rating?: number; years?: number }[]
  ) => {
    console.log("User selected skills:", selected);

    setCvData((prev) => {
      if (!prev) return prev;

      const newSkills = selected.map((s) => ({
        id: uuidv4(),          // generate unique ID
        skillName: s.skillName,
        skillRating: s.rating,
        skillYearsExperience: s.years,
        visible: true,         // ensure visible
      }));

      return {
        ...prev,
        skills: [...(prev.skills ?? []), ...newSkills],
      };
    });
  };

  // New handler for tailoring CV / generating job-tailored CV
  const handleTailorCV = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: t.jobDescriptionRequired,
        description: t.jobDescriptionRequiredDesc,
        variant: "destructive",
      });
      return;
    }

    setIsTailoring(true);

    const toastId = toastS.loading(t.generatingCV, {
      description: t.cvGenerationInProgress,
      duration: Number.POSITIVE_INFINITY,
      position: "top-center",
    });

    try {
      const response = await fetch("/api/generate-cv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobAd: jobDescription,
          personalInfo: {
            ...personalInformation,
            ...cvData.personalInfo,
            socialLinks: {
              ...personalInformation?.socialLinks,
              ...cvData.personalInfo?.socialLinks,
            },
          },
          resumeData: {
            skills: [...(skills || []), ...(cvData.skills || [])].filter(
              (skill, index, array) =>
                array.findIndex((s) => s.skillName === skill.skillName) === index
            ),
            employers: employers.length > 0 ? employers : cvData.employers,
            education: education.length > 0 ? education : cvData.education,
            certifications: certifications.length > 0 ? certifications : cvData.certifications,
            projects: cvData.projects || [],
          },
        }),
      });


      const result = await response.json();

      if (result.success) {
        const hasMatches = result?.metadata?.hasMatches;

        if (!hasMatches) {
          toastS.warning(t.noMatchesFound || "No relevant matches found.", {
            id: toastId,
            description: t.tryImprovingProfile || "Try a different job description for better results.",
            duration: 4000,
            position: "top-center",
            className: "bg-yellow-50 border-yellow-200 text-yellow-800",
          });
          setShowCVResult(false);
          setTailorCVOpen(false);
          return;
        }

        // Add unique IDs to all items returned from API
        const addUniqueIds = (items: any[], section: string) => {
          if (!items || !Array.isArray(items)) return items;
          return items.map((item, index) => ({
            ...item,
            id: item.id || `${section}-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
            visible: item.visible !== undefined ? item.visible : true // Ensure visible property
          }));
        };

        const updatedCV = {
          ...cvData,
          // Add unique IDs to all API returned data
          employers: addUniqueIds(result.data.filteredResume.employers, 'employer') || cvData.employers,
          skills: addUniqueIds(result.data.filteredResume.skills, 'skill') || cvData.skills,
          projects: addUniqueIds(result.data.filteredResume.projects, 'project') || cvData.projects,
          education: addUniqueIds(result.data.filteredResume.education, 'education') || cvData.education,
          certifications: addUniqueIds(result.data.filteredResume.certifications, 'certification') || cvData.certifications,
          mightHave: result.data.mightHave || [],
        };

        setCvData(updatedCV);
        setShowCVResult(true);
        setTailorCVOpen(false);

        if (result.data.mightHave && result.data.mightHave.length > 0) {
          console.log(result.data.mightHave);
          setMightHaveSkills(result.data.mightHave)
          setOpen(true);
          toastS.info(
            `Found ${result.data.mightHave.length} suggested skills to develop`,
            {
              duration: 4000,
              position: "top-center",
            }
          );
        }

        toastS.success(t.cvGenerationSuccess, {
          id: toastId,
          description: t.cvGenerationSuccessDesc,
          duration: 3000,
          position: "top-center",
          className: "bg-green-50 border-green-200 text-green-800",
        });
      } else {
        console.error("Failed to generate CV:", result.error);

        toastS.error(t.generationError, {
          id: toastId,
          description: result.error || t.generationErrorDescription,
          duration: 5000,
          position: "top-center",
          className: "bg-red-50 border-red-200 text-red-800",
        });
      }
    } catch (error) {
      console.error("Error generating CV:", error);

      toastS.error(t.generationError, {
        id: toastId,
        description: t.generationErrorDescription,
        duration: 5000,
        position: "top-center",
        className: "bg-red-50 border-red-200 text-red-800",
      });
    } finally {
      setIsTailoring(false);
    }
  };

  const checkForCoverLetters = async () => {
    const cvId = getCvId()
    if (!session?.user?.id) return

    try {
      // Fetch all cover letters for this user (optionally filtered by CV)
      const url = cvId
        ? `/api/cover-letters?userId=${session.user.id}&cvId=${cvId}`
        : `/api/cover-letters?userId=${session.user.id}`

      const response = await fetch(url)
      const result = await response.json()

      if (response.ok && result.success) {
        setHasCoverLetters((result.data || []).length > 0)
      }
    } catch (error) {
      console.error("Error checking cover letters:", error)
    }
  }

  useEffect(() => {
    if (session?.user?.id && (cvDataDigital?.id || params?.id)) {
      checkForCoverLetters()
    }
  }, [session?.user?.id, cvDataDigital?.id, params?.id])

  // Fetch portfolio items so we can show them in the CV builder
  useEffect(() => {
    if (!session?.user?.id) return
    fetch("/api/portfolios")
      .then((r) => r.json())
      .then(({ items }) => {
        setPortfolioItems(
          (items ?? []).map((item: any) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            type: item.type as "image" | "video" | "youtube" | "link" | "document",
            visible: item.visible ?? true,
            imageUrl: item.imageUrl,
            videoUrl: item.videoUrl,
            youtubeUrl: item.youtubeUrl,
            youtubeVideoId: item.youtubeVideoId,
            linkUrl: item.linkUrl,
            documentUrl: item.documentUrl,
            documentName: item.documentName,
          }))
        )
      })
      .catch(console.error)
  }, [session?.user?.id])




  // Save handlers
  // Save handlers
  const handleSavePersonalInfo = (personalInfo: PersonalInformation) => {
    setCvData({ ...cvData, personalInfo: personalInfo })
    toast({
      title: t.profileUpdated,
      description: t.profileUpdatedDesc,
    })
  }
  // Pre-warm the API connection
  useEffect(() => {
    // Pre-connect to API when dialog opens
    if (createCoverLetterOpen) {
      fetch("/api/generate-cover", { method: "HEAD" }).catch(() => { })
    }
  }, [createCoverLetterOpen])
  // Generate Cover letter Handler
  const handleCreateCoverLetter = async () => {
    setIsGeneratingCoverLetter(true)

    const toastId = toastS.loading(t.generatingCoverLetter, {
      description: t.generationInProgress,
      duration: Number.POSITIVE_INFINITY,
      position: "top-center",
    })

    try {
      // Helper to sanitize dates - convert Date to ISO string or return empty string
      const sanitizeDate = (date: any): string => {
        if (!date) return ''
        if (date instanceof Date) {
          return date.toISOString()
        }
        if (typeof date === 'string' && date.trim()) {
          // Try to parse and convert to ISO
          try {
            return new Date(date).toISOString()
          } catch {
            return ''
          }
        }
        return ''
      }

      // Helper to sanitize email
      const sanitizeEmail = (email: any): string => {
        if (!email || typeof email !== 'string') return ''
        const trimmed = email.trim()
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(trimmed) ? trimmed : ''
      }

      // Helper to sanitize regular strings
      const sanitizeString = (value: any): string => {
        if (value === null || value === undefined) return ''
        return String(value).trim()
      }

      // Helper to sanitize URL
      const sanitizeUrl = (url: any): string | null => {
        if (!url || typeof url !== 'string') return null
        const trimmed = url.trim()
        if (trimmed === '') return ''

        try {
          new URL(trimmed)
          return trimmed
        } catch {
          return ''
        }
      }

      // Helper to sanitize social links
      const sanitizeSocialLinks = (links: any): Record<string, string | null> => {
        if (!links || typeof links !== 'object') return {}

        const sanitized: Record<string, string | null> = {}
        Object.keys(links).forEach(key => {
          const value = links[key]
          if (value === undefined) {
            sanitized[key] = null
          } else if (value === null || value === '') {
            sanitized[key] = ''
          } else {
            sanitized[key] = sanitizeUrl(value)
          }
        })
        return sanitized
      }

      // Sanitize employer data
      const sanitizeEmployers = (employers: Experience[]): any[] => {
        if (!employers || !Array.isArray(employers)) return []

        return employers.map(emp => ({
          employer: sanitizeString(emp.employer),
          title: sanitizeString(emp.title),
          startDate: sanitizeDate(emp.startDate),
          endDate: sanitizeDate(emp.endDate),
          ongoing: Boolean(emp.ongoing),
          description: sanitizeString(emp.description),
          achievements: sanitizeString(emp.achievements),
          link: sanitizeString(emp.link),
        }))
      }

      // Sanitize education data
      const sanitizeEducation = (education: Education[]): any[] => {
        if (!education || !Array.isArray(education)) return []

        return education.map(edu => ({
          school: sanitizeString(edu.school),
          program: sanitizeString(edu.program),
          level: sanitizeString(edu.level),
          place: sanitizeString(edu.place),
          startDate: sanitizeDate(edu.startDate),
          endDate: sanitizeDate(edu.endDate),
          ongoing: Boolean(edu.ongoing),
          description: sanitizeString(edu.description),
          link: sanitizeString(edu.link),
        }))
      }

      // Sanitize certification data
      const sanitizeCertifications = (certifications: Certification[]): any[] => {
        if (!certifications || !Array.isArray(certifications)) return []

        return certifications.map(cert => ({
          title: sanitizeString(cert.title),
          issuer: sanitizeString(cert.issuer),
          startDate: sanitizeDate(cert.startDate),
          validDate: cert.noExpiry ? null : sanitizeDate(cert.validDate),
          description: sanitizeString(cert.description),
        }))
      }

      // Sanitize project data
      const sanitizeProjects = (projects: ProjectDetails[]): any[] => {
        if (!projects || !Array.isArray(projects)) return []

        return projects.map(proj => ({
          role: sanitizeString(proj.role),
          company: sanitizeString(proj.company),
          startDate: sanitizeDate(proj.startDate),
          endDate: sanitizeDate(proj.endDate),
          isCurrent: Boolean(proj.isCurrent),
          description: sanitizeString(proj.description),
          skills: sanitizeString(proj.skills),
        }))
      }

      // Sanitize skills data
      const sanitizeSkills = (skills: Skill[]): any[] => {
        if (!skills || !Array.isArray(skills)) return []

        return skills.map(skill => ({
          skillName: sanitizeString(skill.skillName),
          skillRating: skill.skillRating || undefined,
          skillYearsExperience: skill.skillYearsExperience || undefined,
        }))
      }

      // Get the best email value
      const getEmail = (email1: any, email2: any): string => {
        const sanitized1 = sanitizeEmail(email1)
        const sanitized2 = sanitizeEmail(email2)
        return sanitized1 || sanitized2
      }

      // Combine and deduplicate skills
      const allSkills = [...(skills || []), ...(cvData.skills || [])]
      const uniqueSkills = allSkills.filter(
        (skill, index, array) => array.findIndex((s) => s.skillName === skill.skillName) === index
      )

      const response = await fetch("/api/generate-cover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobAd: jobDescription,
          personalInfo: {
            firstName: sanitizeString(personalInformation?.firstName || cvData.personalInfo?.firstName),
            lastName: sanitizeString(personalInformation?.lastName || cvData.personalInfo?.lastName),
            homeAddress: sanitizeString(personalInformation?.homeAddress || cvData.personalInfo?.homeAddress),
            phoneNumber: sanitizeString(personalInformation?.phoneNumber || cvData.personalInfo?.phoneNumber),
            workPhoneNumber: sanitizeString(personalInformation?.workPhoneNumber || cvData.personalInfo?.workPhoneNumber),
            privateEmail: getEmail(personalInformation?.privateEmail, cvData.personalInfo?.privateEmail),
            workEmail: getEmail(personalInformation?.workEmail, cvData.personalInfo?.workEmail),
            title: sanitizeString(personalInformation?.title || cvData.personalInfo?.title),
            professionalPresentation: sanitizeString(
              personalInformation?.personalPresentation || cvData.personalInfo?.professionalPresentation
            ),
            socialLinks: sanitizeSocialLinks({
              ...personalInformation?.socialLinks,
              ...cvData.personalInfo?.socialLinks,
            }),
          },
          resumeData: {
            skills: sanitizeSkills(uniqueSkills),
            employers: sanitizeEmployers(employers.length > 0 ? employers : cvData.employers || []),
            education: sanitizeEducation(education.length > 0 ? education : cvData.education || []),
            certifications: sanitizeCertifications(certifications.length > 0 ? certifications : cvData.certifications || []),
            projects: sanitizeProjects(cvData.projects || []),
          },
          tone: selectedTone,
          maxLength: 350,
          language: "sv",
        }),
      })

      const result = await response.json()

      if (result.success) {
        setGeneratedCoverLetter(result.data.coverLetter || "")
        setShowCoverLetterResult(true)
        setCreateCoverLetterOpen(false)

        toastS.success(t.generationSuccess, {
          id: toastId,
          description: t.generationSuccessDescription,
          duration: 3000,
          position: "top-center",
          className: "bg-green-50 border-green-200 text-green-800",
        })
      } else {
        console.error("Failed to generate cover letter:", result.error)

        if (result.details) {
          console.error("Validation errors:", result.details)
        }

        toastS.error(t.generationError, {
          id: toastId,
          description: result.error || t.generationErrorDescription,
          duration: 5000,
          position: "top-center",
          className: "bg-red-50 border-red-200 text-red-800",
        })
      }
    } catch (error) {
      console.error("Error generating cover letter:", error)

      toastS.error(t.generationError, {
        id: toastId,
        description: t.generationErrorDescription,
        duration: 5000,
        position: "top-center",
        className: "bg-red-50 border-red-200 text-red-800",
      })
    } finally {
      setIsGeneratingCoverLetter(false)
    }
  }

  // Save Cover Letter Handlers
  const handleCopyCoverLetter = async () => {
    try {
      await navigator.clipboard.writeText(generatedCoverLetter)

      // Success toast
      toastS.success(t.copySuccess, {
        description: t.copySuccessDescription,
        duration: 2000,
        position: "top-center",
        className: "bg-green-50 border-green-200 text-green-800",
      })
    } catch (err) {
      console.error("Failed to copy:", err)

      // Error toast
      toastS.error(t.copyError, {
        description: t.copyErrorDescription,
        duration: 3000,
        position: "top-center",
        className: "bg-red-50 border-red-200 text-red-800",
      })
    }
  }

  const handleDownloadCoverLetter = () => {
    try {
      const element = document.createElement("a")
      const file = new Blob([generatedCoverLetter], { type: "text/plain" })
      element.href = URL.createObjectURL(file)
      element.download = "cover-letter.txt"
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)

      // Download success toast
      toastS.success(t.downloadSuccess, {
        description: t.downloadSuccessDescription,
        duration: 2000,
        position: "top-center",
        className: "bg-blue-50 border-blue-200 text-blue-800",
      })
    } catch (err) {
      console.error("Download failed:", err)
      toastS.error(t.downloadError, {
        description: t.downloadErrorDescription,
        duration: 3000,
        position: "top-center",
      })
    }
  }
  const handleSaveCoverLetter = async () => {
    if (!session?.user?.id) {
      toast({
        title: t.authenticationRequired,
        description: t.pleaseLogin,
        variant: "destructive",
      })
      return
    }

    const cvId = getCvId() // Optional - can be empty

    console.log('💾 Saving cover letter');
    console.log('👤 User ID:', session.user.id);
    console.log('📄 CV ID (optional):', cvId || 'None');

    setSavingCoverLetter(true)

    try {
      const response = await fetch('/api/cover-letters', { // NEW ENDPOINT
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: generatedCoverLetter,
          jobTitle,
          companyName,
          jobDescription,
          tone: selectedTone,
          notes: '',
          userId: session.user.id,
          cvId: cvId || null, // Optional - link to CV if exists
        }),
      })

      const result = await response.json()

      console.log('📬 API Response:', result);

      if (response.ok && result.success) {
        toastS.success(t.coverLetterSaved, {
          description: t.coverLetterSavedDesc,
          duration: 3000,
          position: "top-center",
        })

        setHasCoverLetters(true)
        setShowCoverLetterResult(false)

        // Reset form
        setJobTitle("")
        setCompanyName("")
        setJobDescription("")
        setSelectedTone("professional")

        // Refresh if we have a CV
        if (cvId) {
          await checkForCoverLetters()
        }
      } else {
        throw new Error(result.error || 'Failed to save cover letter')
      }
    } catch (error) {
      console.error('❌ Error saving cover letter:', error)
      toast({
        title: t.saveFailed,
        description: error instanceof Error ? error.message : t.tryAgainLater,
        variant: "destructive",
      })
    } finally {
      setSavingCoverLetter(false)
    }
  }
  const handleSaveSkill = (skill: Skill) => {
    if (editingSkill) {
      const updatedSkills =
        cvData.skills?.map((s) => (s.id === editingSkill.id ? { ...skill, visible: true } : s)) || []
      setCvData({ ...cvData, skills: updatedSkills })
      setEditingSkill(undefined)
      toast({
        title: t.skillUpdated,
        description: `${skill.skillName} ${t.skillUpdatedDesc}`,
      })
    } else {
      const newSkill = {
        ...skill,
        id: Date.now().toString(),
        visible: true,
      }
      setCvData({ ...cvData, skills: [...(cvData.skills || []), newSkill] })
      toast({
        title: t.skillAdded,
        description: `${skill.skillName} ${t.skillAddedDesc}`,
      })
    }
  }

  const handleSaveProject = (project: ProjectDetails) => {
    if (editingProject) {
      const updatedProjects =
        cvData.projects?.map((p) => (p.id === editingProject.id ? { ...project, visible: true } : p)) || []
      setCvData({ ...cvData, projects: updatedProjects })
      setEditingProject(undefined)
      toast({
        title: t.projectUpdated,
        description: `${project.role} ${t.at} ${project.company} ${t.projectUpdatedDesc}`,
      })
    } else {
      const newProject = {
        ...project,
        id: Date.now().toString(),
        visible: true,
      }
      setCvData({ ...cvData, projects: [...(cvData.projects || []), newProject] })
      toast({
        title: t.projectAdded,
        description: `${project.role} ${t.at} ${project.company} ${t.projectAddedDesc}`,
      })
    }
  }

  const handleSaveLanguage = (language: Language) => {
    if (editingLanguage) {
      const updatedLanguages =
        cvData.languages?.map((l) => (l.id === editingLanguage.id ? { ...language, visible: true } : l)) || []
      setCvData({ ...cvData, languages: updatedLanguages })
      setEditingLanguage(undefined)
      toast({
        title: t.languageUpdated,
        description: `${language.language} ${t.languageUpdatedDesc}`,
      })
    } else {
      const newLanguage = {
        ...language,
        id: Date.now().toString(),
        visible: true,
      }
      setCvData({ ...cvData, languages: [...(cvData.languages || []), newLanguage] })
      toast({
        title: t.languageAdded,
        description: `${language.language} ${t.languageAddedDesc}`,
      })
    }
  }


  const handleSaveReference = (reference: Reference) => {
    if (editingReference) {
      const updatedReferences =
        cvData.references?.map((r) => (r.id === editingReference.id ? { ...reference, visible: true } : r)) || []
      setCvData({ ...cvData, references: updatedReferences })
      setEditingReference(undefined)
      toast({
        title: t.referenceUpdated,
        description: `${reference.firstName} ${reference.lastName} ${t.referenceUpdatedDesc}`,
      })
    } else {
      const newReference = {
        ...reference,
        id: Date.now().toString(),
        visible: true,
      }
      setCvData({ ...cvData, references: [...(cvData.references || []), newReference] })
      toast({
        title: t.referenceAdded,
        description: `${reference.firstName} ${reference.lastName} ${t.referenceAddedDesc}`,
      })
    }
  }

  const handleSaveCertification = (certification: Certification) => {
    if (editingCertification) {
      const updatedCertifications =
        cvData.certifications?.map((c) =>
          c.id === editingCertification.id ? { ...certification, visible: true } : c,
        ) || []
      setCvData({ ...cvData, certifications: updatedCertifications })
      setCertificationEditing(undefined)
      toast({
        title: t.certificationUpdated,
        description: `${certification.title} ${t.certificationUpdatedDesc}`,
      })
    } else {
      const newCertification = {
        ...certification,
        id: Date.now().toString(),
        visible: true,
      }
      setCvData({ ...cvData, certifications: [...(cvData.certifications || []), newCertification] })
      toast({
        title: t.certificationAdded,
        description: `${certification.title} ${t.certificationAddedDesc}`,
      })
    }
  }

  const handleSaveEmployer = (employer: Experience) => {
    setCvData((prev) => {
      const currentExperience = Array.isArray(prev.experience)
        ? [...prev.experience]
        : []

      if (editingEmployer) {
        const updated = currentExperience.map((e) =>
          String(e.id) === String(editingEmployer.id)
            ? { ...e, ...employer, visible: true }
            : e
        )

        return {
          ...prev,
          experience: updated,
        }
      }

      return {
        ...prev,
        experience: [
          ...currentExperience,
          {
            ...employer,
            id: String(Date.now()),
            visible: true,
          },
        ],
      }
    })

    setEditingEmployer(undefined)
  }

  const handleSaveEducation = (education: Education) => {
    if (editingEducation) {
      const updatedEducation =
        cvData.education?.map((e) => (e.id === editingEducation.id ? { ...education, visible: true } : e)) || []
      setCvData({ ...cvData, education: updatedEducation })
      setEditingEducation(undefined)
      toast({
        title: t.educationUpdated,
        description: `${education.program} ${t.at} ${education.school} ${t.educationUpdatedDesc}`,
      })
    } else {
      const newEducation = {
        ...education,
        id: Date.now().toString(),
        visible: true,
      }
      setCvData({ ...cvData, education: [...(cvData.education || []), newEducation] })
      toast({
        title: t.educationAdded,
        description: `${education.program} ${t.at} ${education.school} ${t.educationAddedDesc}`,
      })
    }
  }

  // Edit handlers
  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill)
    setSkillFormOpen(true)
  }

  const handleEditProject = (project: ProjectDetails) => {
    setEditingProject(project)
    setProjectFormOpen(true)
  }

  const handleEditLanguage = (language: Language) => {
    setEditingLanguage(language)
    setLanguageFormOpen(true)
  }

  const handleEditReference = (reference: Reference) => {
    setEditingReference(reference)
    setReferenceFormOpen(true)
  }

  const handleEditCertification = (certification: Certification) => {
    setCertificationEditing(certification)
    setCertificationFormOpen(true)
  }

  const handleEditEmployer = (employer: Experience) => {
    setEditingEmployer({ ...employer })
    setEmployerFormOpen(true)
  }

  const handleEditEducation = (education: Education) => {
    setEditingEducation(education)
    setEducationFormOpen(true)
  }


  console.log("CV DATA EMPLOYERS RENDER:", cvData)

  const handlePrintPreview = async () => {
    try {
      const translations = dashboardTranslations[/* your locale state */ 'en'] as DashboardTranslations;
      const styleProps = {
        accentColor: selectedColor,
        headingFont: HEADING_FONT_ID_TO_PDF[selectedHeadingFont],
        bodyFont: BODY_FONT_ID_TO_PDF[selectedBodyFont],
      };

      let element;
      switch (template) {
        case 'minimalist':
          element = <MinimalistResumeTemplate data={cvData} visibility={visibility} translations={translations} {...styleProps} sidebarColor={selectedSidebarColor} />;
          break;
        case 'ats':
          element = <ATSResumeTemplate data={cvData} visibility={visibility} {...styleProps} />;
          break;
        case 'classic':
          element = <ClassicResumeTemplate data={cvData} visibility={visibility} translations={translations} {...styleProps} />;
          break;
        case 'konsult':
          element = <KonsultResumeTemplate data={cvData} visibility={visibility} translations={translations} {...styleProps} />;
          break;
        case 'modern':
        default:
          element = <ModernResumeTemplate data={cvData} visibility={visibility} portfolioItems={portfolioItems} translations={translations} {...styleProps} />;
          break;
      }

      const blob = await pdf(element).toBlob();
      const pdfUrl = URL.createObjectURL(blob);
      const printWindow = window.open(pdfUrl, '_blank');

      if (!printWindow) {
        toast({ title: "Pop-up Blocked", description: "Please allow pop-ups to view the print preview", variant: "destructive" });
        URL.revokeObjectURL(pdfUrl);
        return;
      }

      printWindow.document.title = `${cvData.personalInfo?.firstName || ""} ${cvData.personalInfo?.lastName || ""} - CV`;
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast({ title: "Error", description: "Could not generate PDF preview", variant: "destructive" });
    }
  };


  const handleSave = () => {
    // Generate a default CV name based on profile data
    const defaultName = cvData.personalInfo?.firstName && cvData.personalInfo?.lastName
      ? `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName} CV`
      : cvData.personalInfo?.title
        ? `${cvData.personalInfo.title} CV`
        : "My CV"

    setCustomCvName(defaultName)
    setShowSaveDialog(true)
  }



  // Helper function to check if an item exists in profile
  const findNewItemsToSync = async () => {
    if (!session?.user?.id) return null

    try {
      // Fetch user's profile
      const response = await fetch(`/api/profile?where[user][equals]=${session.user.id}`)
      const result = await response.json()

      if (!result.docs || result.docs.length === 0) {
        // No profile exists, all items are new
        return {
          employers: cvData.employers || [],
          education: cvData.education || [],
          languages: cvData.languages || [],
          certifications: cvData.certifications || [],
          projects: cvData.projects || [],
          references: cvData.references || [],
        }
      }

      const profile = result.docs[0]
      const profileDetails = profile.profileDetails || {}

      // Helper to compare arrays and find new items
      const findNewItems = (cvItems: any[], profileItems: any[], compareKey: string) => {
        if (!cvItems || cvItems.length === 0) return []
        if (!profileItems || profileItems.length === 0) return cvItems

        return cvItems.filter(cvItem => {
          return !profileItems.some(profileItem => {
            // For different types, use different comparison logic
            if (compareKey === 'employer') {
              return profileItem.employer?.toLowerCase() === cvItem.employer?.toLowerCase() &&
                profileItem.title?.toLowerCase() === cvItem.title?.toLowerCase()
            }
            if (compareKey === 'school') {
              return profileItem.school?.toLowerCase() === cvItem.school?.toLowerCase() &&
                profileItem.program?.toLowerCase() === cvItem.program?.toLowerCase()
            }
            if (compareKey === 'language') {
              return profileItem.language?.toLowerCase() === cvItem.language?.toLowerCase()
            }
            if (compareKey === 'certification') {
              return profileItem.title?.toLowerCase() === cvItem.title?.toLowerCase() &&
                profileItem.issuer?.toLowerCase() === cvItem.issuer?.toLowerCase()
            }
            if (compareKey === 'project') {
              return profileItem.role?.toLowerCase() === cvItem.role?.toLowerCase() &&
                profileItem.company?.toLowerCase() === cvItem.company?.toLowerCase()
            }
            if (compareKey === 'reference') {
              return profileItem.firstName?.toLowerCase() === cvItem.firstName?.toLowerCase() &&
                profileItem.lastName?.toLowerCase() === cvItem.lastName?.toLowerCase() &&
                profileItem.email?.toLowerCase() === cvItem.email?.toLowerCase()
            }
            return false
          })
        })
      }

      const newItems = {
        employers: findNewItems(cvData.employers || [], profileDetails.employers, 'employer'),
        education: findNewItems(cvData.education || [], profileDetails.education, 'school'),
        languages: findNewItems(cvData.languages || [], profileDetails.languages, 'language'),
        certifications: findNewItems(cvData.certifications || [], profileDetails.certifications, 'certification'),
        projects: findNewItems(cvData.projects || [], profileDetails.projectDetails, 'project'),
        references: findNewItems(cvData.references || [], profileDetails.references, 'reference'),
      }

      // Check if there are any new items
      const hasNewItems = Object.values(newItems).some(items => items.length > 0)

      return hasNewItems ? newItems : null
    } catch (error) {
      console.error('Error checking for new items:', error)
      return null
    }
  }

  // New function to actually save the CV
  const handleConfirmSave = async () => {
    if (!customCvName.trim()) {
      toast({
        title: t.cvNameRequired,
        description: t.enterCVName,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true)

    try {
      const userId = session?.user?.id;

      if (!userId) {
        toast({
          title: t.authenticationRequired,
          description: t.pleaseLogin,
          variant: "destructive",
        });
        setIsSaving(false)
        return;
      }

      const cvId = cvDataDigital?.id || params?.id;

      const saveData = {
        cvData,
        visibility,
        selectedColor,
        headingFontId: selectedHeadingFont,
        bodyFontId: selectedBodyFont,
        template,
        userId,
        sidebarColor: selectedSidebarColor,
        portfolioItems: portfolioItems.filter(p => p.visible),
        cvName: customCvName.trim(),
        ...(cvId && { cvId: cvId })
      };

      // Check for new items that don't exist in profile
      const newItems = await findNewItemsToSync()

      if (newItems) {
        // Store the save data and show sync dialog
        setPendingSaveData(saveData)
        setItemsToSync(newItems)
        setShowSyncDialog(true)
        setIsSaving(false)
        return
      }

      // If no new items, proceed with normal save
      await performSave(saveData, false)

    } catch (error) {
      console.error("Error saving CV:", error);
      toast({
        title: t.errorSavingCV,
        description: error instanceof Error ? error.message : t.tryAgainLater,
        variant: "destructive",
      });
      setIsSaving(false)
    }
  };

  // New function to perform the actual save
  const performSave = async (saveData: any, syncToProfile: boolean) => {
    setIsSaving(true)

    try {
      const response = await fetch("/api/cv/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...saveData,
          syncToProfile, // Pass the sync preference
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        localStorage.setItem("cv-data", JSON.stringify(cvData));
        localStorage.setItem("cv-visibility", JSON.stringify(visibility));
        localStorage.setItem("cv-template", template);
        localStorage.setItem("cv-id", result.cvId);

        localStorage.setItem("cv-accent-color", selectedColor);
        localStorage.setItem("cv-heading-font-id", selectedHeadingFont);
        localStorage.setItem("cv-body-font-id", selectedBodyFont);
        localStorage.setItem("cv-sidebar-color", selectedSidebarColor);


        // Close dialogs and reset state FIRST
        setShowSaveDialog(false)
        setShowSyncDialog(false)
        setCustomCvName("")
        setPendingSaveData(null)
        setItemsToSync({
          employers: [],
          education: [],
          languages: [],
          certifications: [],
          projects: [],
          references: [],
        })

        // Small delay to ensure dialogs close first
        setTimeout(() => {
          // THEN show the success toast using Sonner with translations
          const successMessage = result.skillsSynced
            ? t.cvAndSkillsSynced.replace('{count}', String(cvData.skills?.length || 0))
            : t.cvSavedSuccessfully;

          const title = saveData.cvId ? t.cvUpdatedSuccessfully : t.cvSavedSuccessfully;

          toastS.success(title, {
            description: successMessage,
            duration: 2500,
            position: "top-center",
            className: "bg-green-50 border-green-200 text-green-800",
          });

          // Redirect AFTER toast finishes (2.5 seconds)
          setTimeout(() => {
            router.push("/dashboard/cv")
          }, 2500)
        }, 100) // Small delay to ensure dialogs are closed

      } else {
        if (response.status === 400 && result.duplicates) {
          const isDuplicateSkills = result.error === 'Duplicate skills detected'
          const isDuplicateLanguages = result.error === 'Duplicate languages detected'

          toast({
            title: isDuplicateSkills ? t.duplicateSkillsDetected : t.duplicateLanguagesDetected,
            description: result.message || t.duplicateItemsMessage,
            variant: "destructive",
            duration: 6000,
          });
        } else if (response.status === 400) {
          throw new Error(result.error || t.invalidDataProvided);
        } else if (response.status === 401) {
          throw new Error(t.authenticationRequired);
        } else if (response.status === 500) {
          throw new Error(result.error || t.serverErrorOccurred);
        } else {
          throw new Error(result.error || t.failedToSaveCV);
        }
      }
    } catch (error) {
      console.error("Error saving CV:", error);
      toast({
        title: t.errorSavingCV,
        description: error instanceof Error ? error.message : t.tryAgainLater,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false)
    }
  };

  // Load from local storage on initial render
  useEffect(() => {
    try {
      const savedData = localStorage.getItem("cv-data")
      const savedVisibility = localStorage.getItem("cv-visibility")
      const savedTemplate = localStorage.getItem("cv-template") as TemplateType | null

      // Add inside the existing localStorage useEffect, after the savedTemplate block:
      const savedColor = localStorage.getItem("cv-accent-color")
      const savedHeadingFont = localStorage.getItem("cv-heading-font-id")
      const savedBodyFont = localStorage.getItem("cv-body-font-id")

      const savedSidebarColor = localStorage.getItem("cv-sidebar-color")
      if (savedSidebarColor) setSelectedSidebarColor(savedSidebarColor)

      if (savedColor) setSelectedColor(savedColor)
      if (savedHeadingFont) setSelectedHeadingFont(savedHeadingFont as HeadingFontId)
      if (savedBodyFont) setSelectedBodyFont(savedBodyFont as BodyFontId)

      if (savedData) {
        setCvData(JSON.parse(savedData))
      }
      if (savedVisibility) {
        setVisibility(JSON.parse(savedVisibility))
      }
      if (savedTemplate) {
        setTemplate(savedTemplate)
      }
    } catch (error) {
      console.error("Error loading saved data:", error)
    }
  }, [])

  // Format date for display
  const formatDate = (date: Date | undefined | null) => {
    if (!date) return ""
    return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short" })
  }

  const handleDownloadPdf = () => {
    downloadCvPdf({
      template,
      cvData,
      visibility,
      toast,
      accentColor: selectedColor,
      headingFont: HEADING_FONT_ID_TO_PDF[selectedHeadingFont],
      bodyFont: BODY_FONT_ID_TO_PDF[selectedBodyFont],
      sidebarColor: selectedSidebarColor,
      portfolioItems,
    });
  };

  return (
    <div className="container mx-auto py-3 px-3 sm:py-4 sm:px-4 md:py-6 md:px-6 max-w-[1920px]">
      <div className="mb-4 sm:mb-6 flex flex-col justify-between gap-3 sm:gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl sm:text-3xl font-bold">{t.cvMaker}</h1>
        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
          <button
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-white rounded-md transition-colors whitespace-nowrap"
            style={{ backgroundColor: 'rgb(5, 22, 80)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
            onClick={handleSave}
          >
            <SaveAllIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className=" xs:inline">{t.save}</span>
          </button>
          <ProfileLanguageSelector
            onProfileLoaded={handleProfileLoaded}
            activeProfileId={activeProfileId}
          />
          <Button variant="outline" size="sm" onClick={handlePrintPreview} className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap">
            <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t.print}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isDownloading} className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap">
            {isDownloading ? (
              <>
                <Icon icon="tabler:loader" className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2 animate-spin" />
                <span className="hidden sm:inline">{t.generating}</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t.downloadPDF}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* View Mode Toggle - Visible for screens smaller than 1280px (below ~1230px) */}
      <div className="hidden md:flex xl:hidden mb-4 justify-center gap-2">
        <button
          onClick={() => setViewMode('edit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium ${viewMode === 'edit'
            ? 'text-white shadow-md'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          style={viewMode === 'edit' ? { backgroundColor: 'rgb(5, 22, 80)' } : {}}
        >
          <Edit className="h-4 w-4" />
          {t.editCVTab || 'Edit CV'}
        </button>
        <button
          onClick={() => setViewMode('preview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all text-sm font-medium ${viewMode === 'preview'
            ? 'text-white shadow-md'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          style={viewMode === 'preview' ? { backgroundColor: 'rgb(5, 22, 80)' } : {}}
        >
          <Eye className="h-4 w-4" />
          {t.preview || 'Preview CV'}
        </button>
      </div>

      <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 xl:grid-cols-[minmax(320px,380px)_1fr] 2xl:grid-cols-[400px_1fr]">
        {/* Left Column - Editor */}
        {/* Visible: Always on phones, only when viewMode='edit' on tablets/small laptops, always on screens >= 1280px */}
        <div className={`space-y-3 sm:space-y-4 w-full overflow-x-hidden block ${viewMode === 'edit' ? 'md:block' : 'md:hidden'
          } xl:block`}>
          <Tabs defaultValue="edit">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">{t.editCVTab}</TabsTrigger>
              <TabsTrigger value="visibility">{t.pageLayout}</TabsTrigger>
            </TabsList>

            {/* New AI-powered buttons */}
            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
              <button
                className="w-full text-white relative flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-md transition-colors text-sm sm:text-base"
                style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
                onClick={() => setTailorCVOpen(true)}
              >
                <Wand2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="truncate">{t.tailorCVToJobpost}</span>
                <Badge className="ml-2 bg-yellow-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">Beta</Badge>
              </button>
              <button
                className="w-full text-white relative flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-md transition-colors text-sm sm:text-base"
                style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
                onClick={() => {
                  if (hasCoverLetters) {
                    setShowSavedCoverLettersDialog(true)
                  } else {
                    setCreateCoverLetterOpen(true)
                  }
                }}
              >
                <FileText className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="truncate">
                  {hasCoverLetters ? (t.seeYourCoverLetters || "Your Cover Letters") : t.createCoverletter}
                </span>
                <Badge className="ml-2 bg-yellow-500 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                  {hasCoverLetters ? "Saved" : "Beta"}
                </Badge>
              </button>
            </div>

            <TabsContent value="edit" className="space-y-4 pt-4">
              {/* Personal Information Section */}
              <div className="rounded-lg border bg-card p-3 sm:p-4 text-card-foreground shadow-sm">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold truncate pr-2">{t.personalInformation}</h3>
                  <Button variant="ghost" size="icon" onClick={() => setPersonalInfoFormOpen(true)} className="flex-shrink-0">
                    <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl font-bold truncate">
                      {cvData.personalInfo?.firstName} {cvData.personalInfo?.lastName}
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base truncate">{cvData.personalInfo?.title}</p>
                  </div>
                </div>
              </div>

              {/* Projects & Assignments */}
              <CollapsibleSection
                title={t.projectsAssignments}
                icon={<Briefcase className="h-5 w-5" />}
                contentCount={cvData.projects?.length || 0}
              >
                <div className="space-y-4">
                  {cvData.projects?.map((project, index) => (
                    <div key={index} className="rounded-md bg-muted p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm sm:text-base break-words">
                            {project.role} {project.company && `${t.at} ${project.company}`}
                          </h4>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {formatDate(project.startDate)} -{" "}
                            {project.isCurrent ? t.present : formatDate(project.endDate)}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">{project.description}</p>
                          {project.skills && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {project.skills.split(",").map((skill, skillIndex) => (
                                <Badge key={skillIndex} variant="outline" className="text-[10px] sm:text-xs">
                                  {skill.trim()}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => handleEditProject(project)} className="h-7 w-7 sm:h-8 sm:w-8">
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          {/* Visibility toggle button with tooltip */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 sm:h-8 sm:w-8"
                                  onClick={() =>
                                    handleItemToggleVisibility("projectDetails", project.id, project.visible ?? true)
                                  }
                                >
                                  {project.visible ? (
                                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                  ) : (
                                    <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{project.visible ? t.hideProject : t.showProject}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full bg-transparent text-sm"
                    onClick={() => {
                      setEditingProject(undefined)
                      setProjectFormOpen(true)
                    }}
                  >
                    <Plus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t.addProject}
                  </Button>
                </div>
              </CollapsibleSection>

              {/* Employment History */}
              <CollapsibleSection
                title={t.employmentHistory}
                icon={<Building className="h-5 w-5" />}
                contentCount={cvData.experience?.length || 0}
              >
                <div className="space-y-4">
                  {cvData.experience?.map((experience, index) => (
                    <div key={index} className="rounded-md bg-muted p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm sm:text-base break-words">
                            {experience.title} {t.at} {experience.employer}
                          </h4>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {formatDate(experience.startDate)} -{" "}
                            {experience.ongoing ? t.present : formatDate(experience.endDate)}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">{experience.description}</p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => handleEditEmployer(experience)} className="h-7 w-7 sm:h-8 sm:w-8">
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          {/* Visibility toggle with tooltip */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 sm:h-8 sm:w-8"
                                  onClick={() =>
                                    handleItemToggleVisibility("experience", experience.id, experience.visible ?? true)
                                  }
                                >
                                  {experience.visible ? (
                                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                  ) : (
                                    <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{experience.visible ? t.hideEmployment : t.showEmployment}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full bg-transparent text-sm"
                    onClick={() => {
                      setEditingEmployer(undefined)
                      setEmployerFormOpen(true)
                    }}
                  >
                    <Plus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t.addEmployment}
                  </Button>
                </div>
              </CollapsibleSection>

              {/* Skills */}
              <CollapsibleSection
                title={t.skills}
                icon={<Code className="h-5 w-5" />}
                defaultOpen={false}
                contentCount={cvData.skills?.length || 0}
              >
                <div className="space-y-4">
                  {hasDuplicateSkills && (
                    <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-start gap-1.5 sm:gap-2">
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-yellow-800">
                            {t.duplicateSkillsDetected}
                          </p>
                          <p className="text-[10px] sm:text-xs text-yellow-700 mt-0.5 sm:mt-1">
                            {t.duplicateSkillsMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {cvData.skills?.map((skill, index) => (
                    <div key={index} className="flex items-center justify-between rounded-md bg-muted p-3 sm:p-4 gap-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="font-medium truncate text-sm sm:text-base">{skill.skillName}</h4>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => handleEditSkill(skill)} className="h-7 w-7 sm:h-8 sm:w-8">
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        {/* Visibility toggle button */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8"
                                onClick={() => handleItemToggleVisibility("skills", skill.id, skill.visible ?? true)}
                              >
                                {skill.visible ? (
                                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                ) : (
                                  <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{skill.visible ? t.hideSkill : t.showSkill}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full bg-transparent text-sm"
                    onClick={() => {
                      setEditingSkill(undefined)
                      setSkillFormOpen(true)
                    }}
                  >
                    <Plus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t.addSkill}
                  </Button>
                </div>
              </CollapsibleSection>

              {/* Education */}
              <CollapsibleSection
                title={t.education}
                icon={<GraduationCap className="h-5 w-5" />}
                contentCount={cvData.education?.length || 0}
              >
                <div className="space-y-4">
                  {cvData.education?.map((edu, index) => (
                    <div key={index} className="rounded-md bg-muted p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm sm:text-base break-words">
                            {edu.program} - {edu.level}
                          </h4>
                          <p className="text-xs sm:text-sm font-medium mt-1">
                            {edu.school}, {edu.place}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {formatDate(edu.startDate)} - {edu.ongoing ? t.present : formatDate(edu.endDate)}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">{edu.description}</p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => handleEditEducation(edu)} className="h-7 w-7 sm:h-8 sm:w-8">
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          {/* Visibility toggle with tooltip */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 sm:h-8 sm:w-8"
                                  onClick={() => handleItemToggleVisibility("education", edu.id, edu.visible ?? true)}
                                >
                                  {edu.visible ? (
                                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                  ) : (
                                    <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{edu.visible ? t.hideEducation : t.showEducation}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full bg-transparent text-sm"
                    onClick={() => {
                      setEditingEducation(undefined)
                      setEducationFormOpen(true)
                    }}
                  >
                    <Plus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t.addEducation}
                  </Button>
                </div>
              </CollapsibleSection>

              {/* Certifications */}
              <CollapsibleSection
                title={t.certifications}
                icon={<Award className="h-5 w-5" />}
                contentCount={cvData.certifications?.length || 0}
              >
                <div className="space-y-4">
                  {cvData.certifications?.map((cert, index) => (
                    <div key={index} className="rounded-md bg-muted p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm sm:text-base break-words">{cert.title}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {cert.issuer}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                            {formatDate(cert.startDate)}
                            {" – "}
                            {cert.noExpiry
                              ? <span className="italic">{t.doesNotExpire}</span>
                              : formatDate(cert.validDate)
                            }
                          </p>
                          {cert.description && <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">{cert.description}</p>}
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => handleEditCertification(cert)} className="h-7 w-7 sm:h-8 sm:w-8">
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          {/* Visibility toggle with tooltip */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 sm:h-8 sm:w-8"
                                  onClick={() =>
                                    handleItemToggleVisibility("certifications", cert.id, cert.visible ?? true)
                                  }
                                >
                                  {cert.visible ? (
                                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                  ) : (
                                    <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{cert.visible ? t.hideCertification : t.showCertification}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full bg-transparent text-sm"
                    onClick={() => {
                      setCertificationEditing(undefined)
                      setCertificationFormOpen(true)
                    }}
                  >
                    <Plus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t.addCertification}
                  </Button>
                </div>
              </CollapsibleSection>

              {/* Languages */}
              <CollapsibleSection
                title={t.languages}
                icon={<Globe className="h-5 w-5" />}
                contentCount={cvData.languages?.length || 0}
              >
                <div className="space-y-4">
                  {hasDuplicateLanguages && (
                    <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-start gap-1.5 sm:gap-2">
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-yellow-800">
                            {t.duplicateLanguagesDetected}
                          </p>
                          <p className="text-[10px] sm:text-xs text-yellow-700 mt-0.5 sm:mt-1">
                            {t.duplicateLanguagesMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {cvData.languages?.map((language, index) => (
                    <div key={index} className="flex items-center justify-between rounded-md bg-muted p-3 sm:p-4 gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm sm:text-base truncate">{language.language}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{language.level}</p>
                      </div>
                      <div className="flex gap-1 sm:gap-2 items-center flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => handleEditLanguage(language)} className="h-7 w-7 sm:h-8 sm:w-8">
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        {/* Visibility toggle with tooltip */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8"
                                onClick={() =>
                                  handleItemToggleVisibility("languages", language.id, language.visible ?? true)
                                }
                              >
                                {language.visible ? (
                                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                ) : (
                                  <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{language.visible ? t.hideLanguage : t.showLanguage}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full bg-transparent text-sm"
                    onClick={() => {
                      setEditingLanguage(undefined)
                      setLanguageFormOpen(true)
                    }}
                  >
                    <Plus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t.addLanguage}
                  </Button>
                </div>
              </CollapsibleSection>

              {/* References */}
              <CollapsibleSection
                title={t.references}
                icon={<User className="h-5 w-5" />}
                contentCount={cvData.references?.length || 0}
              >
                <div className="space-y-4">
                  {cvData.references?.map((reference, index) => (
                    <div key={index} className="rounded-md bg-muted p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm sm:text-base break-words">
                            {reference.firstName} {reference.lastName}
                          </h4>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
                            {reference.positionTitle} {t.at} {reference.company}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-all">{reference.email}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{reference.phoneNumber}</p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => handleEditReference(reference)} className="h-7 w-7 sm:h-8 sm:w-8">
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 sm:h-8 sm:w-8"
                                  onClick={() =>
                                    handleItemToggleVisibility("references", reference.id, reference.visible ?? true)
                                  }
                                >
                                  {reference.visible ? (
                                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                  ) : (
                                    <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{reference.visible ? t.hideReference : t.showReference}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full bg-transparent text-sm"
                    onClick={() => {
                      setEditingReference(undefined)
                      setReferenceFormOpen(true)
                    }}
                  >
                    <Plus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> {t.addReference}
                  </Button>
                </div>
              </CollapsibleSection>
              {/* ── Portfolio ── */}
              <CollapsibleSection
                title={t.portfolios}
                icon={<FileText className="h-5 w-5" />}
                contentCount={portfolioItems.length}
              >
                <div className="space-y-4">
                  {portfolioItems.length === 0 && (
                    <p className="text-xs sm:text-sm text-muted-foreground text-center py-2">
                      {t.portfolioEmptyTitle}
                    </p>
                  )}
                  {portfolioItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-md bg-muted p-3 sm:p-4 gap-2"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <h4 className="font-medium truncate text-sm sm:text-base">{item.title}</h4>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">{item.type}</p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {/* Edit — navigate to portfolio page */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8"
                                onClick={() => router.push("/dashboard/portfolios")}
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{t.edit}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {/* Eye — toggle visibility on CV */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8"
                                onClick={() => {
                                  setPortfolioItems((prev) =>
                                    prev.map((p) =>
                                      p.id === item.id ? { ...p, visible: !p.visible } : p
                                    )
                                  )
                                  requestAnimationFrame(() => {
                                    toast({
                                      title: `${t.portfolios} ${!item.visible ? t.itemShown : t.itemHidden}`,
                                      description: `${item.title} ${t.has} ${!item.visible ? t.itemMadeVisible : t.itemHiddenDesc}.`,
                                    })
                                  })
                                }}
                              >
                                {item.visible ? (
                                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                ) : (
                                  <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{item.visible ? t.portfolioFilterAll : t.portfolioFilterAll}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}

                  {/* Add Portfolio — navigates to the portfolio page */}
                  <Button
                    variant="outline"
                    className="w-full bg-transparent text-sm"
                    onClick={() => router.push("/dashboard/portfolios")}
                  >
                    <Plus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {t.portfolioAddItemButton}
                  </Button>
                </div>
              </CollapsibleSection>
            </TabsContent>

            <TabsContent value="visibility" className="space-y-3 sm:space-y-4 pt-3 sm:pt-4">
              <div className="rounded-lg border bg-card p-4 sm:p-6 text-card-foreground shadow-sm">
                <button
                  type="button"
                  className="w-full flex items-center justify-between mb-3 sm:mb-4 focus:outline-none"
                  onClick={() => setIsTemplateOpen(!isTemplateOpen)}
                >
                  <h3 className="text-base sm:text-lg font-medium">{t.templateOptions}</h3>
                  <span className="flex items-center">
                    {isTemplateOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </span>
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${isTemplateOpen ? "max-h-[2000px]" : "max-h-0"}`}>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                    <div
                      className={`cursor-pointer rounded-md border-2 ${template === "modern" ? "border-primary" : "border-transparent"} bg-muted/50 p-2 hover:border-gray-200`}
                      onClick={() => setTemplate("modern")}
                      style={template === "modern" ? { borderColor: 'rgb(5, 22, 80)' } : {}}
                    >
                      <div className="aspect-[3/4] rounded bg-white p-2">
                        <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          <div className="col-span-1 space-y-1">
                            <div className="h-2 rounded bg-gray-200"></div>
                            <div className="h-2 rounded bg-gray-200"></div>
                          </div>
                          <div className="col-span-2 space-y-1">
                            <div className="h-2 rounded bg-gray-200"></div>
                            <div className="h-2 rounded bg-gray-200"></div>
                            <div className="h-2 rounded bg-gray-200"></div>
                          </div>
                        </div>
                      </div>
                      <p className="mt-1.5 sm:mt-2 text-center text-xs sm:text-sm font-medium">{t.modern}</p>
                    </div>
                    <div
                      className={`cursor-pointer rounded-md border-2 ${template === "classic" ? "border-primary" : "border-transparent"} bg-muted/50 p-2 hover:border-gray-200`}
                      onClick={() => setTemplate("classic")}
                      style={template === "classic" ? { borderColor: 'rgb(5, 22, 80)' } : {}}
                    >
                      <div className="aspect-[3/4] rounded bg-white p-2">
                        <div className="mb-2 h-3 w-1/2 rounded bg-gray-200 mx-auto"></div>
                        <div className="mt-2 space-y-1">
                          <div className="h-2 w-full rounded bg-gray-200"></div>
                          <div className="h-2 w-full rounded bg-gray-200"></div>
                          <div className="h-2 w-3/4 rounded bg-gray-200"></div>
                        </div>
                        <div className="mt-3 h-2 w-1/3 rounded bg-gray-300"></div>
                        <div className="mt-2 space-y-1">
                          <div className="h-2 w-full rounded bg-gray-200"></div>
                          <div className="h-2 w-full rounded bg-gray-200"></div>
                        </div>
                      </div>
                      <p className="mt-1.5 sm:mt-2 text-center text-xs sm:text-sm font-medium">{t.classic}</p>
                    </div>
                    <div
                      className={`cursor-pointer rounded-md border-2 ${template === "minimalist" ? "border-primary" : "border-transparent"} bg-muted/50 p-2 hover:border-gray-200`}
                      onClick={() => setTemplate("minimalist")}
                      style={template === "minimalist" ? { borderColor: 'rgb(5, 22, 80)' } : {}}
                    >
                      <div className="aspect-[3/4] rounded bg-white p-2 overflow-hidden">
                        <div className="flex h-full gap-1.5">
                          {/* Dark sidebar */}
                          <div className="w-1/3 rounded bg-gray-700 h-full flex flex-col gap-1 p-1">
                            <div className="h-2 w-full rounded bg-gray-500"></div>
                            <div className="h-1.5 w-3/4 rounded bg-gray-500"></div>
                            <div className="mt-1 h-1 w-full rounded bg-gray-600"></div>
                            <div className="h-1 w-full rounded bg-gray-600"></div>
                            <div className="h-1 w-2/3 rounded bg-gray-600"></div>
                          </div>
                          {/* Right content */}
                          <div className="w-2/3 flex flex-col gap-1 pt-1">
                            <div className="h-1.5 w-2/3 rounded bg-gray-300"></div>
                            <div className="h-1 w-full rounded bg-gray-200"></div>
                            <div className="h-1 w-full rounded bg-gray-200"></div>
                            <div className="mt-1 h-1.5 w-1/2 rounded bg-gray-300"></div>
                            <div className="h-1 w-full rounded bg-gray-200"></div>
                            <div className="h-1 w-4/5 rounded bg-gray-200"></div>
                          </div>
                        </div>
                        {template === 'minimalist' && (
                          <div className="rounded-lg border bg-card p-4 sm:p-6 text-card-foreground shadow-sm">
                            <h3 className="mb-1 text-base sm:text-lg font-medium">Sidebar Color</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-5">
                              Background color for the left sidebar panel.
                            </p>
                            <div className="grid grid-cols-5 gap-3">
                              {[
                                { hex: '#172A45', label: 'Navy' },
                                { hex: '#1a1a2e', label: 'Midnight' },
                                { hex: '#0d3b2a', label: 'Forest' },
                                { hex: '#2c2c3e', label: 'Charcoal' },
                                { hex: '#3b1f2b', label: 'Merlot' },
                                { hex: '#0a3040', label: 'Ocean' },
                                { hex: '#1e1e1e', label: 'Onyx' },
                                { hex: '#2d1b69', label: 'Indigo' },
                                { hex: '#3d2b1f', label: 'Espresso' },
                                { hex: '#1a3a2a', label: 'Emerald' },
                              ].map((color) => (
                                <button
                                  key={color.hex}
                                  title={color.label}
                                  onClick={() => setSelectedSidebarColor(color.hex)}
                                  className="flex flex-col items-center gap-1.5 group"
                                >
                                  <span
                                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-200 shadow-md group-hover:scale-110"
                                    style={{
                                      backgroundColor: color.hex,
                                      boxShadow: selectedSidebarColor === color.hex
                                        ? `0 0 0 2px white, 0 0 0 4px ${color.hex}`
                                        : '0 2px 6px rgba(0,0,0,0.25)',
                                    }}
                                  />
                                  <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                                    {color.label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="mt-1.5 sm:mt-2 text-center text-xs sm:text-sm font-medium">{t.minimal}</p>
                    </div>
                    <div
                      className={`cursor-pointer rounded-md border-2 ${template === "ats" ? "border-primary" : "border-transparent"} bg-muted/50 p-2 hover:border-gray-200`}
                      onClick={() => setTemplate("ats")}
                      style={template === "ats" ? { borderColor: 'rgb(5, 22, 80)' } : {}}
                    >
                      <div className="aspect-[3/4] rounded bg-white p-2">
                        <div className="h-3 w-2/3 rounded bg-gray-200 mx-auto"></div>
                        <div className="mt-3 space-y-1">
                          <div className="h-2 w-full rounded bg-gray-200"></div>
                          <div className="h-2 w-full rounded bg-gray-200"></div>
                          <div className="h-2 w-5/6 rounded bg-gray-200"></div>
                        </div>
                        <div className="mt-3 h-2 w-1/3 rounded bg-gray-300"></div>
                        <div className="mt-2 space-y-1">
                          <div className="h-2 w-full rounded bg-gray-200"></div>
                          <div className="h-2 w-4/5 rounded bg-gray-200"></div>
                        </div>
                        <div className="mt-3 h-2 w-1/4 rounded bg-gray-300"></div>
                        <div className="mt-2 space-y-1">
                          <div className="h-2 w-full rounded bg-gray-200"></div>
                          <div className="h-2 w-full rounded bg-gray-200"></div>
                        </div>
                      </div>
                      <p className="mt-1.5 sm:mt-2 text-center text-xs sm:text-sm font-medium">ATS Friendly</p>
                    </div>


                    <div
                      className={`cursor-pointer rounded-md border-2 ${template === "konsult" ? "border-primary" : "border-transparent"} bg-muted/50 p-2 hover:border-gray-200`}
                      onClick={() => setTemplate("konsult")}
                      style={template === "konsult" ? { borderColor: 'rgb(5, 22, 80)' } : {}}
                    >
                      <div className="aspect-[3/4] rounded bg-white p-2">
                        {/* Header: name + amber underline (mimics Zunny People style) */}
                        <div className="h-2.5 w-3/4 rounded bg-gray-300 mb-1"></div>
                        <div className="h-1 w-1/2 rounded mb-1" style={{ backgroundColor: '#D97706' }}></div>
                        <div className="h-1.5 w-full rounded bg-gray-100 mb-2"></div>

                        {/* "Profil" section */}
                        <div className="h-1.5 w-1/3 rounded mb-1" style={{ backgroundColor: '#D97706', opacity: 0.7 }}></div>
                        <div className="space-y-0.5 mb-2">
                          <div className="h-1 w-full rounded bg-gray-200"></div>
                          <div className="h-1 w-5/6 rounded bg-gray-200"></div>
                        </div>

                        {/* "Tekniker i fokus" - bold dense block */}
                        <div className="h-1.5 w-1/2 rounded mb-1" style={{ backgroundColor: '#D97706', opacity: 0.7 }}></div>
                        <div className="h-1 w-full rounded bg-gray-300 mb-2"></div>

                        {/* "Referensprojekt" entries */}
                        <div className="h-1.5 w-2/3 rounded mb-1" style={{ backgroundColor: '#D97706', opacity: 0.7 }}></div>
                        <div className="space-y-0.5">
                          <div className="h-1.5 w-1/2 rounded bg-gray-300"></div>
                          <div className="h-1 w-full rounded bg-gray-200"></div>
                          <div className="h-1 w-4/5 rounded bg-gray-200"></div>
                        </div>
                      </div>
                      <p className="mt-1.5 sm:mt-2 text-center text-xs sm:text-sm font-medium">Konsult</p>
                    </div>


                  </div>
                </div>
              </div>
              {/* Visibility Settings */}
              <div className="rounded-lg border bg-card p-4 sm:p-6 text-card-foreground shadow-sm">
                {/* Header */}
                <button
                  type="button"
                  className="w-full flex items-center justify-between mb-3 sm:mb-4 focus:outline-none"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  <h3 className="text-base sm:text-lg font-medium">{t.sectionVisibility}</h3>
                  <span className="flex items-center">
                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </span>
                </button>

                {/* Collapsible content */}
                <div className={`transition-max-height duration-300 overflow-hidden ${isOpen ? "max-h-screen" : "max-h-0"}`}>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5" style={{ color: 'rgb(5, 22, 80)' }} />
                        <Label htmlFor="personalInfo-visibility">{t.personalInformation}</Label>
                      </div>
                      <Switch
                        id="personalInfo-visibility"
                        checked={visibility.personalInfo}
                        onCheckedChange={() => toggleVisibility("personalInfo")}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="h-5 w-5" style={{ color: 'rgb(5, 22, 80)' }} />
                        <Label htmlFor="employers-visibility">{t.employmentHistory}</Label>
                      </div>
                      <Switch
                        id="employers-visibility"
                        checked={visibility.experience}
                        onCheckedChange={() => toggleVisibility("experience")}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" style={{ color: 'rgb(5, 22, 80)' }} />
                        <Label htmlFor="projects-visibility">{t.projectsAssignments}</Label>
                      </div>
                      <Switch
                        id="projects-visibility"
                        checked={visibility.projects}
                        onCheckedChange={() => toggleVisibility("projects")}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" style={{ color: 'rgb(5, 22, 80)' }} />
                        <Label htmlFor="education-visibility">{t.education}</Label>
                      </div>
                      <Switch
                        id="education-visibility"
                        checked={visibility.education}
                        onCheckedChange={() => toggleVisibility("education")}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code className="h-5 w-5" style={{ color: 'rgb(5, 22, 80)' }} />
                        <Label htmlFor="skills-visibility">{t.skills}</Label>
                      </div>
                      <Switch
                        id="skills-visibility"
                        checked={visibility.skills}
                        onCheckedChange={() => toggleVisibility("skills")}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5" style={{ color: 'rgb(5, 22, 80)' }} />
                        <Label htmlFor="languages-visibility">{t.languages}</Label>
                      </div>
                      <Switch
                        id="languages-visibility"
                        checked={visibility.languages}
                        onCheckedChange={() => toggleVisibility("languages")}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5" style={{ color: 'rgb(5, 22, 80)' }} />
                        <Label htmlFor="certifications-visibility">{t.certifications}</Label>
                      </div>
                      <Switch
                        id="certifications-visibility"
                        checked={visibility.certifications}
                        onCheckedChange={() => toggleVisibility("certifications")}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5" style={{ color: 'rgb(5, 22, 80)' }} />
                        <Label htmlFor="references-visibility">{t.references}</Label>
                      </div>
                      <Switch
                        id="references-visibility"
                        checked={visibility.references}
                        onCheckedChange={() => toggleVisibility("references")}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5" style={{ color: 'rgb(5, 22, 80)' }} />
                        <Label htmlFor="portfolios-visibility">{t.portfolios}</Label>
                      </div>
                      <Switch
                        id="portfolios-visibility"
                        checked={visibility.portfolios ?? true}
                        onCheckedChange={() => toggleVisibility("portfolios")}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* ── CV Accent Color ── */}
              <div className="rounded-lg border bg-card p-4 sm:p-6 text-card-foreground shadow-sm">
                <button
                  type="button"
                  className="w-full flex items-center justify-between focus:outline-none"
                  onClick={() => setIsAccentColorOpen(!isAccentColorOpen)}
                >
                  <div className="text-left">
                    <h3 className="text-base sm:text-lg font-medium">{t.accentColor}</h3>
                    {isAccentColorOpen && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.accentColorDescription}</p>
                    )}
                  </div>
                  <span className="flex items-center ml-2 flex-shrink-0">
                    {isAccentColorOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </span>
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${isAccentColorOpen ? "max-h-[500px] mt-4 sm:mt-5" : "max-h-0"}`}>
                  <div className="grid grid-cols-5 gap-3 p-4">
                    {[
                      { hex: '#051650', label: t.colorNavy },
                      { hex: '#1a0a3d', label: t.colorViolet },
                      { hex: '#0d3b2a', label: t.colorForest },
                      { hex: '#5c1a2e', label: t.colorBurgundy },
                      { hex: '#1b3a5c', label: t.colorSteel },
                      { hex: '#0a4a4a', label: t.colorTeal },
                      { hex: '#2c2c3e', label: t.colorCharcoal },
                      { hex: '#7a2718', label: t.colorRust },
                      { hex: '#2d1b69', label: t.colorIndigo },
                      { hex: '#1e3a4a', label: t.colorSlate },
                    ].map((color) => (
                      <button
                        key={color.hex}
                        title={color.label}
                        onClick={() => setSelectedColor(color.hex)}
                        className="flex flex-col items-center gap-1.5 group"
                      >
                        <span
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-200 shadow-md group-hover:scale-110"
                          style={{
                            backgroundColor: color.hex,
                            outline: selectedColor === color.hex
                              ? `3px solid ${color.hex}`
                              : '3px solid transparent',
                            outlineOffset: '3px',
                            boxShadow: selectedColor === color.hex
                              ? `0 0 0 2px white, 0 0 0 4px ${color.hex}`
                              : '0 2px 6px rgba(0,0,0,0.25)',
                          }}
                        />
                        <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                          {color.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-card p-4 sm:p-6 text-card-foreground shadow-sm space-y-6">
                <div>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between focus:outline-none"
                    onClick={() => setIsFontOpen(!isFontOpen)}
                  >
                    <div className="text-left">
                      <h3 className="text-base sm:text-lg font-medium">{t.fontStyle}</h3>
                      {isFontOpen && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.fontStyleDescription}</p>
                      )}
                    </div>
                    <span className="flex items-center ml-2 flex-shrink-0">
                      {isFontOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </span>
                  </button>
                </div>

                {/* ── Heading Font ── */}
                <div className={`transition-all duration-300 overflow-hidden ${isFontOpen ? "max-h-[3000px]" : "max-h-0"}`}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                        style={{ backgroundColor: 'rgba(5,22,80,0.08)', color: 'rgb(5,22,80)' }}
                      >
                        {t.headingFont}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      {CV_HEADING_FONTS.map((font) => {
                        const isActive = selectedHeadingFont === font.id
                        return (
                          <button
                            key={font.id}
                            onClick={() => setSelectedHeadingFont(font.id)}
                            className="text-left rounded-lg border-2 p-3 transition-all duration-200 hover:shadow-md focus:outline-none"
                            style={{
                              borderColor: isActive ? 'rgb(5,22,80)' : 'transparent',
                              backgroundColor: isActive ? 'rgba(5,22,80,0.04)' : 'rgb(249,249,251)',
                              boxShadow: isActive ? '0 0 0 1px rgb(5,22,80)' : undefined,
                            }}
                          >
                            {/* Font name rendered in that font */}
                            <p
                              className="text-base sm:text-lg font-semibold leading-tight truncate"
                              style={{ fontFamily: font.family, color: isActive ? 'rgb(5,22,80)' : '#1a1a2e' }}
                            >
                              {font.name}
                            </p>
                            {/* Style tag */}
                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                              {font.sample}
                            </p>
                            {/* Serif / Sans badge */}
                            <span
                              className="inline-block mt-1.5 text-[9px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: font.style === 'serif' ? 'rgba(93,63,211,0.1)' : 'rgba(5,22,80,0.08)',
                                color: font.style === 'serif' ? 'rgb(93,63,211)' : 'rgb(5,22,80)',
                              }}
                            >
                              {font.style === 'serif' ? t.fontSerif : t.fontSans}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>


                  {/* ── Body Font ── */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                        style={{ backgroundColor: 'rgba(5,22,80,0.08)', color: 'rgb(5,22,80)' }}
                      >
                        {t.bodyFont}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {CV_BODY_FONTS.map((font) => {
                        const isActive = selectedBodyFont === font.id
                        return (
                          <button
                            key={font.id}
                            onClick={() => setSelectedBodyFont(font.id)}
                            className="text-left rounded-lg border-2 px-3 py-2.5 transition-all duration-200 hover:shadow-sm focus:outline-none flex items-center justify-between gap-3"
                            style={{
                              borderColor: isActive ? 'rgb(5,22,80)' : 'transparent',
                              backgroundColor: isActive ? 'rgba(5,22,80,0.04)' : 'rgb(249,249,251)',
                              boxShadow: isActive ? '0 0 0 1px rgb(5,22,80)' : undefined,
                            }}
                          >
                            <div className="min-w-0 flex-1">
                              {/* Font name in its own typeface */}
                              <p
                                className="text-sm font-medium truncate"
                                style={{ fontFamily: font.family, color: isActive ? 'rgb(5,22,80)' : '#1a1a2e' }}
                              >
                                {font.name}
                              </p>
                              {/* Sample sentence */}
                              <p
                                className="text-xs text-muted-foreground mt-0.5 truncate"
                                style={{ fontFamily: font.family }}
                              >
                                {font.sample}
                              </p>
                            </div>
                            {/* Active indicator */}
                            {isActive && (
                              <span
                                className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: 'rgb(5,22,80)' }}
                              >
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                  <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Live Preview Strip ── */}
                <div
                  className="rounded-lg p-4 space-y-1.5 border"
                  style={{ backgroundColor: 'rgb(249,249,251)', borderColor: 'rgba(5,22,80,0.12)' }}
                >
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{t.fontPreview}</p>
                  <p
                    className="text-xl font-bold leading-tight"
                    style={{
                      fontFamily: CV_HEADING_FONTS.find(f => f.id === selectedHeadingFont)?.family,
                      color: 'rgb(5,22,80)',
                    }}
                  >
                    John Andersson — Senior Developer
                  </p>
                  <p
                    className="text-sm leading-relaxed text-gray-600"
                    style={{
                      fontFamily: CV_BODY_FONTS.find(f => f.id === selectedBodyFont)?.family,
                    }}
                  >
                    Experienced software engineer with 8+ years building scalable web applications.
                    Passionate about clean code, performance, and great user experiences.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Preview */}
        {/* Visible: Always on phones, only when viewMode='preview' on tablets/small laptops, always on screens >= 1280px */}
        <div className={`h-full w-full order-first xl:order-last block ${viewMode === 'preview' ? 'md:block' : 'md:hidden'
          } xl:block`}>
          {/* Container for the preview with responsive sizing */}
          <div className="relative h-[300px] xs:h-[400px] sm:h-[500px] md:h-[600px] lg:h-[650px] xl:h-[700px] 2xl:h-[800px] overflow-auto bg-white rounded border shadow-sm">
            <div className="absolute inset-0">
              <LivePdfPreview
                cvData={cvData}
                visibility={visibility}
                template={template}
                accentColor={selectedColor}
                headingFontId={selectedHeadingFont}
                bodyFontId={selectedBodyFont}
                sidebarColor={selectedSidebarColor}
                portfolioItems={portfolioItems}
              />
            </div>
          </div>

          {/* Mobile-friendly controls for preview (optional) */}
          <div className="mt-2 sm:mt-3 flex flex-wrap items-center justify-between gap-2 xl:hidden">
            <div className="text-xs sm:text-sm text-gray-600">
              Pinch to zoom • Scroll to navigate
            </div>
            <button
              onClick={handlePrintPreview}
              className="flex items-center gap-1 rounded px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-white transition-colors"
              style={{ backgroundColor: 'rgb(5, 22, 80)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
            >
              <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              View Full
            </button>
          </div>
        </div>
      </div>

      <ProfileRequiredDialog open={showProfileEmptyDialog} onOpenChange={setShowProfileEmptyDialog} />

      {/* Tailor CV Dialog */}
      <Dialog open={tailorCVOpen} onOpenChange={setTailorCVOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2 sm:space-y-3 pb-4 sm:pb-6">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900">{t.tailorToJobPost}</DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600">{t.tailorDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2 sm:space-y-3">
              <Textarea
                id="job-description"
                placeholder={t.jobDescriptionPlaceholder}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[150px] sm:min-h-[180px] resize-none border-gray-200 text-gray-700 placeholder:text-gray-400 rounded-lg p-3 sm:p-4 text-sm leading-relaxed"
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                  e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.borderColor = ''
                }}
              />
            </div>
            <div className="pt-2 sm:pt-4">
              <button
                onClick={handleTailorCV}
                disabled={isTailoring || !jobDescription.trim()}
                className="w-full h-11 sm:h-12 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
                style={{
                  background: isTailoring || !jobDescription.trim()
                    ? 'rgba(5, 22, 80, 0.5)'
                    : 'linear-gradient(to right, rgb(5, 22, 80), rgb(15, 32, 90))'
                }}
                onMouseEnter={(e) => {
                  if (!isTailoring && jobDescription.trim()) {
                    e.currentTarget.style.background = 'linear-gradient(to right, rgb(15, 32, 90), rgb(25, 42, 100))'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isTailoring && jobDescription.trim()) {
                    e.currentTarget.style.background = 'linear-gradient(to right, rgb(5, 22, 80), rgb(15, 32, 90))'
                  }
                }}
              >
                {isTailoring ? (
                  <>
                    <Icon icon="tabler:loader" className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    {t.aiGenerating}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    {t.aiGenerate}
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Create Cover Letter Dialog */}
      <Dialog open={createCoverLetterOpen} onOpenChange={setCreateCoverLetterOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] border-0 shadow-2xl flex flex-col p-0">
          <div className="p-4 sm:p-6 flex-shrink-0 border-b">
            <DialogHeader className="space-y-2 sm:space-y-3">
              <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                {t.createCoverletter}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base text-gray-600">
                {t.coverLetterDescription}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="overflow-y-auto flex-1 p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {/* Job Details Section */}
              <div className="space-y-2">
                <Label htmlFor="job-title" className="text-sm font-medium text-gray-700">
                  {t.jobTitle}
                </Label>
                <Input
                  id="job-title"
                  placeholder={t.jobTitlePlaceholder}
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="border-gray-200 text-gray-700 rounded-lg"
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                    e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = ''
                    e.currentTarget.style.borderColor = ''
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-name" className="text-sm font-medium text-gray-700">
                  {t.companyName}
                </Label>
                <Input
                  id="company-name"
                  placeholder={t.companyNamePlaceholder}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="border-gray-200 text-gray-700 rounded-lg"
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                    e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = ''
                    e.currentTarget.style.borderColor = ''
                  }}
                />
              </div>

              {/* Job Description Textarea */}
              <div className="space-y-2">
                <Label htmlFor="job-description" className="text-sm font-medium text-gray-700">
                  {t.jobDescription}
                </Label>
                <Textarea
                  id="job-description"
                  placeholder={t.jobDescriptionPlaceholder}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[100px] sm:min-h-[120px] resize-none border-gray-200 text-gray-700 placeholder:text-gray-400 rounded-lg p-3 sm:p-4 text-sm leading-relaxed"
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                    e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = ''
                    e.currentTarget.style.borderColor = ''
                  }}
                />
              </div>

              {/* Tone Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">{t.coverLetterTone}</Label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
                  {[
                    { value: "professional", label: t.toneProfessional, icon: "tabler:briefcase" },
                    { value: "enthusiastic", label: t.toneEnthusiastic, icon: "tabler:sparkles" },
                    { value: "formal", label: t.toneFormal, icon: "tabler:building-skyscraper" },
                    { value: "casual", label: t.toneCasual, icon: "tabler:message-chat" },
                  ].map((tone) => (
                    <button
                      key={tone.value}
                      type="button"
                      onClick={() => setSelectedTone(tone.value as any)}
                      className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg border-2 transition-all duration-200 ${selectedTone === tone.value
                        ? "bg-blue-50"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      style={selectedTone === tone.value ? {
                        borderColor: 'rgb(176, 196, 222)',
                        backgroundColor: 'rgba(176, 196, 222, 0.1)',
                        color: 'rgb(5, 22, 80)'
                      } : {}}
                    >
                      <Icon icon={tone.icon} className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
                      <span className="text-[10px] sm:text-xs font-medium text-center">{tone.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 flex-shrink-0 border-t bg-gray-50">
            <button
              onClick={handleCreateCoverLetter}
              disabled={isGeneratingCoverLetter || !jobDescription.trim() || !jobTitle.trim()}
              className="w-full h-11 sm:h-12 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative flex items-center justify-center"
              style={{
                background: isGeneratingCoverLetter || !jobDescription.trim() || !jobTitle.trim()
                  ? 'rgba(5, 22, 80, 0.5)'
                  : 'linear-gradient(to right, rgb(5, 22, 80), rgb(15, 32, 90))'
              }}
              onMouseEnter={(e) => {
                if (!isGeneratingCoverLetter && jobDescription.trim() && jobTitle.trim()) {
                  e.currentTarget.style.background = 'linear-gradient(to right, rgb(15, 32, 90), rgb(25, 42, 100))'
                }
              }}
              onMouseLeave={(e) => {
                if (!isGeneratingCoverLetter && jobDescription.trim() && jobTitle.trim()) {
                  e.currentTarget.style.background = 'linear-gradient(to right, rgb(5, 22, 80), rgb(15, 32, 90))'
                }
              }}
            >
              {isGeneratingCoverLetter ? (
                <>
                  <Icon icon="tabler:loader" className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span className="text-sm sm:text-base">{t.generatingCoverLetter}</span>
                </>
              ) : (
                <>
                  <Icon icon="tabler:file-text" className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">{t.generateCoverLetter}</span>
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-1 rounded-full">
                    BETA
                  </span>
                </>
              )}
            </button>

            <p className="text-[10px] sm:text-xs text-gray-500 text-center mt-2">{t.betaNotice}</p>
          </div>
        </DialogContent>
      </Dialog>


      {/* Cover Letter Result Dialog */}
      {/* Cover Letter Result Dialog */}
      <Dialog
        open={showCoverLetterResult}
        onOpenChange={(open) => {
          if (!open && !isClosing) return
          setShowCoverLetterResult(open)
        }}
      >
        <DialogContent
          className="max-w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[90vh] border-0 shadow-2xl flex flex-col p-0"
          onInteractOutside={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 flex-shrink-0 border-b bg-gradient-to-r from-gray-50 to-white">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Icon icon="tabler:file-text" className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 flex-shrink-0" />
                <span>{t.generatedCoverLetter || "Generated Cover Letter"}</span>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-gray-600">
                {t.coverLetterReady || "Your cover letter is ready. You can copy, download, or save it to your CV."}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Cover Letter Content */}
          <div className="overflow-y-auto flex-1 p-4 sm:p-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="max-h-[35vh] sm:max-h-[45vh] overflow-y-auto p-4 sm:p-6">
                <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm sm:text-base leading-relaxed">
                  {generatedCoverLetter}
                </pre>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-6 flex-shrink-0 border-t bg-gray-50 space-y-3">
            {/* Primary Actions - 2x2 grid on mobile, 1x4 on tablet+ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Copy Button */}
              <button
                onClick={handleCopyCoverLetter}
                className="
                  h-10 sm:h-11
                  flex items-center justify-center gap-1.5 sm:gap-2
                  px-3
                  text-xs sm:text-sm font-medium
                  bg-white
                  border-2 transition-all
                  rounded-lg
                  hover:scale-[1.02]
                  active:scale-[0.98]
                "
                style={{ borderColor: 'rgb(176, 196, 222)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(176, 196, 222, 0.1)'
                  e.currentTarget.style.borderColor = 'rgb(5, 22, 80)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                  e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                }}
              >
                <Icon icon="tabler:copy" className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{t.copyToClipboard || "Copy"}</span>
                <span className="sm:hidden">{t.copy || "Copy"}</span>
              </button>

              {/* Download Button */}
              <button
                onClick={handleDownloadCoverLetter}
                className="
                  h-10 sm:h-11
                  flex items-center justify-center gap-1.5 sm:gap-2
                  px-3
                  text-xs sm:text-sm font-medium
                  bg-white
                  border-2 transition-all
                  rounded-lg
                  hover:scale-[1.02]
                  active:scale-[0.98]
                "
                style={{
                  borderColor: 'rgb(176, 196, 222)',
                  color: 'rgb(5, 22, 80)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(176, 196, 222, 0.1)'
                  e.currentTarget.style.borderColor = 'rgb(5, 22, 80)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                  e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                }}
              >
                <Icon icon="tabler:download" className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{t.download || "Download"}</span>
                <span className="sm:hidden">{t.download || "Download"}</span>
              </button>

              {/* Save to CV Button */}
              <button
                onClick={handleSaveCoverLetter}
                disabled={savingCoverLetter}
                className="
                  h-10 sm:h-11
                  flex items-center justify-center gap-1.5 sm:gap-2
                  px-3
                  text-xs sm:text-sm font-medium
                  bg-white
                  border-2 transition-all
                  rounded-lg
                  hover:scale-[1.02]
                  active:scale-[0.98]
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  disabled:hover:scale-100
                "
                style={{
                  borderColor: 'rgb(176, 196, 222)',
                  color: 'rgb(5, 22, 80)'
                }}
                onMouseEnter={(e) => {
                  if (!savingCoverLetter) {
                    e.currentTarget.style.backgroundColor = 'rgba(176, 196, 222, 0.1)'
                    e.currentTarget.style.borderColor = 'rgb(5, 22, 80)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!savingCoverLetter) {
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                  }
                }}
              >
                {savingCoverLetter ? (
                  <>
                    <Icon icon="tabler:loader" className="h-4 w-4 animate-spin flex-shrink-0" />
                    <span className="hidden sm:inline">{t.saving || "Saving..."}</span>
                    <span className="sm:hidden">{t.saving || "Saving..."}</span>
                  </>
                ) : (
                  <>
                    <Icon icon="tabler:device-floppy" className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{t.saveToCV || "Save to CV"}</span>
                    <span className="sm:hidden">{t.save || "Save"}</span>
                  </>
                )}
              </button>

              {/* Close Button */}
              <button
                onClick={() => {
                  setJobTitle("")
                  setCompanyName("")
                  setJobDescription("")
                  setSelectedTone("professional")
                  setIsClosing(true)
                  setShowCoverLetterResult(false)
                  setTimeout(() => setIsClosing(false), 100)
                }}
                className="
                  h-10 sm:h-11
                  flex items-center justify-center gap-1.5 sm:gap-2
                  px-3
                  text-xs sm:text-sm font-medium
                  text-white
                  rounded-lg
                  transition-all
                  hover:scale-[1.02]
                  active:scale-[0.98]
                  shadow-md
                "
                style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                }}
              >
                <Icon icon="tabler:check" className="h-4 w-4 flex-shrink-0" />
                <span>{t.close || "Close"}</span>
              </button>
            </div>

            {/* Regenerate Button - Full Width */}
            <button
              onClick={handleCreateCoverLetter}
              disabled={isGeneratingCoverLetter}
              className="
                w-full
                h-9 sm:h-10
                flex items-center justify-center gap-2
                text-xs sm:text-sm font-medium
                text-gray-600
                bg-white
                border border-gray-200
                rounded-lg
                transition-all
                hover:bg-gray-50
                hover:text-gray-800
                hover:border-gray-300
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              {isGeneratingCoverLetter ? (
                <>
                  <Icon icon="tabler:loader" className="h-4 w-4 animate-spin" />
                  <span>{t.regenerating || "Regenerating..."}</span>
                </>
              ) : (
                <>
                  <Icon icon="tabler:refresh" className="h-4 w-4" />
                  <span>{t.regenerate || "Regenerate Cover Letter"}</span>
                </>
              )}
            </button>

            {/* Helper Text */}
            <p className="text-[10px] sm:text-xs text-center text-gray-500 pt-1">
              {t.coverLetterHelperText || "You can regenerate the cover letter or close this dialog"}
            </p>
          </div>
        </DialogContent>
      </Dialog>


      {/* Save CV Name Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              {t.save} {t.yourCVs}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
            {/* Input for custom CV name */}
            <div className="space-y-2">
              <Label htmlFor="cv-name" className="text-sm font-medium">
                {t.fileName}
              </Label>
              <Input
                id="cv-name"
                placeholder={`${t.jobTitlePlaceholder}, ${t.titlePlaceholder}`}
                value={customCvName}
                onChange={(e) => setCustomCvName(e.target.value)}
                className="w-full text-sm sm:text-base"
                disabled={isSaving}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                  e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = ''
                  e.currentTarget.style.borderColor = ''
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSaving && customCvName.trim()) {
                    handleConfirmSave()
                  }
                }}
              />
            </div>

            {/* Suggested CV names */}
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm font-medium text-gray-600">{t.example}:</Label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {[
                  cvData.personalInfo?.title ? `${cvData.personalInfo.title} ${t.cv}` : null,
                  cvData.personalInfo?.firstName && cvData.personalInfo?.lastName
                    ? `${cvData.personalInfo.firstName} ${cvData.personalInfo.lastName} ${t.cv}`
                    : null,
                  `${t.toneProfessional} ${t.cv}`,
                  `${t.myProfile} ${t.cv}`,
                ]
                  .filter(Boolean)
                  .slice(0, 3)
                  .map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-[10px] sm:text-xs h-6 sm:h-7 bg-transparent px-2 sm:px-3"
                      onClick={() => setCustomCvName(suggestion as string)}
                      disabled={isSaving}
                    >
                      {suggestion}
                    </Button>
                  ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveDialog(false)
                setCustomCvName("")
              }}
              disabled={isSaving}
              className="text-sm"
            >
              {t.cancel}
            </Button>

            <button
              onClick={handleConfirmSave}
              disabled={!customCvName.trim() || isSaving}
              className="px-3 sm:px-4 py-2 text-white text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              style={{ backgroundColor: 'rgb(5, 22, 80)' }}
              onMouseEnter={(e) => {
                if (!isSaving && customCvName.trim()) {
                  e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving && customCvName.trim()) {
                  e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'
                }
              }}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t.savingDetailsButton}...
                </>
              ) : (
                <>
                  <SaveAllIcon className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {t.save} {t.cv}
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Forms */}
      <PersonalInfoForm
        personalInfo={cvData.personalInfo}
        open={personalInfoFormOpen}
        onOpenChange={setPersonalInfoFormOpen}
        onSave={handleSavePersonalInfo}
      />
      <SkillForm skill={editingSkill} open={skillFormOpen} onOpenChange={setSkillFormOpen} onSave={handleSaveSkill} />
      <ProjectForm
        project={editingProject}
        open={projectFormOpen}
        onOpenChange={setProjectFormOpen}
        onSave={handleSaveProject}
      />
      <LanguageForm
        language={editingLanguage}
        open={languageFormOpen}
        onOpenChange={setLanguageFormOpen}
        onSave={handleSaveLanguage}
      />
      <ReferenceForm
        reference={editingReference}
        open={referenceFormOpen}
        onOpenChange={setReferenceFormOpen}
        onSave={handleSaveReference}
      />
      <CertificationForm
        certification={editingCertification}
        open={certificationFormOpen}
        onOpenChange={setCertificationFormOpen}
        onSave={handleSaveCertification}
      />
      <EmployerForm
        employer={editingEmployer}
        open={employerFormOpen}
        onOpenChange={setEmployerFormOpen}
        onSave={handleSaveEmployer}
      />
      <EducationForm
        education={editingEducation}
        open={educationFormOpen}
        onOpenChange={setEducationFormOpen}
        onSave={handleSaveEducation}
      />

      {/* Sync to Profile Confirmation Dialog */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <User className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: 'rgb(5, 22, 80)' }} />
              {t.syncToProfileTitle}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t.syncToProfileDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
            {/* Show what will be synced */}
            <div className="space-y-2 sm:space-y-3">
              {itemsToSync.employers.length > 0 && (
                <div className="p-2.5 sm:p-3 rounded-lg" style={{
                  backgroundColor: 'rgba(176, 196, 222, 0.1)',
                  borderColor: 'rgba(176, 196, 222, 0.3)',
                  border: '1px solid'
                }}>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" style={{ color: 'rgb(5, 22, 80)' }} />
                    <h4 className="font-medium text-sm sm:text-base" style={{ color: 'rgb(5, 22, 80)' }}>
                      {t.employmentHistoryNew.replace('{count}', String(itemsToSync.employers.length))}
                    </h4>
                  </div>
                  <ul className="text-xs sm:text-sm ml-5 sm:ml-6 list-disc space-y-0.5 sm:space-y-1" style={{ color: 'rgb(5, 22, 80)' }}>
                    {itemsToSync.employers.slice(0, 3).map((emp: any, idx: number) => (
                      <li key={idx} className="break-words">
                        {emp.title} {t.at} {emp.employer}
                      </li>
                    ))}
                    {itemsToSync.employers.length > 3 && (
                      <li style={{ color: 'rgb(5, 22, 80)', opacity: 0.7 }}>
                        {t.andMoreItems.replace('{count}', String(itemsToSync.employers.length - 3))}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {itemsToSync.education.length > 0 && (
                <div className="p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                    <h4 className="font-medium text-green-900 text-sm sm:text-base">
                      {t.educationNew.replace('{count}', String(itemsToSync.education.length))}
                    </h4>
                  </div>
                  <ul className="text-xs sm:text-sm text-green-800 ml-5 sm:ml-6 list-disc space-y-0.5 sm:space-y-1">
                    {itemsToSync.education.slice(0, 3).map((edu: any, idx: number) => (
                      <li key={idx} className="break-words">
                        {edu.program} {t.at} {edu.school}
                      </li>
                    ))}
                    {itemsToSync.education.length > 3 && (
                      <li className="text-green-600">
                        {t.andMoreItems.replace('{count}', String(itemsToSync.education.length - 3))}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {itemsToSync.languages.length > 0 && (
                <div className="p-2.5 sm:p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600 flex-shrink-0" />
                    <h4 className="font-medium text-purple-900 text-sm sm:text-base">
                      {t.languagesNew.replace('{count}', String(itemsToSync.languages.length))}
                    </h4>
                  </div>
                  <ul className="text-xs sm:text-sm text-purple-800 ml-5 sm:ml-6 list-disc space-y-0.5 sm:space-y-1">
                    {itemsToSync.languages.slice(0, 3).map((lang: any, idx: number) => (
                      <li key={idx} className="break-words">
                        {lang.language} ({lang.level})
                      </li>
                    ))}
                    {itemsToSync.languages.length > 3 && (
                      <li className="text-purple-600">
                        {t.andMoreItems.replace('{count}', String(itemsToSync.languages.length - 3))}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {itemsToSync.certifications.length > 0 && (
                <div className="p-2.5 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-600 flex-shrink-0" />
                    <h4 className="font-medium text-yellow-900 text-sm sm:text-base">
                      {t.certificationsNew.replace('{count}', String(itemsToSync.certifications.length))}
                    </h4>
                  </div>
                  <ul className="text-xs sm:text-sm text-yellow-800 ml-5 sm:ml-6 list-disc space-y-0.5 sm:space-y-1">
                    {itemsToSync.certifications.slice(0, 3).map((cert: any, idx: number) => (
                      <li key={idx} className="break-words">
                        {cert.title} by {cert.issuer}
                      </li>
                    ))}
                    {itemsToSync.certifications.length > 3 && (
                      <li className="text-yellow-600">
                        {t.andMoreItems.replace('{count}', String(itemsToSync.certifications.length - 3))}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {itemsToSync.projects.length > 0 && (
                <div className="p-2.5 sm:p-3 rounded-lg" style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  borderColor: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid'
                }}>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-600 flex-shrink-0" />
                    <h4 className="font-medium text-indigo-900 text-sm sm:text-base">
                      {t.projectsNew.replace('{count}', String(itemsToSync.projects.length))}
                    </h4>
                  </div>
                  <ul className="text-xs sm:text-sm text-indigo-800 ml-5 sm:ml-6 list-disc space-y-0.5 sm:space-y-1">
                    {itemsToSync.projects.slice(0, 3).map((proj: any, idx: number) => (
                      <li key={idx} className="break-words">
                        {proj.role} {proj.company && `${t.at} ${proj.company}`}
                      </li>
                    ))}
                    {itemsToSync.projects.length > 3 && (
                      <li className="text-indigo-600">
                        {t.andMoreItems.replace('{count}', String(itemsToSync.projects.length - 3))}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {itemsToSync.references.length > 0 && (
                <div className="p-2.5 sm:p-3 bg-pink-50 border border-pink-200 rounded-lg">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pink-600 flex-shrink-0" />
                    <h4 className="font-medium text-pink-900 text-sm sm:text-base">
                      {t.referencesNew.replace('{count}', String(itemsToSync.references.length))}
                    </h4>
                  </div>
                  <ul className="text-xs sm:text-sm text-pink-800 ml-5 sm:ml-6 list-disc space-y-0.5 sm:space-y-1">
                    {itemsToSync.references.slice(0, 3).map((ref: any, idx: number) => (
                      <li key={idx} className="break-words">
                        {ref.firstName} {ref.lastName} ({ref.company})
                      </li>
                    ))}
                    {itemsToSync.references.length > 3 && (
                      <li className="text-pink-600">
                        {t.andMoreItems.replace('{count}', String(itemsToSync.references.length - 3))}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-700">
                <strong>{t.note}:</strong> {t.skillsAutoSyncNote}
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (pendingSaveData) {
                  performSave(pendingSaveData, false)
                }
              }}
              disabled={isSaving}
              className="sm:order-1 text-sm"
            >
              {t.noJustSaveCV}
            </Button>
            <button
              onClick={() => {
                if (pendingSaveData) {
                  performSave(pendingSaveData, true)
                }
              }}
              disabled={isSaving}
              className="sm:order-2 px-3 sm:px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
              style={{ backgroundColor: 'rgb(5, 22, 80)' }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'
                }
              }}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t.saving}
                </>
              ) : (
                <>
                  <User className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {t.yesSyncToProfile}
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
      <MightHaveSkillsPopup
        open={open}
        onClose={() => setOpen(false)}
        skills={MightHaveSkills}
        onSave={handleSaveMightHaveSkills}
      />
      <SavedCoverLettersDialog
        open={showSavedCoverLettersDialog}
        onOpenChange={setShowSavedCoverLettersDialog}
        cvId={getCvId()}
        userId={session?.user?.id || ""}
        onGenerateNew={() => setCreateCoverLetterOpen(true)}
      />
    </div>
  )
}
