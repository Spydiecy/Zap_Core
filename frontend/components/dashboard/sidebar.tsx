"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { 
  MessageSquare, 
  Plus,
  FileText,
  ArrowLeft,
  ChevronLeft,
  ChevronDown,
  Key,
  Wallet,
  Eye,
  EyeOff
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCredentials } from "@/contexts/CredentialsContext"

interface DashboardSidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function DashboardSidebar({ open, setOpen }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { publicKey, privateKey, setPublicKey, setPrivateKey, hasCredentials, isConfirmed, confirmCredentials } = useCredentials()
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  
  const routes = [
    {
      label: "AI Chat",
      icon: MessageSquare,
      href: "/dashboard/ai-chat"
    }
  ]

  const handleNewChat = () => {
    // Clear chat history and redirect to ai-chat
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard/ai-chat'
    }
  }

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-black border-r border-gray-800 flex flex-col transition-all duration-300",
      open ? "w-64" : "w-20"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-800">
          <div className={cn("flex items-center", !open && "hidden")}>
            <span className="text-xl font-bold text-white">ASTRA</span>
            <span className="text-xs ml-2 px-2 py-1 bg-gray-800 text-gray-300 rounded">v0.1</span>
          </div>
          <button 
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className={cn("h-6 w-6 text-gray-400 transition-transform", !open && "rotate-180")} />
          </button>
        </div>
        
        {/* New Chat Button */}
        <div className={cn("p-4", !open && "px-2")}>
          <button 
            onClick={handleNewChat}
            className={cn(
              "flex items-center px-3 py-3 text-sm text-gray-400 rounded-lg transition-colors hover:bg-gray-800 hover:text-white cursor-pointer group relative w-full",
              !open && "justify-center px-2"
            )}
          >
            <Plus className={cn("h-5 w-5", !open && "h-6 w-6")} />
            {open && <span className="ml-3">New Chat</span>}
            
            {!open && (
              <div className="absolute left-full ml-2 rounded-md px-2 py-1 bg-gray-800 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-gray-700">
                New Chat
              </div>
            )}
          </button>
        </div>
        
        {/* Docs Button - Moved here, right below New Chat */}
        <div className={cn("px-4 pb-4", !open && "px-2")}>
          <Link 
            href="/docs" 
            className={cn(
              "flex items-center px-3 py-3 text-sm text-gray-400 rounded-lg transition-colors hover:bg-gray-800 hover:text-white cursor-pointer group relative",
              !open && "justify-center px-2"
            )}
          >
            <FileText className={cn("h-5 w-5", !open && "h-6 w-6")} />
            {open && <span className="ml-3">Docs</span>}
            
            {!open && (
              <div className="absolute left-full ml-2 rounded-md px-2 py-1 bg-gray-800 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-gray-700">
                Docs
              </div>
            )}
          </Link>
        </div>
        
        {/* Spacer */}
        <div className="flex-1"></div>
        
        {/* Wallet Credentials Section - Moved to bottom */}
        <div className={cn("px-4 py-4 border-t border-gray-800", !open && "px-2")}>
          {open && (
            <div className="space-y-4">
              {/* Credentials Header with Toggle */}
              <button
                onClick={() => setShowCredentials(!showCredentials)}
                className="flex items-center justify-between w-full text-left group"
              >
                <div className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Wallet Credentials</span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-gray-400 transition-transform",
                  showCredentials && "rotate-180"
                )} />
              </button>
              
              {/* Credentials Status - Always visible */}
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConfirmed ? "bg-green-500" : hasCredentials ? "bg-yellow-500" : "bg-red-500"
                )} />
                <span className="text-xs text-gray-400">
                  {isConfirmed ? "Credentials Confirmed" : hasCredentials ? "Credentials Set (Unconfirmed)" : "Missing Credentials"}
                </span>
              </div>
              
              {/* Collapsible Credentials Form */}
              {showCredentials && (
                <div className="space-y-4 pt-2">
                  {/* Public Key Input */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 flex items-center space-x-1">
                      <Key className="h-3 w-3" />
                      <span>Public Key</span>
                    </label>
                    <input
                      type="text"
                      value={publicKey}
                      onChange={(e) => setPublicKey(e.target.value)}
                      placeholder="Enter your wallet public key..."
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                    />
                  </div>
                  
                  {/* Private Key Input */}
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 flex items-center space-x-1">
                      <Key className="h-3 w-3" />
                      <span>Private Key</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPrivateKey ? "text" : "password"}
                        value={privateKey}
                        onChange={(e) => setPrivateKey(e.target.value)}
                        placeholder="Enter your wallet private key..."
                        className="w-full px-3 py-2 pr-10 bg-gray-900 border border-gray-700 rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  {/* Confirm Button - only show when both credentials are entered and not confirmed */}
                  {publicKey && privateKey && !isConfirmed && (
                    <div className="pt-3">
                      <button
                        onClick={() => {
                          confirmCredentials()
                          
                          // Trigger a custom event to notify that credentials are confirmed
                          window.dispatchEvent(new CustomEvent('credentialsConfirmed', {
                            detail: { publicKey, privateKey }
                          }))
                          
                          // Show a brief confirmation message
                          const confirmMessage = document.createElement('div')
                          confirmMessage.textContent = '✓ Credentials confirmed!'
                          confirmMessage.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg z-50 text-sm'
                          document.body.appendChild(confirmMessage)
                          
                          setTimeout(() => {
                            document.body.removeChild(confirmMessage)
                          }, 2000)
                          
                          // Auto-collapse the credentials section after confirmation
                          setTimeout(() => {
                            setShowCredentials(false)
                          }, 2500)
                        }}
                        className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                      >
                        Confirm Credentials
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {!open && (
            <div className="flex justify-center">
              <div className={cn(
                "w-4 h-4 rounded-full",
                isConfirmed ? "bg-green-500" : hasCredentials ? "bg-yellow-500" : "bg-red-500"
              )} />
            </div>
          )}
        </div>
        
        {/* Back to Home */}
        <div className={cn("px-4 pt-2 pb-4 border-t border-gray-800", !open && "px-2")}>
          <Link 
            href="/" 
            className={cn(
              "flex items-center px-3 py-3 text-sm text-gray-400 rounded-lg transition-colors hover:bg-gray-800 hover:text-white cursor-pointer group relative",
              !open && "justify-center px-2"
            )}
          >
            <ArrowLeft className={cn("h-5 w-5", !open && "h-6 w-6")} />
            {open && <span className="ml-3">Back to Home</span>}
            
            {!open && (
              <div className="absolute left-full ml-2 rounded-md px-2 py-1 bg-gray-800 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-gray-700">
                Back to Home
              </div>
            )}
          </Link>
        </div>
      </div>
    </div>
  )
}
