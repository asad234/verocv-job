"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useDashboardTranslation } from "@/hooks/useDashboardTranslation"

interface ProfileRequiredDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileRequiredDialog({ open, onOpenChange }: ProfileRequiredDialogProps) {
  const router = useRouter()
  const { t } = useDashboardTranslation()

  const handleGoToProfile = () => {
    onOpenChange(false)
    router.push("/dashboard/profile")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-0 shadow-2xl">
        <DialogHeader className="space-y-3 pb-6 text-center">
          <DialogTitle className="text-2xl font-bold text-gray-900">{t.profileRequiredTitle}</DialogTitle>
          <DialogDescription className="text-gray-600 text-base">{t.profileRequiredDescription}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            onClick={handleGoToProfile}
            className="w-full h-12 bg-gradient-to-r text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            style={{ backgroundColor: 'rgb(5, 22, 80)' }}
          >
            <User className="mr-2 h-5 w-5" />
            {t.createProfileButton}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full h-12">
            {t.continueAnywayButton}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
