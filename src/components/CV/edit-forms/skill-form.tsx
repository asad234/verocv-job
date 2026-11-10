"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Skill } from "@/utils/types"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"


const generateYearOptions = (t: ReturnType<typeof useDashboardTranslations>["t"]) => {
  const options = []
  for (let i = 0; i <= 20; i++) {
    options.push({
      value: i,
      label: i === 0 ? `< 1 ${t.year}` : `${i} ${i === 1 ? t.year : t.years}`,
    })
  }
  options.push({ value: 21, label: `20+ ${t.years}` })
  return options
}

interface SkillFormProps {
  skill?: Skill
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (skill: Skill) => void
}

export function SkillForm({ skill, open, onOpenChange, onSave }: SkillFormProps) {
  const { t } = useDashboardTranslations()
  const yearOptions = generateYearOptions(t)

  const [formData, setFormData] = useState<Skill>(
    skill || { id: "", skillName: "", skillRating: 3, skillYearsExperience: 0 },
  )

  useEffect(() => {
    if (skill) {
      setFormData(skill)
    } else {
      setFormData({ id: "", skillName: "", skillRating: 3, skillYearsExperience: 0 })
    }
  }, [skill])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSliderChange = (value: number[]) => {
    setFormData((prev) => ({ ...prev, skillRating: value[0] }))
  }

  const handleYearsChange = (value: string) => {
    setFormData((prev) => ({ ...prev, skillYearsExperience: Number.parseInt(value) }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{skill ? t.editSkill : t.addNewSkill}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="skillName">{t.skills}</Label>
            <Input id="skillName" name="skillName" value={formData.skillName} onChange={handleChange} placeholder={t.technicalSkills} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="skillRating">
              {t.selectRating}: {formData.skillRating}
            </Label>
            <Slider
              id="skillRating"
              min={1}
              max={5}
              step={1}
              value={[formData.skillRating || 3]}
              onValueChange={handleSliderChange}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t.basic}</span>
              <span>{t.intermediate}</span>
              <span>{t.advanced}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="skillYearsExperience">{t.years}</Label>
            <Select value={formData.skillYearsExperience?.toString() || "0"} onValueChange={handleYearsChange}>
              <SelectTrigger id="skillYearsExperience" className="w-full">
                <SelectValue placeholder={t.years} />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit">{skill ? t.saveChanges : t.addSkill}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
