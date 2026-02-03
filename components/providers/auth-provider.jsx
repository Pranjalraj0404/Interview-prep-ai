"use client"

import React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      // Verify token and get user data
      fetchUserProfile(token)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch("/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        // Only remove token if it's an auth error (401/403)
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token")
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      // Do not remove token on network errors
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        const error = JSON.parse(text)
        throw new Error(error.message || "Login failed")
      } catch {
        throw new Error(text || "Login failed")
      }
    }

    const data = await response.json()
    localStorage.setItem("token", data.token)
    setUser(data)
    router.push("/dashboard")
  }

  const register = async (name, email, password) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    })

    if (!response.ok) {
      const text = await response.text()
      try {
        const error = JSON.parse(text)
        throw new Error(error.message || "Registration failed")
      } catch {
        throw new Error(text || "Registration failed")
      }
    }

    const data = await response.json()
    localStorage.setItem("token", data.token)
    setUser(data)
    router.push("/dashboard")
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
    router.push("/")
  }

  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
