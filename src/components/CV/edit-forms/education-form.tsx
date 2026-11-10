"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { Education } from "@/utils/types"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"

interface EducationFormProps {
  education?: Education
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (education: Education) => void
}

export function EducationForm({ education, open, onOpenChange, onSave }: EducationFormProps) {
  const { t } = useDashboardTranslations()

  const [formData, setFormData] = useState<Education>(
    education || {
      id: "",
      school: "",
      program: "",
      level: "",
      place: "",
      startDate: new Date(),
      ongoing: false,
      description: "",
      link: "",
    },
  )

  useEffect(() => {
    if (education) {
      setFormData(education)
    } else {
      setFormData({
        id: "",
        school: "",
        program: "",
        level: "",
        place: "",
        startDate: new Date(),
        ongoing: false,
        description: "",
        link: "",
      })
    }
  }, [education, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: "startDate" | "endDate") => {
    const { value } = e.target
    setFormData((prev) => ({
      ...prev,
      [field]: value ? new Date(value) : undefined,
    }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      ongoing: checked,
      endDate: checked ? undefined : prev.endDate,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onOpenChange(false)
  }

  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return ""
    return new Date(date).toISOString().split("T")[0]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{education ? t.editEducation : t.addNewEducation}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="school">{t.school}</Label>
            <Input
              id="school"
              name="school"
              value={formData.school}
              onChange={handleChange}
              placeholder={t.schoolName}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="program">{t.program}</Label>
              <Input
                id="program"
                name="program"
                value={formData.program}
                onChange={handleChange}
                placeholder={t.programOrDegree}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">{t.educationLevel}</Label>
              <Input
                id="level"
                name="level"
                value={formData.level}
                onChange={handleChange}
                placeholder={t.selectLevel}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="place">{t.place}</Label>
            <Input
              id="place"
              name="place"
              value={formData.place}
              onChange={handleChange}
              placeholder={t.cityCountry}
              required
            />
          </div>

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
              <Label htmlFor="endDate" className={formData.ongoing ? "text-muted-foreground" : ""}>
                {t.endDate}
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formatDateForInput(formData.endDate)}
                onChange={(e) => handleDateChange(e, "endDate")}
                disabled={formData.ongoing}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="ongoing" checked={formData.ongoing} onCheckedChange={handleCheckboxChange} />
            <Label htmlFor="ongoing">{t.ongoing}</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t.description}</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t.educationDescription}
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">{t.schoolWebsite}</Label>
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
            <Button type="submit">{education ? t.saveChanges : t.addEducation}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
