"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Icon } from "@iconify/react"
import { toast } from "sonner"
import { useDashboardTranslation } from "@/hooks/useDashboardTranslation"
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

interface CoverLetter {
  id: string | number
  content: string
  jobTitle?: string
  companyName?: string
  jobDescription?: string
  tone?: string
  createdAt: string
}

interface SavedCoverLettersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cvId?: string
  userId: string
  onGenerateNew: () => void
}

export function SavedCoverLettersDialog({
  open,
  onOpenChange,
  cvId,
  userId,
  onGenerateNew,
}: SavedCoverLettersDialogProps) {
  const { t } = useDashboardTranslation()
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLetter, setSelectedLetter] = useState<CoverLetter | null>(null)
  const [deletingId, setDeletingId] = useState<string | number | null>(null)
  const [letterToDelete, setLetterToDelete] = useState<CoverLetter | null>(null)

  // Mobile: show 'list' or 'detail' panel
  const [mobileView, setMobileView] = useState<"list" | "detail">("list")

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editingContent, setEditingContent] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)

  const fetchCoverLetters = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const url = cvId
        ? `/api/cover-letters?userId=${userId}&cvId=${cvId}`
        : `/api/cover-letters?userId=${userId}`

      const response = await fetch(url)
      const result = await response.json()

      if (response.ok && result.success) {
        setCoverLetters(result.data || [])
        if (result.data && result.data.length > 0) {
          setSelectedLetter(result.data[0])
        }
      }
    } catch (error) {
      console.error("Error fetching cover letters:", error)
      toast.error(t.errorLoadingCoverLetters || "Failed to load cover letters")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchCoverLetters()
      setMobileView("list")
    }
  }, [open, cvId, userId])

  useEffect(() => {
    setIsEditing(false)
    setEditingContent(selectedLetter?.content || "")
  }, [selectedLetter?.id])

  const handleSelectLetter = (letter: CoverLetter) => {
    setSelectedLetter(letter)
    setIsEditing(false)
    setMobileView("detail")
  }

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success(t.copySuccess || "Copied to clipboard!")
    } catch {
      toast.error(t.copyError || "Failed to copy")
    }
  }

  const handleDownload = (letter: CoverLetter) => {
    try {
      const element = document.createElement("a")
      const file = new Blob([letter.content], { type: "text/plain" })
      element.href = URL.createObjectURL(file)
      element.download = `cover-letter-${letter.jobTitle || "untitled"}.txt`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      toast.success(t.downloadSuccess || "Downloaded successfully")
    } catch {
      toast.error(t.downloadError || "Failed to download")
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedLetter) return
    setSavingEdit(true)
    try {
      const response = await fetch(`/api/cover-letters/${selectedLetter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coverLetterId: selectedLetter.id,
          content: editingContent,
          userId,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const updated = { ...selectedLetter, content: editingContent }
        setSelectedLetter(updated)
        setCoverLetters(prev =>
          prev.map(letter => letter.id === selectedLetter.id ? updated : letter)
        )
        setIsEditing(false)
        toast.success(t.coverLetterSaved || "Cover letter updated successfully")
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Error saving cover letter:", error)
      toast.error(t.saveFailed || "Failed to save changes")
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteLetter = async (letterId: string | number) => {
    setDeletingId(letterId)
    try {
      const response = await fetch(`/api/cover-letters/${letterId}?userId=${userId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const updatedLetters = coverLetters.filter(letter => letter.id !== letterId)
        setCoverLetters(updatedLetters)

        if (selectedLetter?.id === letterId) {
          setSelectedLetter(updatedLetters[0] || null)
          setMobileView("list")
        }

        toast.success(t.coverLetterDeleted || "Cover letter deleted")
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Error deleting cover letter:", error)
      toast.error(t.deleteFailed || "Failed to delete cover letter")
    } finally {
      setDeletingId(null)
      setLetterToDelete(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const SidebarContent = () => (
    <div className="space-y-2">
      {loading ? (
        <div className="flex justify-center py-8">
          <Icon icon="tabler:loader" className="h-6 w-6 animate-spin" />
        </div>
      ) : coverLetters.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Icon icon="tabler:inbox" className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t.noCoverLettersYet || "No cover letters yet"}</p>
        </div>
      ) : (
        coverLetters.map((letter) => (
          <button
            key={letter.id}
            onClick={() => handleSelectLetter(letter)}
            className={`w-full text-left p-3 rounded-lg transition-all ${selectedLetter?.id === letter.id
              ? "bg-primary/10 border-2 border-primary"
              : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
              }`}
          >
            <h4 className="font-medium text-sm truncate">
              {letter.jobTitle || t.untitled || "Untitled"}
            </h4>
            {letter.companyName && (
              <p className="text-xs text-gray-600 truncate">{letter.companyName}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {letter.tone && (
                <Badge variant="outline" className="text-[10px]">
                  {letter.tone}
                </Badge>
              )}
              <span className="text-[10px] text-gray-500">
                {formatDate(letter.createdAt)}
              </span>
            </div>
          </button>
        ))
      )}

      <div className="pt-2 space-y-2">
        <Button
          variant="outline"
          className="w-full text-xs"
          onClick={() => {
            onOpenChange(false)
            onGenerateNew()
          }}
        >
          <Icon icon="tabler:plus" className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{t.regenerateNewCoverLetter || "Generate New"}</span>
        </Button>

        {selectedLetter && (
          <Button
            variant="outline"
            className="w-full text-xs sm:text-sm"
            onClick={() => {
              setEditingContent(selectedLetter.content)
              setIsEditing(true)
              setMobileView("detail")
            }}
          >
            <Icon icon="tabler:pencil" className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {t.editCoverLetter || "Edit Cover Letter"}
          </Button>
        )}
      </div>
    </div>
  )

  const DetailContent = () => (
    <>
      {selectedLetter ? (
        <div className="space-y-3 sm:space-y-4">
          {/* Mobile back button */}
          <div className="sm:hidden">
            <button
              onClick={() => {
                setMobileView("list")
                setIsEditing(false)
              }}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-1"
            >
              <Icon icon="tabler:arrow-left" className="h-4 w-4" />
              <span>{t.cancel || "Back"}</span>
            </button>
          </div>

          {/* Header row */}
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-lg font-semibold truncate">
                {selectedLetter.jobTitle || t.untitled || "Untitled"}
              </h3>
              {selectedLetter.companyName && (
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {selectedLetter.companyName}
                </p>
              )}
            </div>
            <div className="flex gap-1 sm:gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 sm:h-9 sm:w-9"
                title={t.copy || "Copy"}
                onClick={() => handleCopy(isEditing ? editingContent : selectedLetter.content)}
              >
                <Icon icon="tabler:copy" className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 sm:h-9 sm:w-9"
                title={t.download || "Download"}
                onClick={() => handleDownload(selectedLetter)}
              >
                <Icon icon="tabler:download" className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 sm:h-9 sm:w-9"
                title={t.deleteCoverLetter || "Delete"}
                onClick={() => setLetterToDelete(selectedLetter)}
                disabled={deletingId === selectedLetter.id}
              >
                {deletingId === selectedLetter.id ? (
                  <Icon icon="tabler:loader" className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <Icon icon="tabler:trash" className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile-only edit button (desktop uses sidebar button) */}
          {!isEditing && (
            <div className="sm:hidden">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setEditingContent(selectedLetter.content)
                  setIsEditing(true)
                }}
              >
                <Icon icon="tabler:pencil" className="mr-1.5 h-3.5 w-3.5" />
                {t.editCoverLetter || "Edit Cover Letter"}
              </Button>
            </div>
          )}

          {/* Content */}
          {isEditing ? (
            <div className="space-y-2 sm:space-y-3">
              <Textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="min-h-[220px] sm:min-h-[350px] max-h-[45vh] sm:max-h-[55vh] overflow-y-auto font-sans text-xs sm:text-sm text-gray-700 leading-relaxed resize-y"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveEdit}
                  disabled={savingEdit || editingContent === selectedLetter.content}
                  size="sm"
                  style={{ backgroundColor: "rgb(5, 22, 80)" }}
                  className="text-white text-xs sm:text-sm"
                >
                  {savingEdit ? (
                    <>
                      <Icon icon="tabler:loader" className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      {t.saving || "Saving..."}
                    </>
                  ) : (
                    <>
                      <Icon icon="tabler:device-floppy" className="mr-1.5 h-3.5 w-3.5" />
                      {t.saveChanges || "Save Changes"}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm"
                  onClick={() => {
                    setIsEditing(false)
                    setEditingContent(selectedLetter.content)
                  }}
                >
                  {t.cancel || "Cancel"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border overflow-y-auto max-h-[45vh] sm:max-h-[55vh]">
              <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-gray-700 leading-relaxed">
                {selectedLetter.content}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500 py-16">
          <div className="text-center">
            <Icon icon="tabler:file-text" className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 opacity-50" />
            <p className="text-sm sm:text-base">
              {t.selectCoverLetter || "Select a cover letter to view"}
            </p>
          </div>
        </div>
      )}
    </>
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[92vh] sm:max-h-[90vh] p-0 flex flex-col gap-0">
          {/* Header */}
          <div className="p-3 sm:p-5 border-b flex-shrink-0">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-xl md:text-2xl flex items-center gap-2">
                <Icon icon="tabler:file-text" className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 flex-shrink-0" />
                <span className="truncate">
                  {t.savedCoverLetters || "Your Cover Letters"}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {cvId
                  ? (t.manageCoverLetters || "View and manage your saved cover letters")
                  : "View and manage all your cover letters"}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden min-h-0">
            {/* MOBILE (<sm): single panel toggling list/detail */}
            <div className="sm:hidden h-full overflow-y-auto p-3">
              {mobileView === "list" ? <SidebarContent /> : <DetailContent />}
            </div>

            {/* TABLET+ (≥sm): two-panel layout */}
            <div className="hidden sm:flex h-full min-h-0">
              <div className="w-52 md:w-64 border-r overflow-y-auto p-3 md:p-4 flex-shrink-0">
                <SidebarContent />
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <DetailContent />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!letterToDelete} onOpenChange={() => setLetterToDelete(null)}>
        <AlertDialogContent className="w-[90vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm sm:text-lg">
              {t.deleteCoverLetter || "Delete Cover Letter?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              {t.confirmDeleteCoverLetter ||
                "Are you sure you want to delete this cover letter? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="text-xs sm:text-sm mt-0">
              {t.cancel || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => letterToDelete && handleDeleteLetter(letterToDelete.id)}
              className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm"
            >
              {t.deleteCoverLetter || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
