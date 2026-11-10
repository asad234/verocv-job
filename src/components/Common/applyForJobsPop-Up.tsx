"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"

interface ComingSoonDialogProps {
  trigger?: React.ReactNode
}

const ComingSoonDialog = ({ trigger }: ComingSoonDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useDashboardTranslations()

  return (
    <>
      {/* Trigger Element */}
      <div onClick={() => setIsOpen(true)}>
        {trigger}
      </div>

      {/* Dialog Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Dialog Content */}
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <Icon icon="tabler:x" className="w-5 h-5 text-gray-500" />
            </button>

            {/* Content */}
            <div className="p-8 text-center">
              {/* Icon */}
              <div className="mx-auto w-20 h-20 bg-[rgb(5,22,80)] rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Icon icon="tabler:rocket" className="w-10 h-10 text-white" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-[rgb(5,22,80)] mb-3">
                {t.comingSoonTitle}
              </h2>

              {/* Description */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                {t.comingSoonDescription}
              </p>

              {/* CTA Button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-6 py-3 bg-[rgb(5,22,80)] text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl hover:bg-[rgb(8,30,100)]"
                >
                  {t.gotItButton}
                </button>
              </div>

              {/* Footer Info */}
              <p className="text-xs text-gray-500 mt-4">
                {t.completeProfileMessage}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ComingSoonDialog
