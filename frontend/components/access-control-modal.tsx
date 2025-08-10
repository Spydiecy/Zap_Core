"use client"

import React, { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { Wallet, Shield, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccessControlModalProps {
  isOpen: boolean
  onAccessGranted: () => void
}

export function AccessControlModal({ isOpen, onAccessGranted }: AccessControlModalProps) {
  const { theme } = useTheme()
  const { address, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)

  const isDark = theme === 'dark'

  // Ensure component is mounted before rendering to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check access when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      onAccessGranted()
    }
  }, [isConnected, address, onAccessGranted])

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className={cn(
        "max-w-md mx-auto border transition-colors duration-300",
        isDark 
          ? "bg-black border-gray-800 text-white" 
          : "bg-white border-gray-300 text-black"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl font-semibold">
            <Shield className={cn("w-6 h-6", isDark ? "text-gray-400" : "text-gray-600")} />
            <span>Platform Access</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Access Info */}
          <div className={cn(
            "rounded-lg p-4 border",
            isDark 
              ? "bg-gray-900/50 border-gray-700" 
              : "bg-gray-100/50 border-gray-300"
          )}>
            <h3 className="text-lg font-medium mb-2">Wallet Connection Required</h3>
            <p className={cn("text-sm mb-4", isDark ? "text-gray-400" : "text-gray-600")}>
              Connect your wallet to access Astra AI Assistant on X Layer Testnet.
            </p>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className={cn(isDark ? "text-gray-300" : "text-gray-700")}>Access fee: 0.01 OKB</span>
            </div>
            <div className="flex items-center space-x-2 text-sm mt-1">
              <div className={cn("w-2 h-2 rounded-full", isDark ? "bg-gray-400" : "bg-gray-600")}></div>
              <span className={cn(isDark ? "text-gray-300" : "text-gray-700")}>X Layer Testnet</span>
            </div>
          </div>

          {/* Wallet Connection */}
          {!isConnected ? (
            <div className="space-y-4">
              <div className={cn("flex items-center space-x-2", isDark ? "text-gray-300" : "text-gray-700")}>
                <Wallet className="w-5 h-5" />
                <span>Connect your wallet to continue</span>
              </div>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connected Wallet */}
              <div className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                isDark 
                  ? "bg-gray-900/50 border-gray-700" 
                  : "bg-gray-100/50 border-gray-300"
              )}>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Wallet Connected</span>
                </div>
                <span className={cn("text-xs font-mono", isDark ? "text-gray-400" : "text-gray-600")}>
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>

              {/* Access Granted */}
              <div className={cn(
                "flex items-center justify-center space-x-2 p-3 rounded-lg border",
                isDark 
                  ? "bg-green-900/20 border-green-700" 
                  : "bg-green-100/50 border-green-300"
              )}>
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400">Access granted! Redirecting...</span>
              </div>
            </div>
          )}

          {/* Network Info */}
          <div className={cn(
            "text-xs text-center p-3 rounded border",
            isDark 
              ? "text-gray-500 bg-gray-900/30 border-gray-800" 
              : "text-gray-600 bg-gray-100/30 border-gray-300"
          )}>
            <p>Make sure you're connected to X Layer Testnet</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
