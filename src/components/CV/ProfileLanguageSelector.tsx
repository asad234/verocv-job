"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Icon } from "@iconify/react"
import { Loader2, ChevronDown } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileSummary {
  id: number | string
  language: string
  createdAt: string
  isMain: boolean
}

interface ProfileData {
  id: number | string
  language: string
  personalInformation?: any
  profileDetails?: {
    projectDetails?: any[]
    skills?: any[]
    employers?: any[]
    education?: any[]
    certifications?: any[]
    languages?: any[]
    references?: any[]
  }
}

interface Props {
  /** Called when the user selects a profile — pass the fetched profile data up to CVBuilder */
  onProfileLoaded: (profile: ProfileData) => void
  /** Currently active profile id (so the selector can highlight it) */
  activeProfileId?: number | string | null
}

const LANG_META: Record<string, { name: string; flag: string }> = {
  en: { name: "English", flag: "emojione:flag-for-united-kingdom" },
  sv: { name: "Swedish", flag: "emojione:flag-for-sweden" },
}

function getLangMeta(lang: string) {
  return LANG_META[lang] ?? { name: lang, flag: "mdi:translate" }
}

// Main profile = oldest by createdAt
function getMainId(profiles: ProfileSummary[]): string | number | null {
  if (!profiles.length) return null
  return profiles.reduce((a, b) =>
    new Date(a.createdAt) <= new Date(b.createdAt) ? a : b
  ).id
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileLanguageSelector({ onProfileLoaded, activeProfileId }: Props) {
  const { data: session } = useSession()
  const [profiles, setProfiles] = useState<ProfileSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [open, setOpen] = useState(false)

  // ── Fetch profile list on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!session?.user?.id) return
    setLoading(true)
    fetch(`/api/profile?where[user][equals]=${session.user.id}&limit=20&depth=0`)
      .then(r => r.json())
      .then(data => {
        const docs: any[] = data.docs ?? []
        const mainId = docs.length
          ? docs.reduce((a: any, b: any) =>
            new Date(a.createdAt) <= new Date(b.createdAt) ? a : b
          ).id
          : null

        setProfiles(docs.map(p => ({
          id: p.id,
          language: p.language,
          createdAt: p.createdAt,
          isMain: p.id === mainId,
        })))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [session?.user?.id])

  // ── Load a specific profile by ID ────────────────────────────────────────
  const loadProfile = useCallback(async (profileId: number | string) => {
    setSwitching(true)
    setOpen(false)
    try {
      const res = await fetch(`/api/profile/${profileId}`)
      if (!res.ok) throw new Error(`Failed to load profile ${profileId}`)
      const data: ProfileData = await res.json()
      onProfileLoaded(data)
    } catch (e) {
      console.error("[ProfileLanguageSelector]", e)
    } finally {
      setSwitching(false)
    }
  }, [onProfileLoaded])

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-gray-200 bg-white text-xs text-gray-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading profiles…
      </div>
    )
  }

  // Only show if the user has more than one profile
  if (profiles.length <= 1) return null

  const active = profiles.find(p => p.id === activeProfileId) ?? profiles[0]!
  const activeMeta = getLangMeta(active.language)

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        disabled={switching}
        className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 shadow-sm disabled:opacity-60"
        title="Switch profile language"
      >
        {switching ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        ) : (
          <Icon icon={activeMeta.flag} className="w-5 h-5" />
        )}
        <span className="hidden sm:inline">{activeMeta.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1.5 z-20 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[180px]">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Profile language
              </p>
            </div>
            {profiles.map(profile => {
              const meta = getLangMeta(profile.language)
              const isActive = profile.id === (activeProfileId ?? profiles[0]?.id)
              return (
                <button
                  key={profile.id}
                  onClick={() => loadProfile(profile.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors ${isActive
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-gray-50 text-gray-700"
                    }`}
                >
                  <Icon icon={meta.flag} className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{meta.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {profile.isMain ? "Main profile" : "Translated copy"}
                    </p>
                  </div>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
