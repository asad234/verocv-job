"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CVNameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string) => void
  isLoading?: boolean
}

export function CVNameDialog({ open, onOpenChange, onSave, isLoading }: CVNameDialogProps) {
  const [cvName, setCvName] = useState("")

  const handleSave = () => {
    if (cvName.trim()) {
      onSave(cvName.trim())
      setCvName("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && cvName.trim()) {
      handleSave()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Your CV</DialogTitle>
          <DialogDescription>
            What would you like to call your CV? Choose a name that helps you identify it later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cv-name" className="text-right">
              CV Name
            </Label>
            <Input
              id="cv-name"
              value={cvName}
              onChange={(e) => setCvName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Software Developer CV"
              className="col-span-3"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!cvName.trim() || isLoading}>
            {isLoading ? "Saving..." : "Save CV"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
