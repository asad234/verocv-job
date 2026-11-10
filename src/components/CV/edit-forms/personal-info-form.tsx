"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, ZoomIn, ZoomOut, Move, Camera, X, ImageIcon } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import type { PersonalInformation } from "@/utils/types"
import { toast } from "@/components/ui/use-toast"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"

export function ImagePositionEditor({
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
  const { t } = useDashboardTranslations()
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const img = new Image()
    img.src = imageSrc
    img.onload = () => {
      imageRef.current = img
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
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const size = 300
    const imgWidth = img.width * zoom
    const imgHeight = img.height * zoom
    const x = (size - imgWidth) / 2 + position.x
    const y = (size - imgHeight) / 2 + position.y
    ctx.save()
    if (isCircular) {
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
    }
    ctx.drawImage(img, x, y, imgWidth, imgHeight)
    ctx.restore()
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)))
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    onSave(canvas.toDataURL("image/png"))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center space-y-4">
        <div
          className={`relative border-2 border-dashed border-gray-300 overflow-hidden cursor-move bg-gray-50 ${isCircular ? "rounded-full" : "rounded-md"}`}
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
              onValueChange={(values) => { if (values[0] !== undefined) setZoom(values[0]) }}
              min={0.5}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4" />
          </div>
          <p className="text-xs text-center text-gray-500">{t.dragToSelectMultiple}</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>{t.cancel}</Button>
        <Button onClick={handleSave}>{t.saveProfileImageButton}</Button>
      </div>
    </div>
  )
}

interface PersonalInfoFormProps {
  personalInfo: PersonalInformation | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (personalInfo: PersonalInformation) => void
}

