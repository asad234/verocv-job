"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Profile } from "@/utils/types"

interface ProfileFormProps {
  profile: Profile
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (profile: Profile) => void
}

export function ProfileForm({ profile, open, onOpenChange, onSave }: ProfileFormProps) {
  const [formData, setFormData] = useState<Profile>({ ...profile })


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Handle nested fields, such as personalInformation fields
    if (name in formData.personalInformation) {
      setFormData((prev) => ({
        ...prev,
        personalInformation: {
          ...prev.personalInformation,
          [name]: value,
        },
      }))
    } else {
      // Handle non-nested fields
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
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
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.personalInformation.firstName}
                onChange={handleChange}
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.personalInformation.title}
                onChange={handleChange}
                placeholder="Your job title"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.user || ""}
                onChange={handleChange}
                placeholder="Your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.personalInformation.phoneNumber || ""}
                onChange={handleChange}
                placeholder="Your phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.personalInformation.homeAddress || ""}
                onChange={handleChange}
                placeholder="Your location"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="about">About</Label>
            <Textarea
              id="about"
              name="about"
              value={formData.personalInformation.personalPresentation || ""}
              onChange={handleChange}
              placeholder="Write a short bio about yourself"
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
