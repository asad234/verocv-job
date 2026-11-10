"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  FileText,
  Download,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  User,
  Briefcase,
  Code,
  Copy,
  Plus,
  Clock,
  Lock,
  Menu,
  X,
  Globe,
  GraduationCap,
  Languages,
  MoreHorizontal,
  Award,
  Users,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { toast as sonnerToast } from "sonner";
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useDashboardTranslation } from "@/hooks/useDashboardTranslation"
import { useManagerAccess } from "@/hooks/useManagerAccess"
import { CVData } from "@/utils/types"
import { downloadCvPdf } from "@/utils/pdfDownloadLink";
import { motion } from "framer-motion"
import HoverButton from "./hoverbtn"
import { SavedCoverLettersDialog } from "../SavedCoverLettersDialog"

interface PortfolioItem {
  id: string
  type: 'image' | 'video' | 'youtube' | 'link' | 'document'
  title: string
  description?: string
  imageUrl?: string
  videoUrl?: string
  youtubeUrl?: string
  youtubeVideoId?: string
  linkUrl?: string
  documentUrl?: string
  documentName?: string
}

export default function CVManagerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useDashboardTranslation()
  // "Hide from manager" is only shown to employees connected to a manager.
  const { hasAccess: canHide } = useManagerAccess()
  const [cvs, setCvs] = useState<CVData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCV, setSelectedCV] = useState<CVData | null>(null)
  const [cvToDelete, setCvToDelete] = useState<CVData | null>(null)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("")
  const [deletingCvs, setDeletingCvs] = useState<Set<string>>(new Set())
  const [duplicatingCvs, setDuplicatingCvs] = useState<Set<string>>(new Set())
  const [togglingHiddenCvs, setTogglingHiddenCvs] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<"updated" | "created" | "name">("updated")
  const [filterTemplate, setFilterTemplate] = useState<string>("all")
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  //make public cv variables
  const [cvToPublish, setCvToPublish] = useState<CVData | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publicLink, setPublicLink] = useState<string | null>(null);

  const [showCoverLettersDialog, setShowCoverLettersDialog] = useState(false)
  const [selectedCvForLetters, setSelectedCvForLetters] = useState<CVData | null>(null)



  // Helper function to filter visible items
  const getVisibleItems = <T extends { visible?: boolean }>(items: T[] | undefined): T[] => {
    return (items || []).filter(item => item.visible !== false)
  }

  const fetchCVs = async () => {
    if (status !== "authenticated" || !session?.user?.id) return

    try {
      setLoading(true)
      const response = await fetch(`/api/cv?userId=${session.user.id}`)
      const result = await response.json()

      if (response.ok && result.success) {
        console.log("Fetched CVs:", result.data)
        setCvs(result.data || [])
      } else {
        console.error("Failed to fetch CVs:", result.error)
        toast({
          title: t.errorLoadingProfile,
          description: result.error || t.failedToConnectServer,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching CVs:", error)
      toast({
        title: t.errorLoadingProfile,
        description: t.failedToConnectServer,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNewCV = () => {
    router.push("/dashboard/cv/edit")
  }

  const handleCreateFromTemplate = (templateId: string) => {
    router.push(`/dashboard/cv/edit?template=${templateId}`)
  }

  const handleDuplicateCV = async (cv: CVData) => {
    if (!session?.user?.id) return

    setDuplicatingCvs((prev) => new Set(prev).add(cv.id!))

    try {
      const duplicateData = {
        cvData: {
          personalInfo: cv.personalInfo,
          skills: getVisibleItems(cv.skills),
          experience: getVisibleItems(cv.experience),
          education: getVisibleItems(cv.education),
          projects: getVisibleItems(cv.projects),
          languages: getVisibleItems(cv.languages),
          certifications: getVisibleItems(cv.certifications),
          references: getVisibleItems(cv.references),
          template: cv.template,
          visibility: cv.visibility,
        },
        userId: session.user.id,
        cvName: `${cv.name} (${t.copyToClipboard})`,
        template: cv.template,
        visibility: cv.visibility,
      }

      const response = await fetch("/api/cv/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicateData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: t.cvDuplicated,
          description: t.cvDuplicatedDesc.replace("{name}", result.data.name),
          duration: 3000,
        })
        await fetchCVs()
      } else {
        throw new Error(result.error || t.couldNotDuplicate)
      }
    } catch (error) {
      console.error("Error duplicating CV:", error)
      toast({
        title: t.duplicationFailed,
        description: error instanceof Error ? error.message : t.couldNotDuplicate,
        variant: "destructive",
      })
    } finally {
      setDuplicatingCvs((prev) => {
        const newSet = new Set(prev)
        newSet.delete(cv.id!)
        return newSet
      })
    }
  }

  const handleDownloadCV = async (cv: CVData) => {
    await downloadCvPdf({
      template: cv.template!,
      cvData: cv,
      visibility: cv.visibility!,
      toast,
      portfolioItems: (cv.portfolioItems ?? []) as PortfolioItem[],
    });
  };

  //make public handle for button
  const handleTogglePublic = async (cvId: string, currentState: boolean) => {
    if (!session?.user?.id || !cvId) return;

    setPublishing(true);

    try {
      const res = await fetch(`/api/cv/public-cv/${encodeURIComponent(cvId)}/make-public`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId, currentState, userId: session.user.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.error || "Failed to toggle CV visibility");

      // Update local state
      setCvs((prev) =>
        prev.map((cv) => (cv.id === cvId ? { ...cv, isPublic: data.cv.isPublic, url: data.cv.url } : cv))
      );

      toast({
        title: data.cv.isPublic ? t.cvPublishedToast : t.cvMadePrivateToast,
        description: data.cv.isPublic
          ? t.cvNowPublicToast
          : t.cvNowPrivateToast,
        duration: 3000,
      });

      return data.cv.url;
    } catch (err: any) {
      console.error("Failed to toggle CV:", err);
      toast({
        title: "Misslyckades",
        description: err.message || "Kunde inte ändra CV:s synlighet",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
      setCvToPublish(null);
    }
  };

  // When user clicks "Make Public" or "Make Private"
  const openPublishModal = (cv: CVData) => {
    setCvToPublish(cv); // this triggers the modal to open
  };

  // ── Toggle whether the manager can see this CV ─────────────────────────────
  const handleToggleHidden = async (cv: CVData) => {
    if (!session?.user?.id || !cv.id) return

    const nextHidden = !cv.hidden

    setTogglingHiddenCvs((prev) => new Set(prev).add(cv.id!))
    // Optimistic update
    setCvs((prev) => prev.map((c) => (c.id === cv.id ? { ...c, hidden: nextHidden } : c)))

    try {
      const res = await fetch("/api/cv", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cv.id, userId: session.user.id, hidden: nextHidden }),
      })
      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.error || t.couldNotDelete)
      }

      toast({
        title: nextHidden ? (t.cvHiddenToast ?? "CV hidden") : (t.cvUnhiddenToast ?? "CV visible again"),
        description: nextHidden
          ? (t.cvHiddenDesc ?? "Your manager will no longer see this CV.")
          : (t.cvUnhiddenDesc ?? "Your manager can now see this CV."),
        duration: 3000,
      })
    } catch (error) {
      console.error("Error toggling CV visibility:", error)
      // Revert optimistic update
      setCvs((prev) => prev.map((c) => (c.id === cv.id ? { ...c, hidden: cv.hidden } : c)))
      toast({
        title: t.errorLoadingProfile,
        description: error instanceof Error ? error.message : t.failedToConnectServer,
        variant: "destructive",
      })
    } finally {
      setTogglingHiddenCvs((prev) => {
        const newSet = new Set(prev)
        newSet.delete(cv.id!)
        return newSet
      })
    }
  }

  const handleDeleteCV = async (cvId: string) => {
    if (!session?.user?.id) return

    setDeletingCvs((prev) => new Set(prev).add(cvId))

    try {
      const response = await fetch(`/api/cv?id=${cvId}&userId=${session.user.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setCvs((prev) => prev.filter((cv) => cv.id !== cvId))
        toast({
          title: t.cvDeleted,
          description: t.cvDeletedDesc,
          duration: 3000,
        })
      } else {
        throw new Error(result.error || t.couldNotDelete)
      }
    } catch (error) {
      console.error("Error deleting CV:", error)
      toast({
        title: t.deleteFailed,
        description: error instanceof Error ? error.message : t.couldNotDelete,
        variant: "destructive",
      })
    } finally {
      document.body.style.pointerEvents = "auto"
      setDeletingCvs((prev) => {
        const newSet = new Set(prev)
        newSet.delete(cvId)
        return newSet
      })
      setCvToDelete(null)
      setDeleteConfirmationText("")
    }
  }

  const handleEditCV = (id: string) => {
    router.push(`/dashboard/cv/edit/${id}`)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const getRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

      if (diffInHours < 1) return t.justNow
      if (diffInHours < 24) return t.hoursAgo.replace("{hours}", Math.floor(diffInHours).toString())
      if (diffInHours < 168) return t.daysAgo.replace("{days}", Math.floor(diffInHours / 24).toString())
      return formatDate(dateString)
    } catch {
      return dateString
    }
  }

  const filteredAndSortedCvs = cvs
    .filter((cv) => filterTemplate === "all" || cv.template === filterTemplate)
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name!.localeCompare(b.name!)
        case "created":
          return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
        case "updated":
        default:
          return new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime()
      }
    })

  const availableTemplates = [...new Set(cvs.map((cv) => cv.template))].filter(Boolean)

  useEffect(() => {
    if (status === "authenticated") {
      fetchCVs()
    } else if (status === "unauthenticated") {
      setLoading(false)
    }
  }, [status, session?.user?.id])

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-4 px-4 sm:py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-500">{t.loadingCVs}</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto py-4 px-4 sm:py-8">
        <div className="text-center py-12 text-gray-500">{t.signInToViewCVs}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-4 px-3 sm:py-6 sm:px-4 lg:py-8 lg:px-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white truncate">
              {t.yourCVs}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
              {t.manageCVsDescription
                .replace("{count}", cvs.length.toString())
                .replace("{plural}", cvs.length !== 1 ? "s" : "")}
            </p>
          </div>
          <div className="flex gap-2 sm:flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent w-full sm:w-auto text-sm sm:text-base">
                  <Plus className="h-4 w-4" />
                  <span >{t.createCV}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t.createCV}</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleCreateNewCV}>
                  <FileText className="mr-2 h-4 w-4" />
                  {t.startFromScratch}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/*
                <DropdownMenuLabel>{t.quickTemplates}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleCreateFromTemplate("modern")}>
                  <FileText className="mr-2 h-4 w-4" />
                  {t.modernTemplate}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCreateFromTemplate("classic")}>
                  <FileText className="mr-2 h-4 w-4" />
                  {t.classicTemplate}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCreateFromTemplate("creative")}>
                  <FileText className="mr-2 h-4 w-4" />
                  {t.creativeTemplate}
                </DropdownMenuItem>
                */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters and Sorting */}
        {cvs.length > 0 && (
          <>
            {/* Mobile Filter Toggle */}
            <div className="sm:hidden">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              >
                {showMobileFilters ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                {showMobileFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>

            {/* Filters */}
            <div className={`${showMobileFilters ? "flex" : "hidden"} sm:flex flex-col sm:flex-row gap-3 sm:gap-4`}>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 flex-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full sm:w-auto px-3 py-2 border rounded-md text-sm bg-background"
                >
                  <option value="updated">{t.sortByLastUpdated}</option>
                  <option value="created">{t.sortByDateCreated}</option>
                  <option value="name">{t.sortByName}</option>
                </select>

                <select
                  value={filterTemplate}
                  onChange={(e) => setFilterTemplate(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border rounded-md text-sm bg-background"
                >
                  <option value="all">{t.allTemplates}</option>
                  {availableTemplates.map((template) => (
                    <option key={template} value={template}>
                      {template!.charAt(0).toUpperCase() + template!.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs sm:text-sm text-gray-500 flex items-center justify-center sm:justify-start">
                {t.showingCVs
                  .replace("{filtered}", filteredAndSortedCvs.length.toString())
                  .replace("{total}", cvs.length.toString())}
              </div>
            </div>
          </>
        )}
      </div>

      {/* CV List */}
      {filteredAndSortedCvs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed rounded-lg bg-gray-50 dark:bg-gray-800">
          <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 text-center">
            {cvs.length === 0 ? t.noCVsYet : t.noCVsMatchFilters}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 text-center px-4">
            {cvs.length === 0 ? t.createFirstCV : t.adjustFiltersOrCreate}
          </p>
          <Button onClick={handleCreateNewCV} className="mt-6 gap-2 text-sm sm:text-base">
            <FileText className="h-4 w-4" />
            {t.createCV}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {filteredAndSortedCvs.map((cv) => {
            const visibleSkills = getVisibleItems(cv.skills)
            const visibleExperience = getVisibleItems(cv.experience)
            const visibleEducation = getVisibleItems(cv.education)
            const visibleProjects = getVisibleItems(cv.projects)
            const visibleLanguages = getVisibleItems(cv.languages)
            const visibleCertifications = getVisibleItems(cv.certifications)
            const visibleReferences = getVisibleItems(cv.references)
            const cvPortfolio = (cv.portfolioItems ?? []) as PortfolioItem[]

            return (
              <motion.div
                key={cv.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className={`relative flex flex-col h-full overflow-hidden border border-gray-200 bg-white shadow-sm transition-all hover:shadow-xl hover:border-secondary/20 ${canHide && cv.hidden ? "opacity-70" : ""}`}>

                  {/* STATUS BAR */}
                  <div
                    className={`h-1.5 w-full transition-colors duration-300 ${cv.isPublic ? "bg-primary group-hover:bg-secondary" : "group-hover:bg-secondary"
                      }`}
                  />

                  <CardHeader className="p-6 pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        {/* CV Name */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-xl font-bold text-slate-900 truncate group-hover:text-primary transition-colors">
                            {cv.name}
                          </CardTitle>
                          {canHide && cv.hidden && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-800/85 text-white text-[10px] font-semibold flex-shrink-0">
                              <EyeOff className="h-2.5 w-2.5" />
                              {t.cvHiddenBadge ?? "Hidden"}
                            </span>
                          )}
                        </div>

                        {/* User Name */}
                        <p className="text-sm font-medium text-slate-500 mt-0.5">
                          {cv.personalInfo?.firstName} {cv.personalInfo?.lastName}
                        </p>
                      </div>

                      <HoverButton cv={cv} openPublishModal={openPublishModal} />
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 pt-2 flex-1">
                    {/* Metadata */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-6 flex-wrap">
                      <span className="flex items-center gap-1.5 font-medium uppercase tracking-tight">
                        <Clock className="h-3.5 w-3.5" />
                        {getRelativeTime(cv.updatedAt!)}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span className="font-medium uppercase tracking-tight">
                        {cv.template}
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-slate-50 pt-6">

                      {/* Experience */}
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                          <Briefcase className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 leading-none">
                            {visibleExperience.length}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">
                            {t.cvExperience}
                          </p>
                        </div>
                      </div>

                      {/* Education */}
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 leading-none">
                            {visibleEducation.length}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">
                            {t.cvEducation}
                          </p>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                          <Code className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 leading-none">
                            {visibleSkills.length}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">
                            {t.cvSkills}
                          </p>
                        </div>
                      </div>

                      {/* Projects */}
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 leading-none">
                            {visibleProjects.length}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">
                            {t.cvProjects}
                          </p>
                        </div>
                      </div>

                      {/* Languages */}
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                          <Languages className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 leading-none">
                            {visibleLanguages.length}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">
                            {t.cvLanguages}
                          </p>
                        </div>
                      </div>

                      {/* Certifications */}
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                          <Award className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 leading-none">
                            {visibleCertifications.length}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">
                            {t.cvCertifications}
                          </p>
                        </div>
                      </div>

                      {/* References */}
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 leading-none">
                            {visibleReferences.length}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">
                            {t.cvReferences}
                          </p>
                        </div>
                      </div>

                      {/* Portfolio — ADD THIS */}
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                          <Globe className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 leading-none">
                            {cvPortfolio.length}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">
                            {t.portfolios}
                          </p>
                        </div>
                      </div>

                    </div>
                  </CardContent>

                  <CardFooter className="p-5 pt-0 flex items-center gap-2">
                    {/* Preview */}
                    <Button
                      variant="outline"
                      className="
      flex-1 min-w-0 h-8
      px-3
      text-xs font-medium
      text-slate-600
      border-slate-200
      hover:bg-primary
      flex items-center justify-center gap-1.5
    "
                      onClick={() => setSelectedCV(cv)}
                    >
                      <Eye className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{t.cvPreviewDetails}</span>
                    </Button>

                    {/* Edit (Primary Action) */}
                    <Button
                      className="
      flex-1 min-w-0 h-8
      px-3
      text-xs font-semibold
      bg-primary hover:bg-secondary
      text-white
      flex items-center justify-center gap-1.5
    "
                      onClick={() => handleEditCV(cv.id!)}
                    >
                      <Edit className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{t.cvEdit}</span>
                    </Button>

                    {/* More */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="
          h-8 w-8 shrink-0
          border border-slate-200
          hover:bg-primary
        "
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="text-xs" onClick={() => handleDuplicateCV(cv)}>
                          <Copy className="mr-2 h-4 w-4 shrink-0" />
                          {t.cvDuplicate}
                        </DropdownMenuItem>

                        <DropdownMenuItem className="text-xs" onClick={() => handleDownloadCV(cv)}>
                          <Download className="mr-2 h-4 w-4 shrink-0" />
                          {t.cvDownloadPdf}
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="text-xs"
                          onClick={() => {
                            setSelectedCvForLetters(cv)
                            setShowCoverLettersDialog(true)
                          }}
                        >
                          <FileText className="mr-2 h-4 w-4 shrink-0" />
                          {t.cvCoverLetters}
                        </DropdownMenuItem>

                        {canHide && (
                          <DropdownMenuItem
                            className="text-xs"
                            disabled={togglingHiddenCvs.has(cv.id!)}
                            onClick={() => handleToggleHidden(cv)}
                          >
                            {cv.hidden ? (
                              <Eye className="mr-2 h-4 w-4 shrink-0" />
                            ) : (
                              <EyeOff className="mr-2 h-4 w-4 shrink-0" />
                            )}
                            {cv.hidden
                              ? (t.cvUnhideFromManager ?? "Unhide from manager")
                              : (t.cvHideFromManager ?? "Hide from manager")}
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          onClick={() => setCvToDelete(cv)}
                          className="text-xs text-red-600 focus:bg-red-50 focus:text-red-700"
                        >
                          <Trash2 className="mr-2 h-4 w-4 shrink-0" />
                          {t.cvDeletePermanently}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>

                </Card>

              </motion.div>
            )
          })}
        </div>
      )}

      {/* CV Preview Modal - Only show visible items */}
      {selectedCV && (
        <Dialog open={!!selectedCV} onOpenChange={() => setSelectedCV(null)}>
          <DialogContent className="w-[95vw] max-w-[900px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogTitle className="text-lg font-bold">
              {selectedCV.name} - {t.cvPreviewDetails}
            </DialogTitle>
            <div className="space-y-4 sm:space-y-6">
              {/* Personal Info */}
              {selectedCV.personalInfo && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      <CardTitle className="text-base sm:text-lg">{t.personalinformation}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <p className="font-medium text-sm sm:text-base">
                          {selectedCV.personalInfo.firstName} {selectedCV.personalInfo.lastName}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{selectedCV.personalInfo.title}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm break-all">{selectedCV.personalInfo.privateEmail}</p>
                        <p className="text-xs sm:text-sm">{selectedCV.personalInfo.phoneNumber}</p>
                      </div>
                    </div>
                    {selectedCV.personalInfo.personalPresentation && (
                      <p className="mt-2 text-xs sm:text-sm text-muted-foreground">{selectedCV.personalInfo.personalPresentation}</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Skills - Only visible */}
              {getVisibleItems(selectedCV.skills).length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <Code className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <CardTitle className="text-base sm:text-lg">
                      {t.skills} ({getVisibleItems(selectedCV.skills).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {getVisibleItems(selectedCV.skills).map((skill, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                          <span className="font-medium truncate pr-2">{skill.skillName}</span>
                          <Badge variant="outline" className="text-xs flex-shrink-0">{skill.skillRating}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Experience - Only visible */}
              {getVisibleItems(selectedCV.experience).length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <CardTitle className="text-base sm:text-lg">
                      {t.experience} ({getVisibleItems(selectedCV.experience).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      {getVisibleItems(selectedCV.experience).map((exp, index) => (
                        <div key={index} className="p-3 bg-muted rounded">
                          <h4 className="font-medium text-sm sm:text-base">{exp.title}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">{exp.employer}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(exp.startDate.toString())} - {exp.endDate ? formatDate(exp.endDate.toString()) : t.Present}
                          </p>
                          {exp.description && <p className="text-xs sm:text-sm mt-1">{exp.description}</p>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Education - Only visible */}
              {getVisibleItems(selectedCV.education).length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <CardTitle className="text-base sm:text-lg">
                      {t.Education} ({getVisibleItems(selectedCV.education).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      {getVisibleItems(selectedCV.education).map((edu, index) => (
                        <div key={index} className="p-3 bg-muted rounded">
                          <h4 className="font-medium text-sm sm:text-base">{edu.program}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">{edu.school}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(edu.startDate.toString())} - {edu.endDate ? formatDate(edu.endDate.toString()) : t.Present}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Projects - Only visible */}
              {getVisibleItems(selectedCV.projects).length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <CardTitle className="text-base sm:text-lg">
                      {t.Projects} ({getVisibleItems(selectedCV.projects).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      {getVisibleItems(selectedCV.projects).map((proj, index) => (
                        <div key={index} className="p-3 bg-muted rounded">
                          <h4 className="font-medium text-sm sm:text-base">{proj.role}</h4>
                          {proj.description && <p className="text-xs sm:text-sm mt-1">{proj.description}</p>}
                          {proj.skills && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {t.technologies}: {proj.skills}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Languages - Only visible */}
              {getVisibleItems(selectedCV.languages).length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <CardTitle className="text-base sm:text-lg">
                      {t.Languages} ({getVisibleItems(selectedCV.languages).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {getVisibleItems(selectedCV.languages).map((lang, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                          <span className="truncate pr-2">{lang.language}</span>
                          <Badge variant="outline" className="text-xs flex-shrink-0">{lang.level}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Certifications - Only visible */}
              {getVisibleItems(selectedCV.certifications).length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <CardTitle className="text-base sm:text-lg">
                      {t.Certifications} ({getVisibleItems(selectedCV.certifications).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getVisibleItems(selectedCV.certifications).map((cert, index) => (
                        <div key={index} className="p-2 bg-muted rounded">
                          <h4 className="font-medium text-sm sm:text-base">{cert.title}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">{cert.issuer}</p>
                          <p className="text-xs text-muted-foreground">
                            {cert.startDate ? formatDate(cert.startDate.toString()) : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* References - Only visible */}
              {getVisibleItems(selectedCV.references).length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <CardTitle className="text-base sm:text-lg">
                      {t.References} ({getVisibleItems(selectedCV.references).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getVisibleItems(selectedCV.references).map((ref, index) => (
                        <div key={index} className="p-2 bg-muted rounded">
                          <h4 className="font-medium text-sm sm:text-base">{ref.firstName} {ref.lastName}</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">{ref.positionTitle}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{ref.company}</p>
                          <p className="text-xs text-muted-foreground break-all">{ref.email}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Portfolio */}
              {/* Portfolio */}
              {((selectedCV.portfolioItems ?? []) as PortfolioItem[]).length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2 pb-3">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <CardTitle className="text-base sm:text-lg">
                      {t.portfolios} ({(selectedCV.portfolioItems as PortfolioItem[]).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(selectedCV.portfolioItems as PortfolioItem[]).map((item) => {
                        const url = (() => {
                          switch (item.type) {
                            case 'youtube':
                              return item.youtubeVideoId
                                ? `https://www.youtube.com/watch?v=${item.youtubeVideoId}`
                                : item.youtubeUrl
                            case 'image': return item.imageUrl
                            case 'video': return item.videoUrl
                            case 'link': return item.linkUrl
                            case 'document': return item.documentUrl
                            default: return undefined
                          }
                        })()

                        const icon = (() => {
                          switch (item.type) {
                            case 'youtube': return '▶'
                            case 'image': return '🖼'
                            case 'video': return '🎬'
                            case 'document': return '📄'
                            default: return '🔗'
                          }
                        })()

                        return (
                          <a
                            key={item.id}
                            href={url ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`
                              flex items-start gap-3 p-3 rounded-lg border border-slate-200
                              bg-slate-50 hover:bg-slate-100 hover:border-slate-300
                              transition-all group
                              ${!url ? 'pointer-events-none opacity-50' : ''}
                            `}
                          >
                            <span className="text-lg leading-none flex-shrink-0 mt-0.5">{icon}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-primary transition-colors">
                                {item.title}
                              </p>
                              <p className="text-xs text-slate-400 capitalize mt-0.5">{item.type}</p>
                              {item.description && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                  {item.description}
                                </p>
                              )}
                              {item.type === 'document' && item.documentName && (
                                <p className="text-xs text-slate-400 mt-0.5 truncate">
                                  {item.documentName}
                                </p>
                              )}
                            </div>
                            {url && (
                              <span className="text-slate-300 group-hover:text-primary flex-shrink-0 transition-colors text-sm">
                                ↗
                              </span>
                            )}
                          </a>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete CV Dialog */}
      <AlertDialog open={!!cvToDelete} onOpenChange={() => setCvToDelete(null)}>
        <AlertDialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 text-lg sm:text-xl">{t.deleteCVTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              {t.deleteCVConfirm.replace("{name}", cvToDelete?.name || "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Trash2 className="w-3 h-3 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-red-800 mb-1 text-sm sm:text-base">{t.thisWillPermanentlyDelete}</h4>
                  <ul className="text-xs sm:text-sm text-red-700 mt-2 ml-4 list-disc space-y-0.5">
                    <li>{t.personalInfoAndContact}</li>
                    <li>{t.workExperienceHistory}</li>
                    <li>{t.skillsAndProficiency.replace("{count}", (cvToDelete?.skills?.length || 0).toString())}</li>
                    <li>{t.educationBackground.replace("{count}", (cvToDelete?.education?.length || 0).toString())}</li>
                    <li>{t.projectsAndCertifications}</li>
                    <li>{t.templateAndLayout}</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mb-2">
              {t.typeCVNameToConfirm.replace("{name}", cvToDelete?.name || "")}
            </p>
            <Input
              placeholder={t.typeCVNamePlaceholder.replace("{name}", cvToDelete?.name || "")}
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              className="text-sm"
            />
          </div>
          <AlertDialogFooter className="flex-col xs:flex-row gap-2">
            <AlertDialogCancel
              onClick={() => setDeleteConfirmationText("")}
              className="w-full xs:w-auto text-sm"
            >
              {t.cancelButton}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cvToDelete && handleDeleteCV(cvToDelete.id!)}
              disabled={deleteConfirmationText !== cvToDelete?.name || (cvToDelete && deletingCvs.has(cvToDelete.id!))}
              className="bg-red-600 hover:bg-red-700 w-full xs:w-auto text-sm"
            >
              {cvToDelete && deletingCvs.has(cvToDelete.id!) ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t.deleting}
                </>
              ) : (
                t.deleteCV
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {cvToPublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl animate-slide-in relative">
            <h2 className="text-2xl font-bold mb-3 text-center">
              {cvToPublish.isPublic ? t.makeCVPrivateTitle : t.makeCVPublicTitle}
            </h2>

            <p className="text-center text-slate-600 mb-6">
              {cvToPublish.isPublic
                ? t.cvIsPublicDescription
                : t.cvIsPrivateDescription}
            </p>

            {cvToPublish.isPublic && cvToPublish.url && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm break-words text-center">
                {t.publicLinkLabel}{" "}
                <a
                  href={`${window.location.origin}/cv/${cvToPublish.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline font-medium"
                >
                  {`${window.location.origin}/cv/${cvToPublish.url}`}
                </a>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCvToPublish(null)}
                className="px-5 py-2 rounded-full bg-gray-200 hover:bg-gray-300 transition font-medium"
              >
                {t.cancelPublishButton}
              </button>

              <button
                onClick={async () => {
                  const createdLink = await handleTogglePublic(
                    cvToPublish.id!,
                    cvToPublish.isPublic!
                  );

                  if (!cvToPublish.isPublic && createdLink) {
                    setPublicLink(createdLink);
                    sonnerToast.success(t.linkCreatedAndCopiedToast);
                    navigator.clipboard.writeText(`${window.location.origin}/cv/${createdLink}`);
                  }
                }}
                disabled={publishing}
                className={`px-5 py-2 rounded-full text-white font-medium transition ${cvToPublish.isPublic
                  ? "bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  : "bg-primary hover:bg-primary/90 disabled:opacity-50"
                  }`}
              >
                {publishing
                  ? cvToPublish.isPublic
                    ? t.makingPrivateButton
                    : t.publishingButton
                  : cvToPublish.isPublic
                    ? t.makePrivateButton
                    : t.publishButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success-popup Link */}
      {publicLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-slide-in text-center">
            <h2 className="text-xl font-semibold mb-4 text-primary">
              {t.cvPublishedTitle}
            </h2>

            <p className="text-slate-700 mb-4">
              {t.cvPublishedDescription}
            </p>

            <div className="mb-4 p-3 bg-gray-100 rounded text-sm break-all">
              <a
                href={`${window.location.origin}/cv/${publicLink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {`${window.location.origin}/cv/${publicLink}`}
              </a>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/cv/${publicLink}`);
                  sonnerToast.success(t.linkCopiedToast);
                  setTimeout(() => setPublicLink(null), 500);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                {t.copyLinkButton}
              </button>

              <button
                onClick={() => setPublicLink(null)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
              >
                {t.closeButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCvForLetters && (
        <SavedCoverLettersDialog
          open={showCoverLettersDialog}
          onOpenChange={(open) => {
            setShowCoverLettersDialog(open)
            if (!open) setSelectedCvForLetters(null)
          }}
          cvId={selectedCvForLetters.id}
          userId={session?.user?.id || ""}
          onGenerateNew={() => {
            setShowCoverLettersDialog(false)
            router.push(`/dashboard/cv/edit/${selectedCvForLetters.id}`)
          }}
        />
      )}
    </div>
  )
}
