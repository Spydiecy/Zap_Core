"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  MessageSquare, 
  Plus,
  FileText,
  ArrowLeft,
  ChevronLeft
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardSidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export function DashboardSidebar({ open, setOpen }: DashboardSidebarProps) {
  const pathname = usePathname()
  
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
      open ? "w-64" : "w-16"
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
            <ChevronLeft className={cn("h-5 w-5 text-gray-400 transition-transform", !open && "rotate-180")} />
          </button>
        </div>
        
        {/* New Chat Button */}
        <div className="p-4">
          <button 
            onClick={handleNewChat}
            className={cn(
              "flex items-center px-3 py-3 text-sm text-gray-400 rounded-lg transition-colors hover:bg-gray-800 hover:text-white cursor-pointer group relative w-full",
              !open && "justify-center"
            )}
          >
            <Plus className="h-5 w-5" />
            {open && <span className="ml-3">New Chat</span>}
            
            {!open && (
              <div className="absolute left-full ml-2 rounded-md px-2 py-1 bg-gray-800 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-gray-700">
                New Chat
              </div>
            )}
          </button>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className={cn("px-3 space-y-1", open ? "py-4" : "py-6")}>
            {/* AI Chat navigation item removed */}
          </nav>
        </div>
        
        {/* Docs Button */}
        <div className="p-4">
          <Link 
            href="/docs" 
            className={cn(
              "flex items-center px-3 py-3 text-sm text-gray-400 rounded-lg transition-colors hover:bg-gray-800 hover:text-white cursor-pointer group relative",
              !open && "justify-center"
            )}
          >
            <FileText className="h-5 w-5" />
            {open && <span className="ml-3">Docs</span>}
            
            {!open && (
              <div className="absolute left-full ml-2 rounded-md px-2 py-1 bg-gray-800 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-gray-700">
                Docs
              </div>
            )}
          </Link>
        </div>
        
        {/* Back to Home */}
        <div className="p-4 border-t border-gray-800">
          <Link 
            href="/" 
            className={cn(
              "flex items-center px-3 py-3 text-sm text-gray-400 rounded-lg transition-colors hover:bg-gray-800 hover:text-white cursor-pointer group relative",
              !open && "justify-center"
            )}
          >
            <ArrowLeft className="h-5 w-5" />
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
