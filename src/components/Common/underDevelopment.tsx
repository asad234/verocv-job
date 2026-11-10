import type React from "react"
import { AlertTriangle } from "lucide-react"
import { useDashboardTranslation } from "@/hooks/useDashboardTranslation"

interface UnderDevelopmentBannerProps {
  /**
   * Custom message to display in the banner
   * Default: Uses translation system
   */
  message?: string
}

const UnderDevelopmentBanner: React.FC<UnderDevelopmentBannerProps> = ({ message }) => {
  const { t, language } = useDashboardTranslation()

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-6" role="alert" aria-live="polite">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">{t.underDevelopmentTitle}</h3>
          <p className="text-sm text-yellow-700 mt-1">{message || t.underDevelopmentMessage}</p>
        </div>
      </div>
    </div>
  )
}

export default UnderDevelopmentBanner
