"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface SessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSessionCreated: (sessionId: string, userId: string) => void
}

export function SessionModal({ isOpen, onClose, onSessionCreated }: SessionModalProps) {
  const [userId, setUserId] = useState("")
  const [appName, setAppName] = useState("blockchain-assistant")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const createSession = async () => {
    if (!userId.trim() || !appName.trim()) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appName,
          userId,
          state: {},
          events: [],
        }),
      })

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      let sessionData
      try {
        sessionData = await response.json()
      } catch (parseError) {
        throw new Error("Invalid response format from server")
      }

      // Store in localStorage
      localStorage.setItem("sessionId", sessionData.id)
      localStorage.setItem("userId", userId)
      localStorage.setItem("appName", appName)

      onSessionCreated(sessionData.id, userId)
      onClose()
    } catch (error) {
      console.error("Failed to create session:", error)
      setError(error instanceof Error ? error.message : "Failed to create session. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      createSession()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter your details to start a new AI chat session
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appName">App Name</Label>
            <Input
              id="appName"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="blockchain-assistant"
              className="bg-gray-800 border-gray-600 text-white"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your user ID"
              className="bg-gray-800 border-gray-600 text-white"
              disabled={isLoading}
            />
          </div>

          {error && <div className="text-red-400 text-sm">{error}</div>}

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={createSession}
              disabled={isLoading || !userId.trim() || !appName.trim()}
              className="bg-white text-black hover:bg-gray-200"
            >
              {isLoading ? "Creating..." : "Create Session"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
