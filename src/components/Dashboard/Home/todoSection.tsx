"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { TriangleAlert, CheckCircle } from "lucide-react"
import { useProfileStore } from "@/utils/profileStore"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Button from "../ReUsable/Button"
import type { PersonalInformation } from "@/types/payloadTypes"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"

const TodoSection: React.FC = () => {
  const { t } = useDashboardTranslations()
  const currentProfile = useProfileStore((state) => state.currentProfile)
  const [missingInfo, setMissingInfo] = useState<string[]>([])

  useEffect(() => {
    if (!currentProfile) {
      setMissingInfo([])
      return
    }

    // Handle the case where personalInformation or profileDetails might be null/undefined
    const personalInformation = currentProfile.personalInformation || {}
    const profileDetails = currentProfile.profileDetails || {}
    const allFields = { ...personalInformation, ...profileDetails }

    const checkIfEmpty = (field: any): boolean =>
      field === null ||
      field === undefined ||
      (Array.isArray(field) && field.length === 0) ||
      (typeof field === "object" && Object.keys(field).length === 0) ||
      (typeof field === "string" && field.trim() === "")

    const excludedFields = ["dateOfBirth", "companyType"]

    const missingFields = Object.keys(allFields).reduce((acc: string[], key: string) => {
      if (excludedFields.includes(key)) return acc
      const value = allFields[key as keyof typeof allFields]
      if (checkIfEmpty(value)) acc.push(key)
      return acc
    }, [])

    setMissingInfo(missingFields)
  }, [currentProfile])

  // Function to get the appropriate URL path for a specific field
  const getFieldEditPath = (field: string): string => {
    // List of all personal information fields that should go to account settings
    const personalInfoFields: (keyof PersonalInformation)[] = [
      "firstName",
      "lastName",
      "privateEmail",
      "workEmail",
      "recoveryEmail",
      "homeAddress",
      "phoneNumber",
      "dateOfBirth",
      "gender",
      "title",
      "professionalPresentation",
      "personalPresentation",
      "profileImage",
      "workPhoneNumber"
    ]

    if (personalInfoFields.includes(field as keyof PersonalInformation)) {
      return "/dashboard/settings/account"
    }

    // All other fields go to profile
    return "/dashboard/profile/edit"
  }

  // If profile doesn't exist, show creation prompt
  if (!currentProfile) {
    return (
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="w-full p-6 rounded-xl bg-white border border-gray-200 shadow-sm"
        role="region"
        aria-label={t.profileRecommendations}
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-800">{t.profileRecommendations}</h2>
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <TriangleAlert className="w-6 h-6 text-orange-500" aria-hidden="true" />
          <p className="text-gray-700 font-medium">{t.profileNotCreated}</p>
          <p className="text-sm text-gray-500">{t.startProfileNow}</p>
          <Link href="/dashboard/profile/create-profile" className="w-full max-w-xs">
            <div
              className="w-full bg-[rgb(5,22,80)] hover:bg-[rgb(8,30,100)] transition-colors rounded-xl"
            >
              <Button className="w-full bg-transparent hover:bg-transparent">
                {t.createProfile}
              </Button>
            </div>
          </Link>
        </div>
      </motion.section>
    )
  }

  // Safely access fields with null checks
  const personalInformation = currentProfile.personalInformation || {}
  const profileDetails = currentProfile.profileDetails || {}
  const allFields = { ...personalInformation, ...profileDetails }

  const excludedFields = ["dateOfBirth", "companyType"]
  const validFields = Object.keys(allFields).filter((key) => !excludedFields.includes(key))
  const completedFields = validFields.length - missingInfo.length
  const progress = validFields.length > 0 ? Math.round((completedFields / validFields.length) * 100) : 0

  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full p-6 rounded-2xl shadow-lg bg-white"
      role="region"
      aria-label={t.profileRecommendations}
    >
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{t.profileRecommendations}</h2>
      <div className="w-full h-2 rounded-full bg-gray-200 mb-4 overflow-hidden" aria-hidden="true">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full bg-green-500 rounded-full"
        />
      </div>
      <p className="text-sm text-gray-600 mb-3">
        {t.profileCompletion}: <span className="font-medium">{progress}%</span> ({completedFields}/{validFields.length}{" "}
        {t.fieldsCompleted})
      </p>

      <AnimatePresence mode="wait">
        {missingInfo.length > 0 ? (
          <motion.div
            key="incomplete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <p className="text-gray-600 text-sm">{t.enhanceProfile}</p>
            <motion.ul
              initial="initial"
              animate="animate"
              exit="exit"
              variants={{
                animate: {
                  transition: { staggerChildren: 0.07, delayChildren: 0.2 },
                },
              }}
              className="space-y-2"
            >
              {missingInfo.map((field) => (
                <motion.li
                  key={field}
                  variants={{
                    initial: { opacity: 0, x: -10 },
                    animate: { opacity: 1, x: 0 },
                    exit: { opacity: 0, x: -10 },
                  }}
                  className="flex items-center gap-2"
                >
                  <Link
                    href={getFieldEditPath(field)}
                    className="flex items-center gap-2 hover:bg-gray-100 p-1 px-2 rounded-md transition-colors w-full"
                    aria-label={`${t.updateField} ${field}`}
                  >
                    <TriangleAlert className="w-5 h-5 text-orange-500 animate-pulse" aria-hidden="true" />
                    <span className="text-gray-800 text-sm capitalize">{field.replace(/([A-Z])/g, " $1").trim()}</span>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        ) : (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center gap-2"
            role="status"
          >
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="w-7 h-7 text-green-600 animate-bounce" aria-hidden="true" />
            </div>
            <p className="text-green-600 font-medium">{t.profileComplete}</p>
            <p className="text-sm text-gray-500">{t.stayActive}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

export default TodoSection
