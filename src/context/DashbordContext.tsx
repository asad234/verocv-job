import { createContext, useContext, useState } from "react";

type ViewType = "home" | "profile" | "portfolios" | "details" | "cv" | "employees" | "teams" | "overview" | "settings";

type DashboardContextType = {
  view: ViewType;
  setView: (view: ViewType) => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: React.ReactNode }) => {
  const [view, setView] = useState<ViewType>("home");

  return (
    <DashboardContext.Provider value={{ view, setView }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};