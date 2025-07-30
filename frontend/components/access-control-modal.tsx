"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { parseEther } from 'viem'
import { Wallet, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

const CONTRACT_ADDRESS = '0xF887B4D3b17C12C86cc917cF72fb8881f866a847'
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
  const { address, isConnected } = useAccount()
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

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

  // Check access when wallet connects or payment status changes
  useEffect(() => {
    if (hasPaid) {
      onAccessGranted()
    }
  }, [hasPaid, onAccessGranted])

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
        return <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      default:
        return <Shield className="w-5 h-5 text-gray-400" />
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
      <DialogContent className="bg-black border-gray-800 text-white max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl font-semibold">
            <Shield className="w-6 h-6 text-blue-400" />
            <span>Access Control</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Access Fee Info */}
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-medium mb-2">Premium Access Required</h3>
            <p className="text-gray-400 text-sm mb-4">
              Access to Astra AI Assistant requires a one-time payment of 0.01 ETH on Morph Holesky Testnet.
            </p>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-300">One-time payment</span>
            </div>
            <div className="flex items-center space-x-2 text-sm mt-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-gray-300">Morph Holesky Testnet</span>
            </div>
          </div>

          {/* Wallet Connection */}
          {!isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-gray-300">
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
              <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Wallet Connected</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>

              {/* Payment Status */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-gray-300">
                  {getStatusIcon()}
                  <span>Step 2: {getStatusMessage()}</span>
                </div>

                {/* Payment Button */}
                {!hasPaid && (
                  <Button
                    onClick={handlePayment}
                    disabled={isPending || paymentStatus === 'pending'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 py-3"
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
                  <div className="flex items-center justify-center space-x-2 p-3 bg-green-900/20 rounded-lg border border-green-700">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400">Access granted! Redirecting...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Network Info */}
          <div className="text-xs text-gray-500 text-center p-3 bg-gray-900/30 rounded border border-gray-800">
            <p>Make sure you're connected to Morph Holesky Testnet</p>
            <p className="mt-1">Contract: {CONTRACT_ADDRESS}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
