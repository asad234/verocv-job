"use client"
import type React from "react"
import { Icon } from "@iconify/react"
import { useProfileStore } from "@/utils/profileStore"
import Card from "../ReUsable/Card"
import Link from "next/link"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"

const TechnicalSkills: React.FC = () => {
  const skills = useProfileStore((state) => state.skills)
  const currentProfile = useProfileStore((state) => state.currentProfile)
  const { t } = useDashboardTranslations()

  return (
    <Card className="w-full md:w-auto">
      <div className="flex items-center gap-2 text-lg font-medium text-gray-800 mb-4">
        <Icon
          icon={"mdi:code-braces"}
          className="w-6 h-6"
          style={{ color: 'rgb(5, 22, 80)' }}
        />
        <h2>{t.technicalSkills}</h2>
      </div>
      {currentProfile ? (
        skills && skills.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: 'rgb(176, 196, 222, 0.2)',
                  color: 'rgb(5, 22, 80)',
                }}
              >
                <span>{skill.skillName}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center mt-4">
            <p className="text-gray-600 text-sm mb-4 text-center">{t.noSkillsAdded}</p>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center mt-4">
          <p className="text-gray-600 text-sm mb-4 text-center">{t.needProfileForSkills}</p>
          <Link href="/dashboard/profile/create-profile" className="w-full max-w-xs">
            <button
              className="w-full px-6 py-3 rounded-xl text-white font-medium transition-all duration-300 hover:shadow-lg"
              style={{ backgroundColor: 'rgb(5, 22, 80)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {t.createProfile}
            </button>
          </Link>
        </div>
      )}
      <div className="mt-4 flex justify-center">
        {currentProfile ? (
          <Link href="/dashboard/profile" className="w-full max-w-xs block">
            <button
              className="w-full px-6 py-3 rounded-xl text-white font-medium transition-all duration-300 hover:shadow-lg"
              style={{ backgroundColor: 'rgb(5, 22, 80)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgb(15, 32, 90)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgb(5, 22, 80)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {t.updateProfile}
            </button>
          </Link>
        ) : null}
      </div>
    </Card>
  )
}

export default TechnicalSkills
