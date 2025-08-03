"use client"

import React, { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { parseEther } from 'viem'
import { Wallet, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const CONTRACT_ADDRESS = '0xCa36dD890F987EDcE1D6D7C74Fb9df627c216BF6'
const CONTRACT_ABI = [
  {
    "inputs": [],
    "name": "pay",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "hasPaid",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "paid",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

interface AccessControlModalProps {
  isOpen: boolean
  onAccessGranted: () => void
}

export function AccessControlModal({ isOpen, onAccessGranted }: AccessControlModalProps) {
  const { theme } = useTheme()
  const { address, isConnected } = useAccount()
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [mounted, setMounted] = useState(false)

  const isDark = theme === 'dark'

  // Check if user has already paid
  const { data: hasPaid, refetch: refetchHasPaid } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'hasPaid',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  }) as { data: boolean | undefined; refetch: () => void }

  // Write contract hook for payment
  const { writeContract, isPending } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setPaymentStatus('success')
        setTimeout(() => {
          refetchHasPaid()
        }, 2000)
      },
      onError: (error) => {
        setPaymentStatus('error')
        setErrorMessage(error.message || 'Payment failed')
        console.error('Payment error:', error)
      },
    },
  })

  // Ensure component is mounted before rendering to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check access when wallet connects or payment status changes
  useEffect(() => {
    if (hasPaid) {
      onAccessGranted()
    }
  }, [hasPaid, onAccessGranted])

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  const handlePayment = async () => {
    if (!address) return
    
    try {
      setPaymentStatus('pending')
      setErrorMessage('')
      
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'pay',
        value: parseEther('0.01'),
      })
    } catch (error) {
      setPaymentStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed')
      console.error('Payment error:', error)
    }
  }

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'pending':
        return <Loader2 className={cn("w-5 h-5 animate-spin", isDark ? "text-gray-400" : "text-gray-600")} />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      default:
        return <Shield className={cn("w-5 h-5", isDark ? "text-gray-400" : "text-gray-600")} />
    }
  }

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'pending':
        return 'Processing payment...'
      case 'success':
        return 'Payment successful! Verifying access...'
      case 'error':
        return errorMessage || 'Payment failed. Please try again.'
      default:
        return 'Pay 0.01 ETH to access Astra AI Assistant'
    }
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
            <span>Access Control</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Access Fee Info */}
          <div className={cn(
            "rounded-lg p-4 border",
            isDark 
              ? "bg-gray-900/50 border-gray-700" 
              : "bg-gray-100/50 border-gray-300"
          )}>
            <h3 className="text-lg font-medium mb-2">Premium Access Required</h3>
            <p className={cn("text-sm mb-4", isDark ? "text-gray-400" : "text-gray-600")}>
              Access to Astra AI Assistant requires a one-time payment of 0.1 XFI on CrossFi Testnet.
            </p>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className={cn(isDark ? "text-gray-300" : "text-gray-700")}>One-time payment</span>
            </div>
            <div className="flex items-center space-x-2 text-sm mt-1">
              <div className={cn("w-2 h-2 rounded-full", isDark ? "bg-gray-400" : "bg-gray-600")}></div>
              <span className={cn(isDark ? "text-gray-300" : "text-gray-700")}>CrossFi Testnet</span>
            </div>
          </div>

          {/* Wallet Connection */}
          {!isConnected ? (
            <div className="space-y-4">
              <div className={cn("flex items-center space-x-2", isDark ? "text-gray-300" : "text-gray-700")}>
                <Wallet className="w-5 h-5" />
                <span>Step 1: Connect your wallet</span>
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

              {/* Payment Status */}
              <div className="space-y-3">
                <div className={cn("flex items-center space-x-2", isDark ? "text-gray-300" : "text-gray-700")}>
                  {getStatusIcon()}
                  <span>Step 2: {getStatusMessage()}</span>
                </div>

                {/* Payment Button */}
                {!hasPaid && (
                  <Button
                    onClick={handlePayment}
                    disabled={isPending || paymentStatus === 'pending'}
                    className={cn(
                      "w-full border-0 py-3",
                      isDark 
                        ? "bg-white text-black hover:bg-gray-200" 
                        : "bg-black text-white hover:bg-gray-800"
                    )}
                  >
                    {isPending || paymentStatus === 'pending' ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Wallet className="w-4 h-4" />
                        <span>Pay 0.01 ETH</span>
                      </div>
                    )}
                  </Button>
                )}

                {/* Already Paid Status */}
                {hasPaid && (
                  <div className={cn(
                    "flex items-center justify-center space-x-2 p-3 rounded-lg border",
                    isDark 
                      ? "bg-green-900/20 border-green-700" 
                      : "bg-green-100/50 border-green-300"
                  )}>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400">Access granted! Redirecting...</span>
                  </div>
                )}
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
            <p>Make sure you're connected to CrossFi Testnet</p>
            <p className="mt-1">Contract: {CONTRACT_ADDRESS}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
