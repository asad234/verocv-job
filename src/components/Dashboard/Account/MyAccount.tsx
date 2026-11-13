"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Icon } from "@iconify/react"
import Card from "@/components/Dashboard/ReUsable/Card"
import Button from "@/components/Dashboard/ReUsable/Button"
import Image from "next/image"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { usePersonalInformationMutations } from "@/hooks/personal-information/personalInformationMutations"
import { usePersonalInfoStore } from "@/hooks/personal-information/personalInformationStore"
import type { PersonalInformation, SocialLinks, NotificationPreferences } from "@/types/payloadTypes"
import { uploadFile } from "@/utils/fileUpload"
import { formatDate } from "@/utils/formatDate"
import UnderDevelopmentBanner from "@/components/Common/underDevelopment"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut, Move } from "lucide-react"
import ProfileImageSelector from "@/components/onboarding/ProfileImagePickerModal"
import RevokeAccessDialog from "@/components/shared/Revokeaccessdialog"
import { notifyManagerAccessChanged, useManagerAccess } from "@/hooks/useManagerAccess"
import ChangePasswordForm from "@/components/shared/ChangePasswordForm"


// Shape of the new emergency-contact group on personal-information.
// Add this to your PersonalInformation type in @/types/payloadTypes as:
//   emergencyContact?: EmergencyContact
type EmergencyContact = {
  firstName?: string
  lastName?: string
  relationship?: string
  email?: string
  phoneNumber?: string
}

// An invitation the current user (employee) has accepted from a manager —
// matches what GET /api/user/invitations returns, filtered to status "accepted".
type AccessLevel = "full" | "cv_only" | "portfolio_only"
type AcceptedInvitation = {
  id: string
  bossName: string
  companyName?: string
  status: "pending" | "accepted" | "declined"
  createdAt: string
  respondedAt?: string | null
  accessLevel?: AccessLevel

  // Optional manager contact details — only render if the backend actually
  // includes them on the invitation record (it currently doesn't).
  bossEmail?: string
  bossPhone?: string
  bossJobTitle?: string
  bossDepartment?: string
}

