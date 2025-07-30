"use client"

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { Wallet, Shield, Check, Loader2, AlertCircle, ExternalLink, X } from 'lucide-react'

// Contract constants
const ACCESS_CONTRACT_ADDRESS = '0xF887B4D3b17C12C86cc917cF72fb8881f866a847'
const ACCESS_CONTRACT_ABI = [
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
  }
] as const

interface AccessControlModalProps {
  isOpen: boolean
  onAccessGranted: () => void
  onClose?: () => void
}

export function AccessControlModal({ isOpen, onAccessGranted, onClose }: AccessControlModalProps) {
  const { address, isConnected } = useAccount()
  const [showSuccess, setShowSuccess] = useState(false)

  // Check if user has paid
  const { data: hasPaid, isLoading: isCheckingPayment, refetch } = useReadContract({
    address: ACCESS_CONTRACT_ADDRESS,
    abi: ACCESS_CONTRACT_ABI,
    functionName: 'hasPaid',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Payment transaction
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const payAccessFee = () => {
    writeContract({
      address: ACCESS_CONTRACT_ADDRESS,
      abi: ACCESS_CONTRACT_ABI,
      functionName: 'pay',
      value: parseEther('0.01'),
    })
  }

  // Handle successful payment
  useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true)
      setTimeout(() => {
        refetch()
      }, 2000)
    }
  }, [isSuccess, refetch])

  // Handle access granted
  useEffect(() => {
    if (hasPaid && showSuccess) {
      setTimeout(() => {
        onAccessGranted()
        setShowSuccess(false)
      }, 2000)
    }
  }, [hasPaid, showSuccess, onAccessGranted])

  const getStepStatus = (step: number) => {
    if (step === 1) {
      if (isConnected) return 'completed'
      return 'current'
    }
    if (step === 2) {
      if (!isConnected) return 'pending'
      if (hasPaid) return 'completed'
      if (isPending || isConfirming) return 'loading'
      return 'current'
    }
    return 'pending'
  }

  const renderStepIcon = (step: number) => {
    const status = getStepStatus(step)
    
    switch (status) {
      case 'completed':
        return <Check className="w-5 h-5 text-green-400" />
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
      case 'current':
        return (
          <div className="w-5 h-5 rounded-full border-2 border-blue-400 bg-blue-400/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
          </div>
        )
      default:
        return (
          <div className="w-5 h-5 rounded-full border-2 border-gray-600 bg-gray-800" />
        )
    }
  }

  const needsPayment = isConnected && !hasPaid && !isCheckingPayment

  if (showSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white z-40">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Access Granted!</h3>
            <p className="text-gray-400 text-center">
              Welcome to Astra AI Assistant. Redirecting to chat...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white relative z-40">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-50"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-white" />
            <span className="sr-only">Close</span>
          </button>
        )}
        
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-white">Access Required</DialogTitle>
              <DialogDescription className="text-gray-400">
                Pay 0.01 ETH to access Astra AI Assistant
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Steps */}
          <div className="space-y-4">
            {/* Step 1: Connect Wallet */}
            <div className="flex items-center space-x-3">
              {renderStepIcon(1)}
              <div className="flex-1">
                <h4 className="font-medium text-white">Connect Your Wallet</h4>
                <p className="text-sm text-gray-400">Connect to Morph Holesky testnet</p>
              </div>
              {!isConnected && (
                <div className="flex-shrink-0">
                  <ConnectButton.Custom>
                    {({ openConnectModal, connectModalOpen }) => (
                      <Button
                        onClick={openConnectModal}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white relative z-50"
                        disabled={connectModalOpen}
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        {connectModalOpen ? 'Opening...' : 'Connect'}
                      </Button>
                    )}
                  </ConnectButton.Custom>
                </div>
              )}
            </div>

            {/* Step 2: Pay Access Fee */}
            <div className="flex items-center space-x-3">
              {renderStepIcon(2)}
              <div className="flex-1">
                <h4 className="font-medium text-white">Pay Access Fee</h4>
                <p className="text-sm text-gray-400">
                  One-time payment of 0.01 ETH
                </p>
              </div>
              {needsPayment && (
                <div className="flex-shrink-0">
                  <Button
                    onClick={payAccessFee}
                    disabled={isPending || isConfirming}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isPending || isConfirming ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isPending ? 'Confirm in Wallet' : 'Processing...'}
                      </>
                    ) : (
                      'Pay 0.01 ETH'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Transaction Failed</p>
                  <p className="text-xs text-red-300 mt-1">
                    {error.message || 'An error occurred while processing your payment.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Hash */}
          {hash && (
            <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-400">Transaction submitted</span>
                <a
                  href={`https://explorer-holesky.morphl2.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <h5 className="font-medium text-white mb-2">Why do I need to pay?</h5>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• One-time access fee to use Astra AI Assistant</li>
              <li>• Deployed on Morph Holesky testnet</li>
              <li>• Secure smart contract verification</li>
              <li>• No recurring charges</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {onClose && (
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Skip for now
              </Button>
            )}
            <Button
              onClick={() => window.open('https://explorer-holesky.morphl2.io/address/0xF887B4D3b17C12C86cc917cF72fb8881f866a847', '_blank')}
              variant="outline"
              className="flex-1 border-blue-600 text-blue-400 hover:bg-blue-600/10"
            >
              View Contract
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
