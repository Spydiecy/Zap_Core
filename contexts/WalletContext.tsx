"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface WalletContextType {
  wallet: any | null
  connecting: boolean
  connected: boolean
  publicKey: string | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => Promise<void>
}

const WalletContext = createContext<WalletContextType>({
  wallet: null,
  connecting: false,
  connected: false,
  publicKey: null,
  connectWallet: async () => {},
  disconnectWallet: async () => {}
})

export const useWallet = () => useContext(WalletContext)

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<any | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)

  useEffect(() => {
    const checkForPhantom = async () => {
      try {
        // Check if window is defined (browser environment)
        if (typeof window !== 'undefined') {
          // Check if Phantom is installed
          const phantom = window.solana
          
          if (phantom) {
            setWallet(phantom)
            
            // Check if already connected
            if (phantom.isConnected) {
              const key = phantom.publicKey?.toString()
              setConnected(true)
              setPublicKey(key || null)
            }
            
            // Handle connection change events
            phantom.on('connect', () => {
              const key = phantom.publicKey?.toString()
              setConnected(true)
              setPublicKey(key || null)
              setConnecting(false)
            })
            
            phantom.on('disconnect', () => {
              setConnected(false)
              setPublicKey(null)
            })
          }
        }
      } catch (error) {
        console.error("Error checking for Phantom wallet:", error)
      }
    }
    
    // Only run in browser
    if (typeof window !== 'undefined') {
      checkForPhantom()
    }
    
    return () => {
      // Clean up listeners if needed
      if (wallet) {
        wallet.off('connect')
        wallet.off('disconnect')
      }
    }
  }, [])

  const connectWallet = async () => {
    try {
      if (!wallet) {
        window.open('https://phantom.app/', '_blank')
        return
      }
      
      setConnecting(true)
      
      // Phantom wallet connection
      await wallet.connect()
      
    } catch (error) {
      console.error("Error connecting to wallet:", error)
      setConnecting(false)
    }
  }

  const disconnectWallet = async () => {
    try {
      if (wallet) {
        await wallet.disconnect()
        setConnected(false)
        setPublicKey(null)
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error)
    }
  }

  return (
    <WalletContext.Provider 
      value={{
        wallet,
        connecting,
        connected,
        publicKey,
        connectWallet,
        disconnectWallet
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}
