// GUARDRAIL: This is the root layout - DO NOT DELETE OR MODIFY STRUCTURE
// All pages inherit from this layout
import React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/providers/auth-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Interview Prep AI",
  description: "AI-powered interview preparation platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
