"use client"

import React from 'react'
import { useWallet } from '@/contexts/WalletContext'
import { ConnectWalletButton } from '@/components/ui/connect-wallet-button'
import { Wallet, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface WalletProtectionProps {
  children: React.ReactNode
  showConnectButton?: boolean
  className?: string
}

export function WalletProtection({ 
  children, 
  showConnectButton = true,
  className = ""
}: WalletProtectionProps) {
  const { connected, connecting, publicKey } = useWallet()

  if (!connected && !connecting) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className}`}>
        <Card className="bg-black/20 border-white/10 max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center border border-white/20">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-white text-xl">Connect Your Wallet</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <p className="text-amber-200 text-sm">
                Please connect your Solana wallet to access dashboard features
              </p>
            </div>
            <p className="text-white/60 text-sm">
              You need to connect your wallet to view your portfolio, make swaps, and access all features.
            </p>
            {showConnectButton && (
              <div className="pt-2">
                <ConnectWalletButton className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (connecting) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${className}`}>
        <Card className="bg-black/20 border-white/10 max-w-md w-full mx-4">
          <CardContent className="text-center p-8">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center border border-white/20">
              <Wallet className="h-8 w-8 text-white animate-pulse" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Connecting Wallet...</h3>
            <p className="text-white/60 text-sm">
              Please approve the connection in your wallet
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Wallet is connected, render children
  return <>{children}</>
}

// Hook to get the connected wallet address
export function useWalletAddress(): string | null {
  const { connected, publicKey } = useWallet()
  return connected ? publicKey : null
}

// Hook to get wallet address or throw error if not connected
export function useRequiredWalletAddress(): string {
  const { connected, publicKey } = useWallet()
  
  if (!connected || !publicKey) {
    throw new Error('Wallet not connected')
  }
  
  return publicKey
}
