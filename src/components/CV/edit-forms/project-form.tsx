"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ProjectDetails } from "@/utils/types"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"

interface ProjectFormProps {
  project?: ProjectDetails
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (project: ProjectDetails) => void
}

export function ProjectForm({ project, open, onOpenChange, onSave }: ProjectFormProps) {
  const { t } = useDashboardTranslations()

  const [formData, setFormData] = useState<ProjectDetails>(
    project || {
      id: "",
      role: "",
      startDate: new Date(),
      isCurrent: false,
      description: "",
      skills: "",
      company: "",
      location: "",
      projectUrl: "",
    },
  )

  useEffect(() => {
    if (project) {
      setFormData(project)
    } else {
      setFormData({
        id: "",
        role: "",
        startDate: new Date(),
        isCurrent: false,
        description: "",
        skills: "",
        company: "",
        location: "",
        projectUrl: "",
      })
    }
  }, [project])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, field: "startDate" | "endDate") => {
    const { value } = e.target
    setFormData((prev) => ({ ...prev, [field]: value ? new Date(value) : undefined }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isCurrent: checked, endDate: checked ? undefined : prev.endDate }))
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
          <DialogTitle>{project ? t.editProject : t.addNewProject}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">{t.title}</Label>
            <Input
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              placeholder={t.presentTitlePlaceholder}
              required
            />
          </div>

          {/* Company + Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">{t.companyName}</Label>
              <Input
                id="company"
                name="company"
                value={formData.company || ""}
                onChange={handleChange}
                placeholder={t.companyNamePlaceholder}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{t.officeLocationLabel}</Label>
              <Input
                id="location"
                name="location"
                value={formData.location || ""}
                onChange={handleChange}
                placeholder={t.cityCountry}
              />
            </div>
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
              <Label htmlFor="endDate" className={formData.isCurrent ? "text-muted-foreground" : ""}>
                {t.endDate}
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formatDateForInput(formData.endDate)}
                onChange={(e) => handleDateChange(e, "endDate")}
                disabled={formData.isCurrent}
              />
            </div>
          </div>

          {/* Ongoing */}
          <div className="flex items-center space-x-2">
            <Checkbox id="isCurrent" checked={formData.isCurrent} onCheckedChange={handleCheckboxChange} />
            <Label htmlFor="isCurrent">{t.ongoing}</Label>
          </div>

          {/* Description */}
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

          {/* Skills */}
          <div className="space-y-2">
            <Label htmlFor="skills">{t.skills}</Label>
            <Input
              id="skills"
              name="skills"
              value={formData.skills || ""}
              onChange={handleChange}
              placeholder={t.technicalSkills}
            />
          </div>

          {/* Project URL */}
          <div className="space-y-2">
            <Label htmlFor="projectUrl">{t.website}</Label>
            <Input
              id="projectUrl"
              name="projectUrl"
              type="url"
              value={formData.projectUrl || ""}
              onChange={handleChange}
              placeholder={t.linkPlaceholder}
            />
          </div>

          <DialogFooter>
            <Button type="submit">{project ? t.saveChanges : t.addProject}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
