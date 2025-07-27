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
      "fixed h-full bg-background/50 dark:bg-background/50 border-r border-border dark:border-white/10 transition-all duration-300 z-20 backdrop-blur-sm shadow-lg",
      open ? "w-64" : "w-16"
    )}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-5 border-b border-border dark:border-white/10">
          <div className={cn("flex items-center", !open && "hidden")}>
            <span className="text-xl font-bold bg-gradient-to-b from-foreground to-foreground/70 dark:from-white dark:to-white/70 text-transparent bg-clip-text">Astra</span>
          </div>
          <button 
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg hover:bg-accent dark:hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className={cn("h-5 w-5 text-muted-foreground dark:text-white/70 transition-transform", !open && "rotate-180")} />
          </button>
        </div>
        
        <div className="flex-1 py-6 overflow-y-auto scrollbar-hide">
          <nav className="px-3 space-y-1">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center px-3 py-3.5 text-sm rounded-lg transition-colors relative group",
                  pathname === route.href
                    ? "bg-accent dark:bg-white/10 text-foreground dark:text-white" 
                    : "text-muted-foreground dark:text-white/60 hover:text-foreground dark:hover:text-white hover:bg-accent dark:hover:bg-white/5",
                  !open && "justify-center"
                )}
              >
                <route.icon className={cn(
                  "h-5 w-5",
                  pathname === route.href ? "text-foreground dark:text-white" : "text-muted-foreground dark:text-white/60"
                )} />
                {open && <span className="ml-3">{route.label}</span>}
                {pathname === route.href && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary dark:bg-white rounded-r-full" />
                )}
                
                {!open && (
                  <div className="absolute left-full ml-2 rounded-md px-2 py-1 bg-popover dark:bg-black/80 text-xs text-popover-foreground dark:text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-border dark:border-white/20">
                    {route.label}
                  </div>
                )}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-border dark:border-white/10">
          <Link href="/" className={cn(
            "flex items-center px-3 py-3 text-sm text-muted-foreground dark:text-white/60 rounded-lg transition-all duration-200 hover:bg-accent dark:hover:bg-white/5 cursor-pointer group relative", 
            !open && "justify-center"
          )}>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent to-accent/50 dark:from-white/20 dark:to-white/5 flex items-center justify-center shadow-inner">
              <ArrowLeft className="h-4 w-4 text-foreground dark:text-white/90" />
            </div>
            {open && <span className="ml-3">Back to Home</span>}
            
            {!open && (
              <div className="absolute left-full ml-2 rounded-md px-2 py-1 bg-popover dark:bg-black/80 text-xs text-popover-foreground dark:text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-border dark:border-white/20">
                Back to Home
              </div>
            )}
          </Link>
        </div>
      </div>
    </div>
  )
}
