"use client"

import { useWallet } from "@/contexts/WalletContext"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function ConnectWalletButton({ className }: { className?: string }) {
  const { connectWallet, disconnectWallet, connected, connecting, publicKey } = useWallet()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const truncateAddress = (address?: string | null) => {
    if (!address) return ""
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }
  
  const handleConnect = async () => {
    await connectWallet()
  }
  
  const handleDisconnect = async () => {
    await disconnectWallet()
    setIsDropdownOpen(false)
  }
  
  if (connected && publicKey) {
    return (
      <div className="relative">
        <Button 
          variant="outline"
          size="sm"
          className={cn(
            "border-white/20 bg-black/30 backdrop-blur-sm hover:bg-white/10",
            "flex items-center gap-2", 
            className
          )}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <svg width="16" height="16" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-500">
            <rect width="128" height="128" rx="64" fill="currentColor" fillOpacity="0.1"/>
            <path d="M110.584 64.9142H99.142C99.142 41.8335 80.214 23 57.0217 23C34.5998 23 15.9312 40.7293 14.9508 62.7842C13.9223 86.2976 32.8698 106 56.4192 106H61.7804C82.8822 106 101.218 91.1804 105.127 70.8962H110.584C112.368 70.8962 113.834 69.4349 113.834 67.6552V68.0119C113.834 66.2321 112.368 64.9142 110.584 64.9142Z" fill="currentColor"/>
            <path d="M25.0469 63.6181C25.0469 63.0879 25.1883 62.6009 25.3296 62.1137C28.182 50.5683 38.7944 41.9428 51.4757 41.9428C66.2552 41.9428 78.2296 53.8716 78.2296 68.5922C78.2296 83.3128 66.2552 95.2416 51.4757 95.2416C38.7944 95.2416 28.182 86.6162 25.3296 75.0707C25.1883 74.5836 25.0469 74.0965 25.0469 73.5663V63.6181Z" fill="white"/>
            <path d="M80.5599 64.9142H99.142V70.8962H80.5599C79.4842 70.8962 78.5503 70.0973 78.5503 68.9054V66.905C78.5503 65.8565 79.4842 64.9142 80.5599 64.9142Z" fill="white"/>
          </svg>
          <span>{truncateAddress(publicKey)}</span>
        </Button>
        
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-md border border-white/10 bg-black/80 backdrop-blur-lg shadow-lg z-50 overflow-hidden">
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors"
              onClick={handleDisconnect}
            >
              Disconnect Wallet
            </button>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <Button 
      variant="outline"
      size="sm"
      className={cn(
        "border-white/20 bg-black/30 backdrop-blur-sm hover:bg-white/10",
        "flex items-center gap-2", 
        className
      )}
      onClick={handleConnect}
      disabled={connecting}
    >
      <svg width="16" height="16" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-500">
        <rect width="128" height="128" rx="64" fill="currentColor" fillOpacity="0.1"/>
        <path d="M110.584 64.9142H99.142C99.142 41.8335 80.214 23 57.0217 23C34.5998 23 15.9312 40.7293 14.9508 62.7842C13.9223 86.2976 32.8698 106 56.4192 106H61.7804C82.8822 106 101.218 91.1804 105.127 70.8962H110.584C112.368 70.8962 113.834 69.4349 113.834 67.6552V68.0119C113.834 66.2321 112.368 64.9142 110.584 64.9142Z" fill="currentColor"/>
        <path d="M25.0469 63.6181C25.0469 63.0879 25.1883 62.6009 25.3296 62.1137C28.182 50.5683 38.7944 41.9428 51.4757 41.9428C66.2552 41.9428 78.2296 53.8716 78.2296 68.5922C78.2296 83.3128 66.2552 95.2416 51.4757 95.2416C38.7944 95.2416 28.182 86.6162 25.3296 75.0707C25.1883 74.5836 25.0469 74.0965 25.0469 73.5663V63.6181Z" fill="white"/>
        <path d="M80.5599 64.9142H99.142V70.8962H80.5599C79.4842 70.8962 78.5503 70.0973 78.5503 68.9054V66.905C78.5503 65.8565 79.4842 64.9142 80.5599 64.9142Z" fill="white"/>
      </svg>
      <span>{connecting ? "Connecting..." : "Connect Wallet"}</span>
    </Button>
  )
}