// Image Position Editor Component
function ImagePositionEditor({
  imageSrc,
  onSave,
  onCancel,
  isCircular = true,
}: {
  imageSrc: string
  onSave: (croppedImage: string) => void
  onCancel: () => void
  isCircular?: boolean
}) {
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const img = new window.Image()
    img.src = imageSrc
    img.onload = () => {
      imageRef.current = img
      // Center and fit the image initially
      const canvas = canvasRef.current
      if (canvas) {
        const size = 300
        const scale = Math.max(size / img.width, size / img.height)
        setZoom(scale)
      }
      drawImage()
    }
  }, [imageSrc])

  useEffect(() => {
    drawImage()
  }, [zoom, position])

  const drawImage = () => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate dimensions
    const size = 300
    const imgWidth = img.width * zoom
    const imgHeight = img.height * zoom

    // Draw image centered with offset
    const x = (size - imgWidth) / 2 + position.x
    const y = (size - imgHeight) / 2 + position.y

    ctx.drawImage(img, x, y, imgWidth, imgHeight)

    // Draw circular or rectangular mask overlay
    if (isCircular) {
      ctx.globalCompositeOperation = "destination-in"
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = "source-over"
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)))
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const croppedImage = canvas.toDataURL("image/jpeg", 0.9)
    onSave(croppedImage)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center space-y-4">
        <div
          className={`relative border-2 border-dashed border-gray-300 overflow-hidden cursor-move ${isCircular ? "rounded-full" : "rounded-md"
            }`}
          style={{ width: 300, height: 300 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <canvas ref={canvasRef} width={300} height={300} className="absolute inset-0" />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <Move className="h-8 w-8 text-gray-400 opacity-50" />
          </div>
        </div>

        <div className="w-full max-w-xs space-y-2">
          <div className="flex items-center gap-2">
            <ZoomOut className="h-4 w-4" />
            <Slider
              value={[zoom]}
              onValueChange={(values) => {
                const newZoom = values[0]
                if (newZoom !== undefined) {
                  setZoom(newZoom)
                }
              }}
              min={0.5}
              max={3}
              step={0.1}
            />
            <ZoomIn className="h-4 w-4" />
          </div>
          <p className="text-xs text-center text-gray-500">Drag to reposition • Scroll to zoom</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <button
          className="px-4 py-2 text-sm text-white transition-colors rounded-md"
          style={{ backgroundColor: 'rgb(5, 22, 80)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
          onClick={handleSave}
        >
          Save Image
        </button>
      </div>
    </div>
  )
}

// Right-side drawer showing full details of a manager who has accepted access —
// opened by clicking their name/avatar in the "Manager Access" section below.
function ManagerInfoDrawer({
  invitation,
  onClose,
  accessLevelLabel,
}: {
  invitation: AcceptedInvitation | null
  onClose: () => void
  accessLevelLabel: (level?: AccessLevel) => string
}) {
  const { t } = useDashboardTranslations() as { t: any }

  if (!invitation) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto">

        {/* Header banner */}
        <div className="px-6 pt-8 pb-6 sticky top-0 z-10" style={{ background: 'linear-gradient(135deg, rgb(5, 22, 80) 0%, rgb(15, 32, 90) 100%)' }}>
          <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-all">
            <Icon icon="tabler:x" className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 bg-white/10 border-2 border-white/20">
              {(invitation.bossName || "?")[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xl font-bold text-white truncate">{invitation.bossName || (t.unknownManagerLabel ?? "Unknown manager")}</div>
              {invitation.bossJobTitle && <div className="text-sm text-white/70 mt-0.5 truncate">{invitation.bossJobTitle}</div>}
              <span className="inline-block mt-2 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/20">
                {accessLevelLabel(invitation.accessLevel)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{t.contactLabel ?? "Contact"}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Icon icon="tabler:mail" className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{invitation.bossEmail || (t.notSharedLabel ?? "Not shared")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Icon icon="tabler:phone" className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{invitation.bossPhone || (t.notSharedLabel ?? "Not shared")}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{t.companyLabel ?? "Company"}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Icon icon="tabler:building" className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{invitation.companyName || "—"}</span>
              </div>
              {invitation.bossDepartment && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Icon icon="tabler:building-community" className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{invitation.bossDepartment}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{t.accessSectionLabel ?? "Access"}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Icon icon="tabler:shield" className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{accessLevelLabel(invitation.accessLevel)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Icon icon="tabler:calendar" className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>
                  {t.invitedOnLabel ?? "Invited"} {new Date(invitation.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              {invitation.respondedAt && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Icon icon="tabler:circle-check" className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>
                    {t.acceptedOnLabel ?? "Accepted"} {new Date(invitation.respondedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {(!invitation.bossEmail && !invitation.bossPhone) && (
            <p className="text-xs text-gray-400 leading-relaxed border-t border-gray-100 pt-4">
              {t.noContactDetailsNote ?? "This manager's direct contact details aren't shared through your invitation record yet."}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

const MyAccount = () => {
  const { t, language } = useDashboardTranslations()
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<string>("general")
  // Emergency contact is only for employees connected to a manager.
  const { hasAccess: hasManagerAccess } = useManagerAccess()
  const [showCalendar, setShowCalendar] = useState<boolean>(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [employmentType, setEmploymentType] = useState<string>("")
  const [showEmploymentDropdown, setShowEmploymentDropdown] = useState<boolean>(false)

  // Add image editor states
  const [showImageEditor, setShowImageEditor] = useState<boolean>(false)
  const [rawImage, setRawImage] = useState<string | null>(null) // base64 for editor
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null) // final preview
  const [uploadedImage, setUploadedImage] = useState<File | null>(null) // ONLY for backend
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null)

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)

  // Add validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({})
  const [showValidation, setShowValidation] = useState<boolean>(false)

  // Define mandatory fields
  const mandatoryFields = {
    general: ["firstName", "lastName", "phoneNumber", "recoveryEmail"],
    social: [], // No mandatory fields for social links
    notifications: [], // No mandatory fields for notifications
  }

  // Get personal information from your Zustand store
  const { personalInfo, setPersonalInfo } = usePersonalInfoStore()
  const { updatePersonalInformation } = usePersonalInformationMutations()
  console.log(personalInfo)

  // Initialize form states
  const [formData, setFormData] = useState<PersonalInformation>({
    id: "",
    user: 0,
    firstName: "",
    lastName: "",
    phoneNumber: "",
    workPhoneNumber: "",
    homeAddress: "",
    dateOfBirth: "",
    gender: "other",
    title: "",
    professionalPresentation: "",
    personalPresentation: "",
    privateEmail: "",
    workEmail: "",
    recoveryEmail: "",
    createdAt: "",
    updatedAt: "",
    socialLinks: {
      linkedIn: "",
      x: "",
      gitHub: "",
      website: "",
    },
    notificationPreferences: {
      emailNotifications: false,
      pushNotifications: false,
      smsNotifications: false,
    },
  })

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    linkedIn: "",
    x: "",
    gitHub: "",
    website: "",
  })

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    emailNotifications: false,
    pushNotifications: false,
    smsNotifications: false,
  })

  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>({
    firstName: "",
    lastName: "",
    relationship: "",
    email: "",
    phoneNumber: "",
  })

  // Managers who currently have accepted access to this user's data —
  // shown in the Notifications tab so the person can revoke access later.
  const [acceptedInvitations, setAcceptedInvitations] = useState<AcceptedInvitation[]>([])
  const [loadingInvitations, setLoadingInvitations] = useState<boolean>(false)
  const [invitationsError, setInvitationsError] = useState<string>("")
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [viewingManager, setViewingManager] = useState<AcceptedInvitation | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<AcceptedInvitation | null>(null)

  // Initialize form data when personalInfo is available.
  // recoveryEmail falls back to the login email (from the session) whenever
  // the saved record doesn't have one yet, instead of leaving the field blank.
  useEffect(() => {
    if (personalInfo) {
      setFormData({
        id: personalInfo.id || "",
        user: personalInfo.user || 0,
        firstName: personalInfo.firstName || "",
        lastName: personalInfo.lastName || "",
        phoneNumber: personalInfo.phoneNumber || "",
        workPhoneNumber: personalInfo.workPhoneNumber || "",
        homeAddress: personalInfo.homeAddress || "",
        dateOfBirth: personalInfo.dateOfBirth || "",
        gender: personalInfo.gender || "other",
        title: personalInfo.title || "",
        professionalPresentation: personalInfo.professionalPresentation || "",
        personalPresentation: personalInfo.personalPresentation || "",
        privateEmail: personalInfo.privateEmail || "",
        workEmail: personalInfo.workEmail || "",
        recoveryEmail: personalInfo.recoveryEmail || session?.user?.email || "",
        createdAt: personalInfo.createdAt || "",
        updatedAt: personalInfo.updatedAt || "",
        socialLinks: personalInfo.socialLinks || {
          linkedIn: "",
          x: "",
          gitHub: "",
          website: "",
        },
        notificationPreferences: personalInfo.notificationPreferences || {
          emailNotifications: false,
          pushNotifications: false,
          smsNotifications: false,
        },
      })
      setSocialLinks(
        personalInfo.socialLinks || {
          linkedIn: "",
          x: "",
          gitHub: "",
          website: "",
        },
      )
      setNotificationPrefs(
        personalInfo.notificationPreferences || {
          emailNotifications: false,
          pushNotifications: false,
          smsNotifications: false,
        },
      )
      setEmergencyContact(
        (personalInfo as any).emergencyContact || {
          firstName: "",
          lastName: "",
          relationship: "",
          email: "",
          phoneNumber: "",
        },
      )
    }
     
  }, [personalInfo, session?.user?.email])

  // Covers the case where there's no personal-information record yet at all
  // (brand-new user, GET returns 404) — the effect above never runs then,
  // so this seeds recoveryEmail from the session as soon as it's available,
  // without ever overwriting something the person has already typed.
  useEffect(() => {
    if (!personalInfo && session?.user?.email) {
      setFormData((prev) => (prev.recoveryEmail ? prev : { ...prev, recoveryEmail: session.user!.email! }))
    }
  }, [personalInfo, session?.user?.email])

  // Load accepted manager invitations once on mount, for the "Manager Access" section
  useEffect(() => {
    let cancelled = false
    setLoadingInvitations(true)
    setInvitationsError("")
    fetch("/api/user/invitations")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load invitations")
        const body = await res.json()
        if (!cancelled) {
          const accepted: AcceptedInvitation[] = (body.data ?? []).filter(
            (inv: AcceptedInvitation) => inv.status === "accepted",
          )
          setAcceptedInvitations(accepted)
        }
      })
      .catch(() => {
        if (!cancelled) setInvitationsError(t.failedToLoadManagerAccess ?? "Failed to load manager access list.")
      })
      .finally(() => {
        if (!cancelled) setLoadingInvitations(false)
      })
    return () => { cancelled = true }
  }, [])

  const accessLevelLabel = (level?: AccessLevel) => {
    if (level === "cv_only") return t.cvOnlyAccessLabel ?? "CVs only"
    if (level === "portfolio_only") return t.portfolioOnlyAccessLabel ?? "Portfolio only"
    return t.fullAccessLabel ?? "Full access"
  }

  // Opens the confirmation dialog; the actual API call happens in
  // confirmRevoke() once the person clicks "Yes, revoke" inside it.
  const requestRevoke = (invitation: AcceptedInvitation) => {
    setRevokeTarget(invitation)
  }

  const confirmRevoke = async () => {
    if (!revokeTarget) return
    const invitation = revokeTarget

    setRevokingId(invitation.id)
    try {
      const res = await fetch(`/api/user/invitations/${invitation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      })
      if (!res.ok) throw new Error("Failed to revoke")
      const remaining = acceptedInvitations.filter((inv) => inv.id !== invitation.id)
      setAcceptedInvitations(remaining)
      // Last manager gone → Contracts, Interviews, Emergency contact and the
      // Hide-from-manager buttons disappear right away.
      notifyManagerAccessChanged(remaining.length > 0)
      toast.success(t.accessRevokedToast ?? "Access revoked. The manager has been notified.")
      setRevokeTarget(null)
    } catch (error) {
      console.error("Error revoking invitation:", error)
      toast.error(t.failedToRevokeAccess ?? "Failed to revoke access. Please try again.")
    } finally {
      setRevokingId(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onloadend = () => {
      const base64 = reader.result as string
      setImagePreviewUrl(base64)
    }

    reader.readAsDataURL(file)

    setUploadedFile(file)
    setSelectedAvatar(null)
  }

  const handleImageSave = (croppedImage: string) => {
    setImagePreviewUrl(croppedImage)

    fetch(croppedImage)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], "profile.jpg", {
          type: "image/jpeg",
        })

        setUploadedFile(file)
      })

    setShowImageEditor(false)
  }

  const handleImageCancel = () => {
    setShowImageEditor(false)
    setRawImage(null)
    // Reset file input
    const fileInput = document.getElementById("image-upload") as HTMLInputElement | null
    if (fileInput) fileInput.value = ""
  }

  const handleAvatarSelect = (avatarNumber: number) => {
    setSelectedAvatar(avatarNumber)
    setUploadedImage(null)
    setImagePreviewUrl(null)
    const fileInput = document.getElementById("image-upload") as HTMLInputElement | null
    if (fileInput) fileInput.value = ""
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setFormData({ ...formData, dateOfBirth: date.toISOString() })
    setShowCalendar(false)
  }

  const handleEmploymentSelect = (option: string) => {
    setEmploymentType(option)
    setShowEmploymentDropdown(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleGenderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, gender: e.target.value as "male" | "female" | "other" })
  }

  const handleSocialLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSocialLinks({ ...socialLinks, [name]: value })
  }

  const handleNotificationPrefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setNotificationPrefs({ ...notificationPrefs, [name]: checked })
  }

  const handleEmergencyContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEmergencyContact({ ...emergencyContact, [name]: value })
  }

  const handleSaveProfileImage = async () => {
    if (!personalInfo?.id) {
      toast.error("No user profile found")
      return
    }

    const toastId = toast.loading("Saving profile image...")

    try {
      let imageUrl: string | null = null

      // 1. Upload new file if exists
      if (uploadedFile) {
        const formData = new FormData()
        formData.append("file", uploadedFile)

        const uploadRes = await fetch("/api/profilephoto", {
          method: "POST",
          body: formData,
        })

        if (!uploadRes.ok) {
          toast.error("Upload failed", { id: toastId })
          return
        }

        const data = await uploadRes.json()
        imageUrl = data.url // <-- from your API
      }

      // 2. fallback avatar
      else if (selectedAvatar) {
        imageUrl = `/profile/img${selectedAvatar}.jpg`
      }

      else {
        toast.info("No image selected", { id: toastId })
        return
      }

      // 3. Save to PayloadCMS (IMPORTANT PART)
      const updated = {
        ...personalInfo,
      }

      const response = await updatePersonalInformation(updated)

      if (response) {
        setProfileImage(response.updated.profileImage)
        setUploadedFile(null)
        toast.success("Profile image updated", { id: toastId })
      } else {
        toast.error("Failed to update profile", { id: toastId })
      }
    } catch (err) {
      console.error(err)
      toast.error("Something went wrong", { id: toastId })
    }
  }

  const validateMandatoryFields = (tabType: "general" | "social" | "notifications") => {
    const errors: Record<string, boolean> = {}
    if (tabType === "general") {
      mandatoryFields.general.forEach((field) => {
        const value = formData[field as keyof PersonalInformation]
        errors[field] = !value || (typeof value === "string" && value.trim() === "")
      })
    }
    setValidationErrors(errors)
    return Object.values(errors).some((hasError) => hasError)
  }

  const getFieldClassName = (fieldName: string, baseClassName: string) => {
    const hasError = showValidation && validationErrors[fieldName]
    return hasError
      ? `${baseClassName} border-red-500 bg-pink-50`
      : baseClassName
  }

  const saveGeneral = async () => {
    if (!personalInfo?.id) {
      toast.error(t.noUserProfileFound)
      return
    }

    // Validate mandatory fields
    setShowValidation(true)
    const hasErrors = validateMandatoryFields("general")
    if (hasErrors) {
      toast.error(t.fillRequiredFields)
      return
    }

    const toastId = toast.loading(t.savingGeneralSettings)
    try {
      const updatedInfo = { ...formData }
      await updatePersonalInformation(updatedInfo)
      setPersonalInfo(updatedInfo)
      setShowValidation(false) // Reset validation on successful save
      toast.success(t.generalSettingsSaved, { id: toastId })
    } catch (error) {
      console.error("Error saving general settings:", error)
      toast.error(t.failedToSaveSettings, { id: toastId })
    }
  }

  const saveSocialLinks = async () => {
    if (!personalInfo?.id) {
      toast.error(t.noUserProfileFound)
      return
    }

    const toastId = toast.loading(t.savingSocialLinks)
    try {
      const updatedInfo = {
        ...personalInfo,
        socialLinks: socialLinks,
      }
      const response = await updatePersonalInformation(updatedInfo)
      if (response) {
        setPersonalInfo(response.updated)
        toast.success(t.socialLinksSaved, { id: toastId })
      } else {
        toast.error(t.failedToSaveSocialLinks, { id: toastId })
      }
    } catch (error) {
      console.error("Error saving social links:", error)
      toast.error(t.failedToSaveSocialLinks, { id: toastId })
    }
  }

  const saveEmergencyContact = async () => {
    if (!personalInfo?.id) {
      toast.error(t.noUserProfileFound)
      return
    }

    const toastId = toast.loading(t.savingEmergencyContact ?? "Saving emergency contact...")
    try {
      const updatedInfo = {
        ...personalInfo,
        emergencyContact: emergencyContact,
      }
      const response = await updatePersonalInformation(updatedInfo)
      if (response) {
        setPersonalInfo(response.updated)
        toast.success(t.emergencyContactSaved ?? "Emergency contact saved successfully!", { id: toastId })
      } else {
        toast.error(t.failedToSaveEmergencyContact ?? "Failed to save emergency contact.", { id: toastId })
      }
    } catch (error) {
      console.error("Error saving emergency contact:", error)
      toast.error(t.failedToSaveEmergencyContact ?? "Failed to save emergency contact.", { id: toastId })
    }
  }

  const saveNotificationPrefs = async () => {
    if (!personalInfo?.id) {
      toast.error(t.noUserProfileFound)
      return
    }

    const toastId = toast.loading(t.savingNotificationPrefs)
    try {
      const updatedInfo = {
        ...personalInfo,
        notificationPreferences: notificationPrefs,
      }
      const response = await updatePersonalInformation(updatedInfo)
      if (response) {
        setPersonalInfo(response.updated)
        toast.success(t.notificationPrefsSaved, { id: toastId })
      } else {
        toast.error(t.failedToSaveNotificationPrefs, { id: toastId })
      }
    } catch (error) {
      console.error("Error saving notification preferences:", error)
      toast.error(t.failedToSaveNotificationPrefs, { id: toastId })
    }
  }

  const tabs = [
    { id: "general", label: t.generalTab, icon: "tabler:user" },
    { id: "images", label: t.profileImageTab, icon: "tabler:photo" },
    // Only shown while the user has an accepted manager connection.
    ...(hasManagerAccess
      ? [{ id: "emergency", label: t.emergencyContactTab ?? "Emergency Contact", icon: "tabler:phone-call" }]
      : []),
    { id: "notifications", label: t.notificationsTab, icon: "tabler:bell" },
    { id: "social", label: t.socialLinksTab, icon: "tabler:brand-twitter" },
    { id: "security", label: t.securityTab ?? (language === "sv" ? "Säkerhet" : "Security"), icon: "tabler:shield-lock" },
  ]

  useEffect(() => {
    if (!hasManagerAccess && activeTab === "emergency") setActiveTab("general")
  }, [hasManagerAccess, activeTab])

  const employmentOptions: string[] = ["Employed", "Self-employed", "Unemployed", "Student", "Retired"]

  return (
    <div className="w-full min-h-screen bg-gray-50 px-3 sm:px-4 md:px-6 py-4 sm:py-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header - Responsive */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">{t.accountSettingsTitle}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t.accountSettingsSubtitle}</p>
        </div>

        {/* Tabs - Mobile Responsive */}
        <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-medium transition-colors duration-200 whitespace-nowrap text-xs sm:text-sm lg:text-base ${activeTab === tab.id
                  ? "border-b-2"
                  : "text-gray-600 hover:opacity-80 hover:bg-gray-50"
                  }`}
                style={
                  activeTab === tab.id
                    ? {
                      color: 'rgb(5, 22, 80)',
                      borderColor: 'rgb(5, 22, 80)',
                      backgroundColor: 'rgba(176, 196, 222, 0.1)',
                    }
                    : {}
                }
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon icon={tab.icon} className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Card>
          {/* Tab Content */}
          <div className="p-3 sm:p-4 lg:p-6">
            {activeTab === "general" && (
              <div className="space-y-6 sm:space-y-8">
                {/* Personal Information */}
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
                    {t.personalInformation}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.firstNameLabel} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={getFieldClassName(
                          "firstName",
                          "w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none transition-colors",
                        )}
                        onFocus={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                          e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = ''
                          e.currentTarget.style.borderColor = ''
                        }}
                        placeholder={t.firstNamePlaceholder}
                      />
                      {showValidation && validationErrors.firstName && (
                        <p className="text-red-500 text-xs mt-1">{t.firstNameRequired}</p>
                      )}
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.lastNameLabel} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={getFieldClassName(
                          "lastName",
                          "w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none transition-colors",
                        )}
                        onFocus={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                          e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = ''
                          e.currentTarget.style.borderColor = ''
                        }}
                        placeholder={t.lastNamePlaceholder}
                      />
                      {showValidation && validationErrors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{t.lastNameRequired}</p>
                      )}
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.homeAddressLabel}</label>
                      <input
                        type="text"
                        name="homeAddress"
                        value={formData.homeAddress}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none transition-colors"
                        onFocus={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                          e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = ''
                          e.currentTarget.style.borderColor = ''
                        }}
                        placeholder={t.homeAddressPlaceholder}
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.phoneNumberLabel} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className={getFieldClassName(
                          "phoneNumber",
                          "w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none transition-colors",
                        )}
                        onFocus={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                          e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = ''
                          e.currentTarget.style.borderColor = ''
                        }}
                        placeholder={t.phoneNumberPlaceholder}
                      />
                      {showValidation && validationErrors.phoneNumber && (
                        <p className="text-red-500 text-xs mt-1">{t.phoneNumberRequired}</p>
                      )}
                    </div>
                    {/* Work Phone Field */}
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.workPhoneLabel}</label>
                      <input
                        type="tel"
                        name="workPhoneNumber"
                        value={formData.workPhoneNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none transition-colors"
                        onFocus={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                          e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = ''
                          e.currentTarget.style.borderColor = ''
                        }}
                        placeholder={t.workPhonePlaceholder}
                      />
                    </div>
                    {/* Private Email Field */}
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.privateEmailLabel}</label>
                      <input
                        type="email"
                        name="privateEmail"
                        value={formData.privateEmail}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none transition-colors"
                        onFocus={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                          e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = ''
                          e.currentTarget.style.borderColor = ''
                        }}
                        placeholder={t.privateEmailPlaceholder}
                      />
                    </div>
                    {/* Work Email Field */}
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.workEmailLabel}</label>
                      <input
                        type="email"
                        name="workEmail"
                        value={formData.workEmail}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none transition-colors"
                        onFocus={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                          e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = ''
                          e.currentTarget.style.borderColor = ''
                        }}
                        placeholder={t.workEmailPlaceholder}
                      />
                    </div>
                    {/* Recovery Email Field */}
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.recoveryEmailLabel} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="recoveryEmail"
                        value={formData.recoveryEmail}
                        onChange={handleInputChange}
                        disabled={!!formData.recoveryEmail}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border rounded-md transition-colors ${formData.recoveryEmail
                          ? "bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed"
                          : getFieldClassName(
                            "recoveryEmail",
                            "border-gray-300 focus:outline-none",
                          )
                          }`}
                        onFocus={(e) => {
                          if (!formData.recoveryEmail) {
                            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                            e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                          }
                        }}
                        onBlur={(e) => {
                          if (!formData.recoveryEmail) {
                            e.currentTarget.style.boxShadow = ''
                            e.currentTarget.style.borderColor = ''
                          }
                        }}
                        placeholder={formData.recoveryEmail ? formData.recoveryEmail : t.recoveryEmailPlaceholder}
                      />
                      {formData.recoveryEmail && <p className="text-xs text-gray-500 mt-1">{t.recoveryEmailNote}</p>}
                      {showValidation && validationErrors.recoveryEmail && !formData.recoveryEmail && (
                        <p className="text-red-500 text-xs mt-1">{t.recoveryEmailRequired}</p>
                      )}
                    </div>
                    {/* Date of Birth Field */}
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.dateOfBirthLabel}</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formatDate(formData.dateOfBirth)}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none transition-colors"
                        onFocus={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                          e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = ''
                          e.currentTarget.style.borderColor = ''
                        }}
                        placeholder="Select date of birth"
                      />
                    </div>
                    {/* Gender Field */}
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.genderLabel}</label>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value="male"
                            checked={formData.gender === "male"}
                            onChange={handleGenderChange}
                            className="h-4 w-4 border-gray-300"
                            style={{ accentColor: 'rgb(5, 22, 80)' }}
                          />
                          <span className="text-sm sm:text-base text-gray-700">{t.maleOption}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value="female"
                            checked={formData.gender === "female"}
                            onChange={handleGenderChange}
                            className="h-4 w-4 border-gray-300"
                            style={{ accentColor: 'rgb(5, 22, 80)' }}
                          />
                          <span className="text-sm sm:text-base text-gray-700">{t.femaleOption}</span>
                        </label>
                      </div>
                    </div>
                    {/* Title Field */}
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.titleLabel}</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none transition-colors"
                        onFocus={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                          e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = ''
                          e.currentTarget.style.borderColor = ''
                        }}
                        placeholder={t.titlePlaceholder}
                      />
                    </div>
                    {/* Professional Presentation */}
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.professionalPresentationLabel}
                      </label>
                      <textarea
                        name="professionalPresentation"
                        value={formData.professionalPresentation}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none transition-colors resize-none"
                        onFocus={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                          e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = ''
                          e.currentTarget.style.borderColor = ''
                        }}
                        placeholder={t.professionalPresentationPlaceholder}
                        rows={3}
                      />
                    </div>
                    {/* Personal Presentation */}
                    <div className="col-span-1 sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.personalPresentationLabel}
                      </label>
                      <textarea
                        name="personalPresentation"
                        value={formData.personalPresentation}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none transition-colors resize-none"
                        onFocus={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                          e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = ''
                          e.currentTarget.style.borderColor = ''
                        }}
                        placeholder={t.personalPresentationPlaceholder}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons - Mobile Responsive */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-200">
                  <button
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base text-white transition-colors rounded-xl"
                    style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
                    onClick={saveGeneral}
                  >
                    {t.saveChangesButton}
                  </button>
                </div>
              </div>
            )}

            {/* Profile Images Tab */}
            {activeTab === "images" && (
              <ProfileImageSelector
                mode="inline"
                personalInformation={personalInfo}
                value={
                  // Convert string to object
                  typeof profileImage === 'string'
                    ? {
                      uploadImage: profileImage?.includes('/media/') ? profileImage.split('/').pop() : null,
                      staticImage: !profileImage?.includes('/media/') ? profileImage : null
                    }
                    : profileImage || { uploadImage: null, staticImage: null }
                }
                onChange={(newValue) => {
                  // Convert object back to string if needed
                  if (newValue?.uploadImage) {
                    setProfileImage(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/media/file/${newValue.uploadImage}`)
                  } else if (newValue?.staticImage) {
                    setProfileImage(newValue.staticImage)
                  } else {
                    setProfileImage(null)
                  }
                }}
              />
            )}

            {/* Emergency Contact Tab */}
            {activeTab === "emergency" && hasManagerAccess && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1">{t.emergencyContactTitle ?? "Emergency Contact"}</h2>
                  <p className="text-sm text-gray-500 mb-3 sm:mb-4">{t.emergencyContactSubtitle ?? "Emergency contact information for when you need assistance"}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.emergencyFirstNameLabel ?? "First Name"}</label>
                    <input
                      type="text"
                      name="firstName"
                      value={emergencyContact.firstName || ""}
                      onChange={handleEmergencyContactChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none transition-colors"
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                        e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = ''
                        e.currentTarget.style.borderColor = ''
                      }}
                      placeholder={t.emergencyFirstNamePlaceholder ?? "First Name"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.emergencyLastNameLabel ?? "Last Name"}</label>
                    <input
                      type="text"
                      name="lastName"
                      value={emergencyContact.lastName || ""}
                      onChange={handleEmergencyContactChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none transition-colors"
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                        e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = ''
                        e.currentTarget.style.borderColor = ''
                      }}
                      placeholder={t.emergencyLastNamePlaceholder ?? "Last Name"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.emergencyRelationshipLabel ?? "Relationship"}</label>
                    <input
                      type="text"
                      name="relationship"
                      value={emergencyContact.relationship || ""}
                      onChange={handleEmergencyContactChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none transition-colors"
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                        e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = ''
                        e.currentTarget.style.borderColor = ''
                      }}
                      placeholder={t.emergencyRelationshipPlaceholder ?? "e.g. Spouse, Parent, Sibling"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.emergencyPhoneLabel ?? "Phone Number"}</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={emergencyContact.phoneNumber || ""}
                      onChange={handleEmergencyContactChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none transition-colors"
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                        e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = ''
                        e.currentTarget.style.borderColor = ''
                      }}
                      placeholder={t.emergencyPhonePlaceholder ?? "Phone Number"}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.emergencyEmailLabel ?? "Email"}</label>
                    <input
                      type="email"
                      name="email"
                      value={emergencyContact.email || ""}
                      onChange={handleEmergencyContactChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none transition-colors"
                      onFocus={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                        e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.boxShadow = ''
                        e.currentTarget.style.borderColor = ''
                      }}
                      placeholder={t.emergencyEmailPlaceholder ?? "Email Address"}
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base text-white transition-colors rounded-xl"
                    style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
                    onClick={saveEmergencyContact}
                  >
                    {t.saveEmergencyContactButton ?? "Save Emergency Contact"}
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <UnderDevelopmentBanner />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
                  {t.notificationPreferencesTitle}
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 text-sm sm:text-base">{t.emailNotificationsTitle}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">{t.emailNotificationsDesc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-3">
                      <input
                        type="checkbox"
                        name="emailNotifications"
                        checked={notificationPrefs.emailNotifications}
                        onChange={handleNotificationPrefChange}
                        className="sr-only peer"
                      />
                      <div
                        className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                        style={{
                          backgroundColor: notificationPrefs.emailNotifications ? 'rgb(5, 22, 80)' : 'rgb(229, 231, 235)'
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 text-sm sm:text-base">{t.pushNotificationsTitle}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">{t.pushNotificationsDesc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-3">
                      <input
                        type="checkbox"
                        name="pushNotifications"
                        checked={notificationPrefs.pushNotifications}
                        onChange={handleNotificationPrefChange}
                        className="sr-only peer"
                      />
                      <div
                        className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                        style={{
                          backgroundColor: notificationPrefs.pushNotifications ? 'rgb(5, 22, 80)' : 'rgb(229, 231, 235)'
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 text-sm sm:text-base">{t.smsNotificationsTitle}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">{t.smsNotificationsDesc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-3">
                      <input
                        type="checkbox"
                        name="smsNotifications"
                        checked={notificationPrefs.smsNotifications}
                        onChange={handleNotificationPrefChange}
                        className="sr-only peer"
                      />
                      <div
                        className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                        style={{
                          backgroundColor: notificationPrefs.smsNotifications ? 'rgb(5, 22, 80)' : 'rgb(229, 231, 235)'
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base text-white transition-colors rounded-xl"
                    style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
                    onClick={saveNotificationPrefs}
                  >
                    {t.savePreferencesButton}
                  </button>
                </div>

                {/* Manager Access — accepted invitations, with the ability to revoke */}
                <div className="pt-6 border-t border-gray-200">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1">{t.managerAccessTitle ?? "Manager Access"}</h2>
                  <p className="text-sm text-gray-500 mb-3 sm:mb-4">
                    {t.managerAccessSubtitle ?? "Managers who currently have access to your CVs, portfolio, and personal information. You can revoke access at any time."}
                  </p>

                  {loadingInvitations && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm py-6 justify-center">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                      {t.loadingLabel ?? "Loading…"}
                    </div>
                  )}

                  {!loadingInvitations && invitationsError && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {invitationsError}
                    </div>
                  )}

                  {!loadingInvitations && !invitationsError && acceptedInvitations.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-md">
                      <Icon icon="tabler:shield-off" className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm text-gray-500">{t.noManagerAccess ?? "No managers currently have access to your information."}</p>
                    </div>
                  )}

                  {!loadingInvitations && !invitationsError && acceptedInvitations.length > 0 && (
                    <div className="space-y-3">
                      {acceptedInvitations.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <button
                            onClick={() => setViewingManager(inv)}
                            className="flex items-center gap-3 min-w-0 text-left hover:opacity-75 transition-opacity"
                          >
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                            >
                              {(inv.bossName || "?")[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{inv.bossName || (t.unknownManagerLabel ?? "Unknown manager")}</p>
                              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                {inv.companyName && (
                                  <span className="text-xs text-gray-500">{inv.companyName}</span>
                                )}
                                <span
                                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: 'rgba(176, 196, 222, 0.25)', color: 'rgb(5, 22, 80)' }}
                                >
                                  {accessLevelLabel(inv.accessLevel)}
                                </span>
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => requestRevoke(inv)}
                            disabled={revokingId === inv.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 text-xs font-medium flex-shrink-0 transition-colors"
                          >
                            {revokingId === inv.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Icon icon="tabler:lock" className="w-3.5 h-3.5" />
                            )}
                            {t.revokeBtn ?? "Revoke"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Social Links Tab */}
            {activeTab === "social" && (
              <div className="space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">{t.socialLinksTitle}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.linkedinLabel}</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-2 sm:px-3 text-gray-500 bg-gray-100 rounded-l-md border border-r-0 border-gray-300">
                        <Icon icon="tabler:brand-linkedin" className="w-4 h-4 sm:w-5 sm:h-5" />
                      </span>
                      <input
                        type="text"
                        name="linkedIn"
                        value={socialLinks.linkedIn || ""}
                        onChange={handleSocialLinkChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-r-md focus:outline-none transition-colors"
                        onFocus={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                          e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = ''
                          e.currentTarget.style.borderColor = ''
                        }}
                        placeholder="linkedin.com/in/username"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.xLabel}</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-2 sm:px-3 text-gray-500 bg-gray-100 rounded-l-md border border-r-0 border-gray-300">
                        <Icon icon="tabler:brand-x" className="w-4 h-4 sm:w-5 sm:h-5" />
                      </span>
                      <input
                        type="text"
                        name="x"
                        value={socialLinks.x || ""}
                        onChange={handleSocialLinkChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-r-md focus:outline-none transition-colors"
                        onFocus={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                          e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = ''
                          e.currentTarget.style.borderColor = ''
                        }}
                        placeholder="x.com/username"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.githubLabel}</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-2 sm:px-3 text-gray-500 bg-gray-100 rounded-l-md border border-r-0 border-gray-300">
                        <Icon icon="tabler:brand-github" className="w-4 h-4 sm:w-5 sm:h-5" />
                      </span>
                      <input
                        type="text"
                        name="gitHub"
                        value={socialLinks.gitHub || ""}
                        onChange={handleSocialLinkChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-r-md focus:outline-none transition-colors"
                        onFocus={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                          e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = ''
                          e.currentTarget.style.borderColor = ''
                        }}
                        placeholder="github.com/username"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.websiteLabel}</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-2 sm:px-3 text-gray-500 bg-gray-100 rounded-l-md border border-r-0 border-gray-300">
                        <Icon icon="tabler:world" className="w-4 h-4 sm:w-5 sm:h-5" />
                      </span>
                      <input
                        type="text"
                        name="website"
                        value={socialLinks.website || ""}
                        onChange={handleSocialLinkChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-r-md focus:outline-none transition-colors"
                        onFocus={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(176, 196, 222, 0.5)'
                          e.currentTarget.style.borderColor = 'rgb(176, 196, 222)'
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.boxShadow = ''
                          e.currentTarget.style.borderColor = ''
                        }}
                        placeholder="www.example.com"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base text-white transition-colors rounded-xl"
                    style={{ backgroundColor: 'rgb(5, 22, 80)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'}
                    onClick={saveSocialLinks}
                  >
                    {t.saveLinksButton}
                  </button>
                </div>
              </div>
            )}

            {/* Security Tab — change password */}
            {activeTab === "security" && (
              <ChangePasswordForm
                endpoint="/api/user/password"
                language={language}
                onSuccess={(message) => toast.success(message)}
              />
            )}
          </div>
        </Card>
      </div>

      <ManagerInfoDrawer
        invitation={viewingManager}
        onClose={() => setViewingManager(null)}
        accessLevelLabel={accessLevelLabel}
      />

      {revokeTarget && (
        <RevokeAccessDialog
          managerName={revokeTarget.bossName}
          revoking={revokingId === revokeTarget.id}
          onCancel={() => setRevokeTarget(null)}
          onConfirm={confirmRevoke}
        />
      )}
    </div>
  )
}

export default MyAccount

// bg-[rgb(5,22,80)] text-white hover:bg-[rgb(28,45,100)]
