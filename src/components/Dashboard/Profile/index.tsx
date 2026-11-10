"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Icon } from "@iconify/react"
import { useRouter } from "next/navigation"
import { Loader2, Languages, Trash2, AlertCircle, CheckCircle2, X } from "lucide-react"
import Card from "../ReUsable/Card"
import { useDashboardTranslations } from "@/hooks/useDashboardTranslation"
import NavigationGuard from "@/utils/navigationGuard"

type SupportedLanguage = "en" | "sv"

const LANGUAGE_META: Record<SupportedLanguage, { name: string; flag: string }> = {
  en: { name: "English", flag: "emojione:flag-for-united-kingdom" },
  sv: { name: "Swedish", flag: "emojione:flag-for-sweden" },
}

interface ProfileDoc {
  id: number | string
  language: string
  createdAt: string
  updatedAt: string
  personalInformation?: { firstName?: string; lastName?: string; title?: string }
}

function getLangMeta(language: string) {
  return LANGUAGE_META[language as SupportedLanguage] ?? { name: language, flag: "mdi:translate" }
}

function getMainProfile(profiles: ProfileDoc[]): ProfileDoc | null {
  if (profiles.length === 0) return null
  return profiles.reduce((a, b) =>
    new Date(a.createdAt) <= new Date(b.createdAt) ? a : b
  )
}

// ─── TranslateModal ───────────────────────────────────────────────────────────