export function PersonalInfoForm({ personalInfo, open, onOpenChange, onSave }: PersonalInfoFormProps) {
  const { t } = useDashboardTranslations()

  const emptyForm: PersonalInformation = {
    user: 0,
    createdAt: "",
    updatedAt: "",
    id: "",
    firstName: "",
    lastName: "",
    title: "",
    phoneNumber: "",
    homeAddress: "",
    gender: "other",
    companyType: "",
    professionalPresentation: "",
    personalPresentation: "",
    profileImage: { uploadImage: null, staticImage: null },
    companyLogo: { uploadImage: null, staticImage: null },
  }

  const [formData, setFormData] = useState<PersonalInformation>(personalInfo || emptyForm)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewLogo, setPreviewLogo] = useState<string | null>(null)
  const [rawImage, setRawImage] = useState<string | null>(null)
  const [rawLogo, setRawLogo] = useState<string | null>(null)
  const [showImageEditor, setShowImageEditor] = useState(false)
  const [showLogoEditor, setShowLogoEditor] = useState(false)
  const profileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (personalInfo) {
      setFormData(personalInfo)
      if (personalInfo.profileImage?.uploadImage) {
        if (typeof personalInfo.profileImage.uploadImage === "object" && personalInfo.profileImage.uploadImage !== null) {
          setPreviewImage(personalInfo.profileImage.uploadImage.url || null)
        } else if (typeof personalInfo.profileImage.uploadImage === "number") {
          fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/media/${personalInfo.profileImage.uploadImage}`)
            .then((res) => res.json())
            .then((data) => { if (data?.url) setPreviewImage(data.url) })
            .catch((err) => console.error("Failed to fetch profile image:", err))
        }
      } else if (personalInfo.profileImage?.staticImage) {
        setPreviewImage(personalInfo.profileImage.staticImage)
      } else {
        setPreviewImage(null)
      }

      if (personalInfo.companyLogo?.uploadImage) {
        if (typeof personalInfo.companyLogo.uploadImage === "object" && personalInfo.companyLogo.uploadImage !== null) {
          setPreviewLogo(personalInfo.companyLogo.uploadImage.url || null)
        } else if (typeof personalInfo.companyLogo.uploadImage === "number") {
          fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/media/${personalInfo.companyLogo.uploadImage}`)
            .then((res) => res.json())
            .then((data) => { if (data?.url) setPreviewLogo(data.url) })
            .catch((err) => console.error("Failed to fetch company logo:", err))
        }
      } else if (personalInfo.companyLogo?.staticImage) {
        setPreviewLogo(personalInfo.companyLogo.staticImage)
      } else {
        setPreviewLogo(null)
      }
    } else {
      setFormData(emptyForm)
      setPreviewImage(null)
      setPreviewLogo(null)
    }
  }, [personalInfo, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "logo") => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      if (type === "profile") { setRawImage(base64String); setShowImageEditor(true) }
      else { setRawLogo(base64String); setShowLogoEditor(true) }
    }
    reader.readAsDataURL(file)
  }

  const handleImageSave = (croppedImage: string) => {
    setPreviewImage(croppedImage)
    setFormData((prev) => ({ ...prev, profileImage: { uploadImage: null, staticImage: croppedImage } }))
    setShowImageEditor(false)
    setRawImage(null)
  }

  const handleLogoSave = (croppedLogo: string) => {
    setPreviewLogo(croppedLogo)
    setFormData((prev) => ({ ...prev, companyLogo: { uploadImage: null, staticImage: croppedLogo } }))
    setShowLogoEditor(false)
    setRawLogo(null)
  }

  const handleRemoveImage = (type: "profile" | "logo") => {
    if (type === "profile") {
      setPreviewImage(null)
      setFormData((prev) => ({ ...prev, profileImage: { uploadImage: null, staticImage: null } }))
    } else {
      setPreviewLogo(null)
      setFormData((prev) => ({ ...prev, companyLogo: { uploadImage: null, staticImage: null } }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let uploadedProfileImageId = null
      let uploadedCompanyLogoId = null

      if (formData.profileImage?.staticImage && formData.profileImage.staticImage.startsWith("data:")) {
        try {
          const blob = await fetch(formData.profileImage.staticImage).then((r) => r.blob())
          const file = new File([blob], "profile-image.png", { type: "image/png" })
          const imageFormData = new FormData()
          imageFormData.append("file", file)
          const uploadResponse = await fetch("/api/media", { method: "POST", body: imageFormData })
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            uploadedProfileImageId = uploadData?.doc?.id
          }
        } catch (uploadError) {
          console.error("Profile image upload failed:", uploadError)
        }
      }

      if (formData.companyLogo?.staticImage && formData.companyLogo.staticImage.startsWith("data:")) {
        try {
          const blob = await fetch(formData.companyLogo.staticImage).then((r) => r.blob())
          const file = new File([blob], "company-logo.png", { type: "image/png" })
          const logoFormData = new FormData()
          logoFormData.append("file", file)
          const uploadResponse = await fetch("/api/media", { method: "POST", body: logoFormData })
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            uploadedCompanyLogoId = uploadData?.doc?.id
          }
        } catch (uploadError) {
          console.error("Company logo upload failed:", uploadError)
        }
      }

      const { id, createdAt, updatedAt, user, ...cleanData } = formData
      let profileImageData = null
      let companyLogoData = null

      if (uploadedProfileImageId) {
        try {
          const response = await fetch(`/api/media/${uploadedProfileImageId}`)
          if (response.ok) profileImageData = await response.json()
        } catch (error) { console.error("Failed to fetch profile image data:", error) }
      }

      if (uploadedCompanyLogoId) {
        try {
          const response = await fetch(`/api/media/${uploadedCompanyLogoId}`)
          if (response.ok) companyLogoData = await response.json()
        } catch (error) { console.error("Failed to fetch company logo data:", error) }
      }

      const dataToSave = {
        ...cleanData,
        profileImage: {
          uploadImage: profileImageData
            ? profileImageData
            : typeof formData.profileImage?.uploadImage === "object" && formData.profileImage?.uploadImage !== null
              ? formData.profileImage.uploadImage
              : formData.profileImage?.uploadImage || null,
          staticImage: uploadedProfileImageId || profileImageData
            ? null
            : formData.profileImage?.staticImage && !formData.profileImage.staticImage.startsWith("data:")
              ? formData.profileImage.staticImage
              : null,
        },
        companyLogo: {
          uploadImage: companyLogoData
            ? companyLogoData
            : typeof formData.companyLogo?.uploadImage === "object" && formData.companyLogo?.uploadImage !== null
              ? formData.companyLogo.uploadImage
              : formData.companyLogo?.uploadImage || null,
          staticImage: uploadedCompanyLogoId || companyLogoData
            ? null
            : formData.companyLogo?.staticImage && !formData.companyLogo.staticImage.startsWith("data:")
              ? formData.companyLogo.staticImage
              : null,
        },
      }

      onSave(dataToSave as PersonalInformation)
      onOpenChange(false)
    } catch (error) {
      console.error("Error in handleSubmit:", error)
      toast({ title: t.failedToUpdateProfile, description: t.tryAgainLater, variant: "destructive" })
    }
  }

  if (showImageEditor && rawImage) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.profileImageTitle}</DialogTitle>
          </DialogHeader>
          <ImagePositionEditor
            imageSrc={rawImage}
            onSave={handleImageSave}
            onCancel={() => { setShowImageEditor(false); setRawImage(null) }}
            isCircular={true}
          />
        </DialogContent>
      </Dialog>
    )
  }

  if (showLogoEditor && rawLogo) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.profileImageTitle}</DialogTitle>
          </DialogHeader>
          <ImagePositionEditor
            imageSrc={rawLogo}
            onSave={handleLogoSave}
            onCancel={() => { setShowLogoEditor(false); setRawLogo(null) }}
            isCircular={false}
          />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t.editPersonalInformation}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Picture and Logo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.profileImageTitle}</Label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300">
                    {previewImage ? (
                      <img src={previewImage || "/placeholder.svg"} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  {previewImage && (
                    <button type="button" onClick={() => handleRemoveImage("profile")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <label htmlFor="profile-picture-upload" className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>{previewImage ? t.removeUploadButton : t.selectImageButton}</span>
                  </label>
                  <input ref={profileInputRef} id="profile-picture-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "profile")} className="hidden" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.websiteLabel}</Label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-24 h-24 bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300 rounded-md">
                    {previewLogo ? (
                      <img src={previewLogo || "/placeholder.svg"} alt="Company Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  {previewLogo && (
                    <button type="button" onClick={() => handleRemoveImage("logo")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <label htmlFor="company-logo-upload" className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>{previewLogo ? t.removeUploadButton : t.selectImageButton}</span>
                  </label>
                  <input ref={logoInputRef} id="company-logo-upload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "logo")} className="hidden" />
                </div>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t.firstName}</Label>
              <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} placeholder={t.firstNamePlaceholder} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t.lastName}</Label>
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} placeholder={t.lastNamePlaceholder} required />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t.title}</Label>
            <Input id="title" name="title" value={formData.title || ""} onChange={handleChange} placeholder={t.titlePlaceholder} />
          </div>

          {/* Phone + Address */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">{t.phoneNumberLabel}</Label>
              <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber || ""} onChange={handleChange} placeholder={t.phoneNumberPlaceholder} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="homeAddress">{t.homeAddressLabel}</Label>
              <Input id="homeAddress" name="homeAddress" value={formData.homeAddress || ""} onChange={handleChange} placeholder={t.homeAddressPlaceholder} />
            </div>
          </div>

          {/* Gender + Company Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">{t.genderLabel}</Label>
              <Select value={formData.gender || "other"} onValueChange={(value) => handleSelectChange("gender", value)}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder={t.genderLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t.maleOption}</SelectItem>
                  <SelectItem value="female">{t.femaleOption}</SelectItem>
                  <SelectItem value="other">{t.genderLabel}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyType">{t.workAreaLabel}</Label>
              <Input id="companyType" name="companyType" value={formData.companyType || ""} onChange={handleChange} placeholder={t.workAreaPlaceholder} />
            </div>
          </div>

          {/* Professional Summary */}
          <div className="space-y-2">
            <Label htmlFor="professionalPresentation">{t.professionalSummary}</Label>
            <Textarea id="professionalPresentation" name="professionalPresentation" value={formData.professionalPresentation || ""} onChange={handleChange} placeholder={t.professionalPresentationPlaceholder} className="min-h-[100px]" />
          </div>

          {/* Personal Summary */}
          <div className="space-y-2">
            <Label htmlFor="personalPresentation">{t.personalSummary}</Label>
            <Textarea id="personalPresentation" name="personalPresentation" value={formData.personalPresentation || ""} onChange={handleChange} placeholder={t.personalPresentationPlaceholder} className="min-h-[100px]" />
          </div>

          <DialogFooter>
            <Button type="submit">{t.saveChanges}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
