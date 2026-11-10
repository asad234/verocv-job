"use client"

// ══════════════════════════════════════════════════════════════════════
// FILE LOCATION:  src/components/Dashboard/Company-dashboard/admin/views/AdminManagerContracts.tsx
// WHAT IT DOES:   Business admin → Managers → Contracts (view "manager_contracts").
//   The SAME contract pages the managers use for their employees — list, editor
//   (AI / reference files, logo), send for signing, counter-sign, PDF, renew/extend/
//   terminate, reference files — but:
//     • the person picker lists YOUR MANAGERS (the people you hire)
//     • everything is saved as YOUR contracts (admin = employer side)
//
//   LANGUAGE: the whole page follows the business admin language
//   (useBusinessAdminTranslations — localStorage "businessAdminLanguage").
//   The reused manager pages read their texts from useManagerTranslations, so the
//   admin language is pushed into that hook as well — whenever it changes.
//
//   Requests: adminContractsBridge.ts points the manager pages to /api/company/admin/...
// ══════════════════════════════════════════════════════════════════════

import { useEffect } from "react"
import { Icon } from "@iconify/react"
import { useBusinessAdminTranslations } from "@/utils/Businessadmintranslations"
import { useManagerTranslations } from "@/utils/Managertranslations"
import { installAdminContractsBridge } from "@/utils/adminContractsBridge"
import {
  ManagerDashboardProvider,
  useManagerDashboard,
} from "@/components/Dashboard/Company-dashboard/manager/ManagerDashboardContext"
import ManagerContracts from "@/components/Dashboard/Company-dashboard/manager/views/ManagerContracts"
import ManagerContractEditor from "@/components/Dashboard/Company-dashboard/manager/views/ManagerContractEditor"
import ManagerContractTemplates from "@/components/Dashboard/Company-dashboard/manager/views/ManagerContractTemplates"

// Before any child mounts, so their first requests already go to the admin API.
installAdminContractsBridge()

const CONTRACT_VIEWS = ["contracts", "contract_editor", "contract_templates"] as const

/** Keeps the manager pages' language equal to the admin language. */
function useFollowAdminLanguage() {
  const { language, isInitialized } = useBusinessAdminTranslations()
  const { language: managerLanguage, setLanguage: setManagerLanguage } = useManagerTranslations()
  const { setLanguage: setProviderLanguage } = useManagerDashboard()

  useEffect(() => {
    if (!isInitialized) return // wait until the saved admin language is read
    setProviderLanguage(language)
    if (managerLanguage !== language) setManagerLanguage(language)
  }, [isInitialized, language, managerLanguage, setManagerLanguage, setProviderLanguage])
}

function ContractPages() {
  const { view, setView } = useManagerDashboard()
  useFollowAdminLanguage()

  // The manager pages may navigate elsewhere (e.g. "home") — stay on the contract list.
  useEffect(() => {
    if (!(CONTRACT_VIEWS as readonly string[]).includes(view)) setView("contracts")
  }, [view, setView])

  if (view === "contract_editor") return <ManagerContractEditor />
  if (view === "contract_templates") return <ManagerContractTemplates />
  return <ManagerContracts />
}

export default function AdminManagerContracts() {
  const { t } = useBusinessAdminTranslations()

  return (
    <div>
      <div className="max-w-7xl mx-auto mb-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-950">
        <Icon icon="tabler:briefcase" className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <p>
          <span className="font-semibold">{t.managerContractsTitle}</span> {t.managerContractsDesc}
        </p>
      </div>
      <ManagerDashboardProvider>
        <ContractPages />
      </ManagerDashboardProvider>
    </div>
  )
}
