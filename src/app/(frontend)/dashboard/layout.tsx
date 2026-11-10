"use client";
import { ReactNode } from "react";
import DashboardLayout from "@/components/Dashboard/LayoutDashboard";

export default function DashboardLayoutWrapper({
    children,
}: {
    children: ReactNode;
}) {
    return <DashboardLayout>{children}</DashboardLayout>;
}