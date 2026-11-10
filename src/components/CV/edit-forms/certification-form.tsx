"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Certification } from "@/utils/types"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"

interface CertificationFormProps {
  certification?: Certification
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (certification: Certification) => void
}

export function CertificationForm({ certification, open, onOpenChange, onSave }: CertificationFormProps) {
  const { t } = useDashboardTranslations()

  const [formData, setFormData] = useState<Certification>({
    id: "",
    type: "certificate",
    title: "",
    startDate: new Date(),
    validDate: new Date(),
    issuer: "",
    supplier: "",
    description: "",
    link: "",
    code: "",
    noExpiry: false,
  })

  const [doesntExpire, setDoesntExpire] = useState(false)

  useEffect(() => {
    if (certification) {
      setFormData(certification)
      setDoesntExpire(certification.noExpiry ?? false)
    } else {
      setFormData({
        id: "",
        type: "certificate",
        title: "",
        startDate: new Date(),
        validDate: new Date(),
        issuer: "",
        supplier: "",
        description: "",
        link: "",
        code: "",
        noExpiry: false,
      })
      setDoesntExpire(false)
    }
  }, [certification, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value as "certificate" | "course" }))
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: "startDate" | "validDate") => {
    const { value } = e.target
    setFormData((prev) => ({
      ...prev,
      [field]: value ? new Date(value) : undefined,
    }))
  }

  const handleDoesntExpireChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setDoesntExpire(checked)
    const farFutureDate = new Date()
    if (checked) farFutureDate.setFullYear(farFutureDate.getFullYear() + 100)
    setFormData((prev) => ({
      ...prev,
      noExpiry: checked,
      validDate: checked ? farFutureDate : new Date(),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onOpenChange(false)
  }

  const formatDateForInput = (date: Date | undefined | null) => {
    if (!date) return ""
    return new Date(date).toISOString().split("T")[0]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{certification ? t.editCertification : t.addNewCertification}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">{t.type}</Label>
            <Select value={formData.type} onValueChange={handleTypeChange}>
              <SelectTrigger id="type">
                <SelectValue placeholder={t.type} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="certificate">{t.certificate}</SelectItem>
                <SelectItem value="course">{t.course}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t.certificateTitle}</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t.certificationTitle}
              required
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">{t.startDate}</Label>
              <Input
                id="startDate"
                type="date"
                value={formatDateForInput(formData.startDate)}
                onChange={(e) => handleDateChange(e, "startDate")}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="validDate">{t.validUntil}</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="doesntExpire"
                    checked={doesntExpire}
                    onChange={handleDoesntExpireChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="doesntExpire" className="text-sm font-normal">
                    {t.doesntExpire}
                  </Label>
                </div>
              </div>
              {!doesntExpire && (
                <Input
                  id="validDate"
                  type="date"
                  value={formatDateForInput(formData.validDate)}
                  onChange={(e) => handleDateChange(e, "validDate")}
                  required={!doesntExpire}
                />
              )}
            </div>
          </div>

          {/* Issuer + Supplier */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issuer">{t.issuer}</Label>
              <Input
                id="issuer"
                name="issuer"
                value={formData.issuer}
                onChange={handleChange}
                placeholder={t.issuingOrganization}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">{t.supplier}</Label>
              <Input
                id="supplier"
                name="supplier"
                value={formData.supplier || ""}
                onChange={handleChange}
                placeholder={t.supplierPlaceholder}
              />
            </div>
          </div>

          {/* Certificate Code */}
          <div className="space-y-2">
            <Label htmlFor="code">{t.certificateCode}</Label>
            <Input
              id="code"
              name="code"
              value={formData.code || ""}
              onChange={handleChange}
              placeholder={t.certificateCodePlaceholder}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t.description}</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder={t.certificationDescription}
              className="min-h-[80px]"
            />
          </div>

          {/* Link */}
          <div className="space-y-2">
            <Label htmlFor="link">{t.link}</Label>
            <Input
              id="link"
              name="link"
              type="url"
              value={formData.link || ""}
              onChange={handleChange}
              placeholder={t.linkPlaceholder}
            />
          </div>

          <DialogFooter>
            <Button type="submit">{certification ? t.saveChanges : t.addCertification}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
