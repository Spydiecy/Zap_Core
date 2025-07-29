"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { Button } from "@/components/ui/button"
import { SessionModal } from "@/components/session-modal"
import { CustomConnectButton } from "@/components/ui/connect-wallet-button"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { CredentialsProvider } from "@/contexts/CredentialsContext"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [appName, setAppName] = useState<string>("")
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    
    // Load session data from localStorage
    const storedSessionId = localStorage.getItem("sessionId")
    const storedUserId = localStorage.getItem("userId")
    const storedAppName = localStorage.getItem("appName")
    
    if (storedSessionId) setSessionId(storedSessionId)
    if (storedUserId) setUserId(storedUserId)
    if (storedAppName) setAppName(storedAppName)
  }, [])

  const handleNewSession = () => {
    setShowSessionModal(true)
  }

  const handleSessionCreated = (newSessionId: string, newUserId: string) => {
    setSessionId(newSessionId)
    setUserId(newUserId)
    setAppName(localStorage.getItem("appName") || "astra-assistant")
    
    // Trigger a custom event to notify the AI chat page to reset
    window.dispatchEvent(new CustomEvent('newSessionCreated', {
      detail: { sessionId: newSessionId, userId: newUserId }
    }))
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <CredentialsProvider>
      <div className="h-screen bg-black text-white flex overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        
        {/* Main Content */}
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          sidebarOpen ? "ml-64" : "ml-20"
        )}>
          {/* Top Header */}
          <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-black/90 backdrop-blur-sm">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">Astra</h1>
              <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded border border-gray-700">
                Testnet
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleNewSession}
                variant="outline"
                size="sm"
                className="border-gray-700 bg-transparent text-white hover:bg-gray-800 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Session
              </Button>
              <CustomConnectButton />
            </div>
          </header>

          {/* Chat Content */}
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
        
        {/* Session Modal */}
        <SessionModal
          isOpen={showSessionModal}
          onClose={() => setShowSessionModal(false)}
          onSessionCreated={handleSessionCreated}
          currentSessionId={sessionId}
          currentUserId={userId}
          currentAppName={appName}
        />
      </div>
    </CredentialsProvider>
  )
}
