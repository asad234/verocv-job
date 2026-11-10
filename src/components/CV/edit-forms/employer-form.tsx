"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { Experience } from "@/utils/types"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"

interface EmployerFormProps {
  employer?: Experience
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (employer: Experience) => void
}

export function EmployerForm({ employer, open, onOpenChange, onSave }: EmployerFormProps) {
  const { t } = useDashboardTranslations()

  const emptyForm: Experience = {
    id: "",
    employer: "",
    title: "",
    startDate: new Date(),
    ongoing: false,
    description: "",
    link: "",
  }

  const [formData, setFormData] = useState<Experience>(employer || emptyForm)

  useEffect(() => {
    setFormData(employer ?? emptyForm)
  }, [employer, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: Experience) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: "startDate" | "endDate") => {
    const { value } = e.target
    setFormData((prev: Experience) => ({
      ...prev,
      [field]: value ? new Date(value) : undefined,
    }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev: Experience) => ({
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
          <DialogTitle>{employer ? t.editEmployer : t.addNewEmployer}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employer">{t.companyName}</Label>
            <Input
              id="employer"
              name="employer"
              value={formData.employer}
              onChange={handleChange}
              placeholder={t.companyNamePlaceholder}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">{t.title}</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t.presentTitlePlaceholder}
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
              placeholder={t.featureDescriptionPlaceholder}
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">{t.companyWebsite}</Label>
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
            <Button type="submit">{employer ? t.saveChanges : t.addEmployment}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
