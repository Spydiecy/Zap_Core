"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface CredentialsContextType {
  publicKey: string
  privateKey: string
  setPublicKey: (key: string) => void
  setPrivateKey: (key: string) => void
  hasCredentials: boolean
  isConfirmed: boolean
  confirmCredentials: () => void
}

const CredentialsContext = createContext<CredentialsContextType | undefined>(undefined)

export function CredentialsProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKeyState] = useState<string>("")
  const [privateKey, setPrivateKeyState] = useState<string>("")
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false)

  // Load credentials from localStorage on mount
  useEffect(() => {
    const storedPublicKey = localStorage.getItem("wallet_public_key")
    const storedPrivateKey = localStorage.getItem("wallet_private_key")
    const storedConfirmed = localStorage.getItem("wallet_credentials_confirmed")
    
    if (storedPublicKey) setPublicKeyState(storedPublicKey)
    if (storedPrivateKey) setPrivateKeyState(storedPrivateKey)
    if (storedConfirmed === "true") setIsConfirmed(true)
  }, [])

  // Save to localStorage whenever keys change
  const setPublicKey = (key: string) => {
    setPublicKeyState(key)
    localStorage.setItem("wallet_public_key", key)
    // Reset confirmation when credentials change
    setIsConfirmed(false)
    localStorage.removeItem("wallet_credentials_confirmed")
  }

  const setPrivateKey = (key: string) => {
    setPrivateKeyState(key)
    localStorage.setItem("wallet_private_key", key)
    // Reset confirmation when credentials change
    setIsConfirmed(false)
    localStorage.removeItem("wallet_credentials_confirmed")
  }

  const confirmCredentials = () => {
    if (publicKey && privateKey) {
      setIsConfirmed(true)
      localStorage.setItem("wallet_credentials_confirmed", "true")
    }
  }

  const hasCredentials = Boolean(publicKey && privateKey)

  return (
    <CredentialsContext.Provider
      value={{
        publicKey,
        privateKey,
        setPublicKey,
        setPrivateKey,
        hasCredentials,
        isConfirmed,
        confirmCredentials
      }}
    >
      {children}
    </CredentialsContext.Provider>
  )
}

export function useCredentials() {
  const context = useContext(CredentialsContext)
  if (context === undefined) {
    throw new Error('useCredentials must be used within a CredentialsProvider')
  }
  return context
}
