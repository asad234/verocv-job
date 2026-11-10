"use client"

import type { JSX } from "react"
import { useBusinessAdmin } from "@/components/Dashboard/Company-dashboard/admin/Businessadmincontext"
import BusinessAdminHome from "@/components/Dashboard/Company-dashboard/admin/Businessadminhome"
import CreateManager from "@/components/Dashboard/Company-dashboard/admin/views/Createmanager"
import ManagersList from "@/components/Dashboard/Company-dashboard/admin/views/Managerslist"
import ManagerProfile from "@/components/Dashboard/Company-dashboard/admin/views/ManagerProfile"
import ManagerEdit from "@/components/Dashboard/Company-dashboard/admin/views/ManagerEdit"
import AdminManagerContracts from "@/components/Dashboard/Company-dashboard/admin/views/AdminManagerContracts"
import AdminManagerInterviews from "@/components/Dashboard/Company-dashboard/admin/views/AdminManagerInterviews"
import ManagerAvailability from "@/components/Dashboard/Company-dashboard/admin/views/Manageravailability"
import EmployeesView from "@/components/Dashboard/Company-dashboard/admin/views/EmployeesView"
import EmployeeProfile from "@/components/Dashboard/Company-dashboard/admin/views/EmployeeProfile"
import AdminReports from "@/components/Dashboard/Company-dashboard/admin/views/Adminreports"
// Settings → Account / Help & Support are views now (moved into admin/views).
import BusinessAdminSettings from "@/components/Dashboard/Company-dashboard/admin/views/Businessadminsettings"
import AdminHelpAndSupport from "@/components/Dashboard/Company-dashboard/admin/views/AdminHelpAndSupport"
import FeatureRequest from "@/components/Dashboard/Company-dashboard/admin/views/featureRequest"
import AdminChats from "@/components/Dashboard/Company-dashboard/chat/AdminChats"


const BusinessAdminPage = (): JSX.Element => {
  const { view, chatWithUserId } = useBusinessAdmin()

  const renderView = () => {
    switch (view) {
      case "home": return <BusinessAdminHome />
      case "create_manager": return <CreateManager />
      case "managers_list": return <ManagersList />
      case "manager_profile": return <ManagerProfile />
      case "manager_edit": return <ManagerEdit />
      case "manager_contracts": return <AdminManagerContracts />
      case "availability": return <ManagerAvailability />
      case "employees": return <EmployeesView />
      case "employee_profile": return <EmployeeProfile />
      case "interviews": return <AdminManagerInterviews />
      case "reports": return <AdminReports />
      case "chat": return <AdminChats startWithUserId={chatWithUserId} />
      case "feature_request": return <FeatureRequest />
      case "account": return <BusinessAdminSettings />
      case "help": return <AdminHelpAndSupport />
      default: return <p className="text-red-500">Invalid view selected.</p>
    }
  }

  return <div className="p-4">{renderView()}</div>
}

export default BusinessAdminPage