function TranslateModal({
  mainProfile, existingLanguages, onClose, onCreated,
}: {
  mainProfile: ProfileDoc
  existingLanguages: string[]
  onClose: () => void
  onCreated: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useDashboardTranslations()

  const targetLang: SupportedLanguage = mainProfile.language === "sv" ? "en" : "sv"
  const alreadyExists = existingLanguages.some(
    l => l !== mainProfile.language && l === targetLang
  )
  const mainMeta = getLangMeta(mainProfile.language)
  const targetMeta = getLangMeta(targetLang)

  // Language names for display — use translation keys if available, else fallback
  const mainLangName = mainProfile.language === "sv"
    ? (t.swedish ?? "Swedish")
    : (t.english ?? "English")
  const targetLangName = targetLang === "sv"
    ? (t.swedish ?? "Swedish")
    : (t.english ?? "English")

  async function handleCreate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/profile/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceProfileId: mainProfile.id,
          targetLanguage: targetLang,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? (t.translationFailed ?? "Translation failed"))
      onCreated()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgba(5,22,80,0.1)" }}>
              <Languages className="w-5 h-5" style={{ color: "rgb(5,22,80)" }} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {t.createTranslatedProfile ?? "Create translated profile"}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {(t.translateProfileDescription ?? "AI will copy your {source} profile and translate it into {target}")
                  .replace("{source}", mainLangName)
                  .replace("{target}", targetLangName)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4">
            <X className="w-5 h-5" />
          </button>
        </div>

        {alreadyExists ? (
          <div className="flex items-center gap-2 p-4 bg-amber-50 text-amber-700 rounded-lg text-sm mb-5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {(t.alreadyHaveProfileInLanguage ?? "You already have a {lang} profile. Delete it first to re-translate.")
              .replace("{lang}", targetLangName)}
          </div>
        ) : (
          <div className="space-y-3 mb-5">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <Icon icon={mainMeta.flag} className="w-6 h-6 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">
                  {mainLangName} — {t.mainProfileUnchanged ?? "main profile (unchanged)"}
                </p>
                <p className="text-xs text-gray-400">
                  {t.thisProfileWillNotBeTouched ?? "This profile will not be touched"}
                </p>
              </div>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                {t.source ?? "Source"}
              </span>
            </div>

            <div className="flex justify-center text-gray-400 text-sm">
              {t.aiTranslatesAllText ?? "↓ AI translates all text ↓"}
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-blue-500 bg-blue-50">
              <Icon icon={targetMeta.flag} className="w-6 h-6 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                  {targetLangName} — {t.newProfile ?? "new profile"}
                </p>
                <p className="text-xs text-gray-500">
                  {t.translateProfileDetails ?? "Titles, descriptions, skills — all translated. Names, dates, URLs stay as-is."}
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
            {t.cancel}
          </button>
          <button
            onClick={handleCreate}
            disabled={alreadyExists || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "rgb(5,22,80)" }}
            onMouseEnter={(e) => { if (!loading && !alreadyExists) e.currentTarget.style.backgroundColor = "rgb(15,32,90)" }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgb(5,22,80)" }}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.translating ?? "Translating…"}</>
              : <><Languages className="w-4 h-4" /> {(t.createLanguageProfile ?? "Create {lang} profile").replace("{lang}", targetLangName)}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ProfileCard ──────────────────────────────────────────────────────────────

function ProfileCard({
  profile, isMain, onEdit, onDelete, onTranslate,
}: {
  profile: ProfileDoc
  isMain: boolean
  onEdit: () => void
  onDelete: () => void
  onTranslate: () => void
}) {
  const { t } = useDashboardTranslations()
  const meta = getLangMeta(profile.language)
  const pi = typeof profile.personalInformation === "object"
    ? (profile.personalInformation ?? {})
    : {}
  const displayName = pi.firstName && pi.lastName
    ? `${pi.firstName} ${pi.lastName}`
    : null

  const langName = profile.language === "sv"
    ? (t.swedish ?? "Swedish")
    : (t.english ?? "English")

  return (
    <Card className="p-6 border border-gray-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full sm:p-4"
            style={{ backgroundColor: "rgb(176,196,222,0.3)" }}>
            <Icon icon={meta.flag} className="w-8 h-8 sm:w-10 sm:h-10"
              style={{ color: "rgb(5,22,80)" }} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-medium">
                {(t.languageProfile ?? "{lang} Profile").replace("{lang}", langName)}
              </h3>
              {isMain && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: "rgb(5,22,80)" }}>
                  {t.main ?? "Main"}
                </span>
              )}
              {!isMain && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  {t.translatedCopy ?? "Translated copy"}
                </span>
              )}
            </div>
            {displayName && (
              <p className="text-sm text-gray-600">
                {displayName}{pi.title ? ` · ${pi.title}` : ""}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {t.created ?? "Created"} {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {isMain && (
            <button onClick={onTranslate}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm border border-gray-300 hover:bg-gray-50 transition-colors">
              <Languages className="w-4 h-4" /> {t.translate ?? "Translate"}
            </button>
          )}
          <button onClick={onEdit}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white transition-colors"
            style={{ backgroundColor: "rgb(5,22,80)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(15,32,90)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgb(5,22,80)")}>
            <Icon icon="mdi:pencil" className="w-4 h-4" /> {t.edit ?? "Edit"}
          </button>
          {!isMain && (
            <button onClick={onDelete}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4" /> {t.delete}
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const DashboardProfile = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const { t } = useDashboardTranslations()

  const [profiles, setProfiles] = useState<ProfileDoc[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showTranslateModal, setShowTranslateModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProfiles = async () => {
    if (!session?.user?.id) return
    setIsLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(
        `/api/profile?where[user][equals]=${session.user.id}&limit=20&depth=1`
      )
      if (!res.ok) throw new Error("Failed to load profiles")
      const data = await res.json()
      setProfiles(data.docs ?? [])
    } catch (e: any) {
      setLoadError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id])

  const handleDelete = async (id: string | number) => {
    setDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/profile/${id}`, { method: "DELETE" })
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Delete failed (${res.status})`)
      }
      setDeleteConfirm(null)
      await fetchProfiles()
    } catch (e: any) {
      setDeleteError(e.message)
    } finally {
      setDeleting(false)
    }
  }

  const mainProfile = getMainProfile(profiles)
  const existingLanguages = profiles.map((p) => p.language)
  const sortedProfiles = [...profiles].sort((a, b) => {
    if (a.id === mainProfile?.id) return -1
    if (b.id === mainProfile?.id) return 1
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  const mainLangName = mainProfile?.language === "sv"
    ? (t.swedish ?? "Swedish")
    : (t.english ?? "English")
  const otherLangName = mainProfile?.language === "sv"
    ? (t.english ?? "English")
    : (t.swedish ?? "Swedish")

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: "rgb(5,22,80)" }} />
        <p className="text-gray-600">{t.loadingProfile}</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="font-medium">{t.errorLoadingProfile}</p>
          <p className="text-sm">{loadError}</p>
        </div>
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <>
        <NavigationGuard />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: "rgb(176,196,222,0.3)" }}>
              <Icon icon="mdi:profile-outline" className="w-8 h-8" style={{ color: "rgb(5,22,80)" }} />
            </div>
            <h2 className="text-3xl font-semibold text-gray-800 mb-4">{t.noProfileYet}</h2>
            <p className="text-gray-600 mb-6">{t.noProfileDescription}</p>
            <div className="flex justify-center">
              <button
                onClick={() => router.push("/dashboard/profile/create-profile")}
                className="flex items-center gap-2 text-white font-medium py-2 px-4 rounded-md transition-colors"
                style={{ backgroundColor: "rgb(5,22,80)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgb(15,32,90)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgb(5,22,80)")}>
                <Icon icon="mdi:plus" className="w-5 h-5" />
                {t.createProfile}
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {showTranslateModal && mainProfile && (
        <TranslateModal
          mainProfile={mainProfile}
          existingLanguages={existingLanguages}
          onClose={() => setShowTranslateModal(false)}
          onCreated={async () => {
            setShowTranslateModal(false)
            await fetchProfiles()
          }}
        />
      )}

      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 mb-2">
              {t.deleteThisProfile ?? "Delete this profile?"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {t.deleteTranslatedCopyNote ?? "This will permanently remove the translated copy. Your main profile is unaffected."}
            </p>
            {deleteError && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {deleteError}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setDeleteConfirm(null); setDeleteError(null) }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
                {t.cancel}
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-60">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {t.delete ?? "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">{t.yourProfile}</h2>
      </div>

      <div className="space-y-4">
        {sortedProfiles.map((profile) => {
          const isMain = profile.id === mainProfile?.id
          return (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isMain={isMain}
              onEdit={() => router.push(`/dashboard/profile/edit/${profile.id}`)}
              onDelete={() => { setDeleteError(null); setDeleteConfirm(profile.id) }}
              onTranslate={() => setShowTranslateModal(true)}
            />
          )
        })}
      </div>

      <div className="mt-6 p-4 rounded-lg text-sm"
        style={{ backgroundColor: "rgba(176,196,222,0.15)", color: "rgb(5,22,80)" }}>
        <strong>{t.tip ?? "Tip"}:</strong>{" "}
        {(t.profileTipText ?? "Your {mainLang} profile is your main profile and will never be modified. Use {translate} to generate a {otherLang} copy.")
          .replace("{mainLang}", mainLangName)
          .replace("{translate}", t.translate ?? "Translate")
          .replace("{otherLang}", otherLangName)}
      </div>
    </div>
  )
}

export default DashboardProfile
