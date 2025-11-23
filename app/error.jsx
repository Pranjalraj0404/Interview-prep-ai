"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full border-0 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Something went wrong!
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            {error?.message || "An unexpected error occurred. Please try again."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              size="lg"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Try Again
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-indigo-200 hover:bg-indigo-50"
            >
              <Link href="/">
                <Home className="mr-2 h-5 w-5" />
                Go Home
              </Link>
            </Button>
          </div>
          {process.env.NODE_ENV === "development" && error?.stack && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg overflow-auto max-h-64">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                {error.stack}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

