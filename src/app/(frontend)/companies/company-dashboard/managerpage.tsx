"use client"

import type { JSX } from "react"
import dynamic from "next/dynamic"
import { useManagerDashboard } from "@/components/Dashboard/Company-dashboard/manager/ManagerDashboardContext"
import Reports from "@/components/Dashboard/Company-dashboard/manager/views/Reports"
import EmployeeProfiles from "@/components/Dashboard/Company-dashboard/manager/views/Employeeprofiles"
import CVCreator from "@/components/Dashboard/Company-dashboard/manager/views/Cvcreator"
import EmployeePortfolios from "@/components/Dashboard/Company-dashboard/manager/views/Employeeportfolios"
import EmployeeAdministration from "@/components/Dashboard/Company-dashboard/manager/views/Employeeadministration"
import ManagerSettings from "@/components/Dashboard/Company-dashboard/manager/views/Managersettings"
import ManagerCVCreator from "@/components/Dashboard/Company-dashboard/manager/views/Managercvcreator"
import ManagerfeatureRequest from "@/components/Dashboard/Company-dashboard/manager/views/managerfeatureRequest"
import ManagerHelpSupport from "@/components/Dashboard/Company-dashboard/manager/views/Managerhelpsupport"
import ManagerInvitation from "@/components/Dashboard/Company-dashboard/manager/views/Managerinvitation"
import EmployeeAvailability from "@/components/Dashboard/Company-dashboard/manager/views/Employeeavailability"
import ManagerContracts from "@/components/Dashboard/Company-dashboard/manager/views/ManagerContracts"
import ManagerInterviews from "@/components/Dashboard/Company-dashboard/manager/views/ManagerInterviews"
import ManagerContractEditor from "@/components/Dashboard/Company-dashboard/manager/views/ManagerContractEditor"
import ManagerContractTemplates from "@/components/Dashboard/Company-dashboard/manager/views/ManagerContractTemplates"
// Others → My contracts: contracts the business admin sent to this manager
import ManagerMyContracts from "@/components/Dashboard/Company-dashboard/manager/views/ManagerMyContracts"
// Others → My availability: working week, status and days-off requests
import ManagerMyAvailability from "@/components/Dashboard/Company-dashboard/manager/views/ManagerMyAvailability"
import ChatPage from "@/components/Dashboard/Company-dashboard/chat/ChatPage"

const ManagerHome = dynamic(
  () => import("@/components/Dashboard/Company-dashboard/manager/ManagerHome")
)

const ManagerDashboardPage = (): JSX.Element => {
  const { view, language } = useManagerDashboard()

  const renderView = () => {
    switch (view) {
      case "home":
        return <ManagerHome />
      case "employee_profiles":
        return <EmployeeProfiles />
      case "cv_creator":
        return <CVCreator />
      case "availability":
        return <EmployeeAvailability />
      case "portfolios":
        return <EmployeePortfolios />
      case "administration":
        return <EmployeeAdministration />
      case "reports":
        return <Reports />
      case "account":
        return <ManagerSettings />
      case "manager_cv_creator":
        return <ManagerCVCreator />
      case "feature_request":
        return <ManagerfeatureRequest />
      case "help":
        return <ManagerHelpSupport />
      case "invitation":
        return <ManagerInvitation />
      case "contracts":
        return <ManagerContracts />
      case "contract_editor":
        return <ManagerContractEditor />
      case "contract_templates":
        return <ManagerContractTemplates />
      case "interviews":
        return <ManagerInterviews />
      case "chat":
        return <ChatPage />
      case "my_contracts":
        return <ManagerMyContracts />
      case "my_availability":
        return <ManagerMyAvailability />
      default:
        return <p className="text-red-500">Invalid view selected.</p>
    }
  }

  return <div className="p-4">{renderView()}</div>
}

export default ManagerDashboardPage
