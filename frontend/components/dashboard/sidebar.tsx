"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  ChevronLeft, 
  MessageSquare, 
  ArrowLeft
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

  return (
    <div className={cn(
      "fixed h-full bg-gray-900 border-r border-gray-800 transition-all duration-300 z-20",
      open ? "w-64" : "w-16"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className={cn("flex items-center", !open && "hidden")}>
            <span className="text-xl font-bold text-white">ASTRA</span>
            <span className="text-xs ml-2 text-gray-400">v0.0.2</span>
          </div>
          <button 
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className={cn("h-5 w-5 text-gray-400 transition-transform", !open && "rotate-180")} />
          </button>
        </div>
        
        {/* New Chat Button */}
        {open && (
          <div className="p-4 border-b border-gray-800">
            <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-white text-sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              New Chat
            </button>
          </div>
        )}
        
        {/* Navigation */}
        <div className="flex-1 py-6 overflow-y-auto">
          <nav className="px-3 space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center px-3 py-3 text-sm rounded-lg transition-colors relative group",
                  pathname === route.href
                    ? "bg-gray-800 text-white" 
                    : "text-gray-400 hover:text-white hover:bg-gray-800",
                  !open && "justify-center"
                )}
              >
                <route.icon className="h-5 w-5" />
                {open && <span className="ml-3">{route.label}</span>}
                
                {!open && (
                  <div className="absolute left-full ml-2 rounded-md px-2 py-1 bg-gray-800 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-gray-700">
                    {route.label}
                  </div>
                )}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Back to Home */}
        <div className="p-4 border-t border-gray-800">
          <Link href="/" className={cn(
            "flex items-center px-3 py-3 text-sm text-gray-400 rounded-lg transition-colors hover:bg-gray-800 hover:text-white cursor-pointer group relative", 
            !open && "justify-center"
          )}>
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
