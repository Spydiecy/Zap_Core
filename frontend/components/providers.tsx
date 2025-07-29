"use client"

import { CredentialsProvider } from "@/contexts/CredentialsContext"
import { ThemeProvider } from "@/components/ui/theme-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <CredentialsProvider>
        {children}
      </CredentialsProvider>
    </ThemeProvider>
  )
}
