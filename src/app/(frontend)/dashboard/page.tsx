"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { JSX } from "react";

// Dynamically import dashboard components (lazy loading)
const DashboardHome = dynamic(() => import("@/components/Dashboard/Home"));
const DashboardProfile = dynamic(() => import("@/components/Dashboard/Profile"));
const Availability = dynamic(() => import("@/components/Dashboard/ReUsable/Availability"));

// Contexts & Hooks
import { useDashboard } from "@/context/DashbordContext";

const Dashboard = (): JSX.Element => {
  const { view } = useDashboard();

  const handleSave = (data: any) => {
    console.log("Saved reference data:", data);
  };

  const handleCancel = () => {
    console.log("Reference form cancelled");
  };

  const renderView = () => {
    switch (view) {
      case "home":
        return <DashboardHome />;
      case "profile":
        return <DashboardProfile />;
      case "settings":
        return (
          <>
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <Availability onSave={handleSave} onCancel={handleCancel} />
          </>
        );
      default:
        return <p className="text-red-500">Invalid view selected.</p>;
    }
  };

  return <div className="p-4">{renderView()}</div>;
};

export default Dashboard;