"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Language } from "@/utils/types"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"


interface LanguageFormProps {
  language?: Language
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (language: Language) => void
}

export function LanguageForm({ language, open, onOpenChange, onSave }: LanguageFormProps) {
  const { t } = useDashboardTranslations()

  const [formData, setFormData] = useState<Language>(
    language || { id: "", language: "", level: "Basic" },
  )

  useEffect(() => {
    if (language) {
      setFormData(language)
    } else {
      setFormData({ id: "", language: "", level: "Basic" })
    }
  }, [language, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLevelChange = (value: string) => {
    setFormData((prev) => ({ ...prev, level: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onOpenChange(false)
  }

  // Level values stay in English (stored in DB); labels are translated
  const levels = [
    { value: "Basic", label: t.basic },
    { value: "Intermediate", label: t.intermediate },
    { value: "Advanced", label: t.advanced },
    { value: "Fluent", label: t.fluent },
    { value: "Native", label: t.native },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{language ? t.editLanguage : t.addNewLanguage}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">{t.language}</Label>
            <Input id="language" name="language" value={formData.language} onChange={handleChange} placeholder={t.languagePlaceholder} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">{t.level}</Label>
            <Select value={formData.level} onValueChange={handleLevelChange}>
              <SelectTrigger id="level">
                <SelectValue placeholder={t.selectLevel} />
              </SelectTrigger>
              <SelectContent>
                {levels.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit">{language ? t.saveChanges : t.addLanguageBtn}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
