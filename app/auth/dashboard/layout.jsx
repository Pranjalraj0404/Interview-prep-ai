// GUARDRAIL: This layout is required for /auth/dashboard - DO NOT DELETE
import React from "react"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"

export default function Layout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>
}

