// ─── ReferenceForm ───────────────────────────────────────────────────────────
"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Reference } from "@/utils/types"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"

interface ReferenceFormProps {
  reference?: Reference
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (reference: Reference) => void
}

export function ReferenceForm({ reference, open, onOpenChange, onSave }: ReferenceFormProps) {
  const { t } = useDashboardTranslations()

  const [formData, setFormData] = useState<Reference>(
    reference || {
      id: "",
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      company: "",
      positionTitle: "",
      relationship: "",
    },
  )

  useEffect(() => {
    if (reference) {
      setFormData(reference)
    } else {
      setFormData({ id: "", firstName: "", lastName: "", email: "", phoneNumber: "", company: "", positionTitle: "", relationship: "" })
    }
  }, [reference])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{reference ? t.editReference : t.addNewReference}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder={t.emailPlaceholder} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">{t.phone}</Label>
              <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder={t.phoneNumberPlaceholder} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">{t.companyName}</Label>
              <Input id="company" name="company" value={formData.company || ""} onChange={handleChange} placeholder={t.companyNamePlaceholder} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="positionTitle">{t.title}</Label>
              <Input id="positionTitle" name="positionTitle" value={formData.positionTitle} onChange={handleChange} placeholder={t.titlePlaceholder} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship">{t.relationship}</Label>
            <Input id="relationship" name="relationship" value={formData.relationship} onChange={handleChange} placeholder={t.relationship} required />
          </div>

          <DialogFooter>
            <Button type="submit">{reference ? t.saveChanges : t.addReference}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
