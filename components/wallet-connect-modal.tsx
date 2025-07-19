"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Wallet } from "lucide-react"

interface WalletConnectModalProps {
  isOpen: boolean
  onClose: () => void
  onWalletConnected: (privateKey: string | null, publicKey: string) => void
}

export function WalletConnectModal({ isOpen, onClose, onWalletConnected }: WalletConnectModalProps) {
  const [privateKeyInput, setPrivateKeyInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isConnectingMetaMask, setIsConnectingMetaMask] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setPrivateKeyInput("")
      setError(null)
      setIsConnectingMetaMask(false)
    }
  }, [isOpen])

  const handlePrivateKeyConnect = () => {
    if (!privateKeyInput.trim()) {
      setError("Private key cannot be empty.")
      return
    }
    // IMPORTANT SECURITY WARNING:
    // Storing private keys in localStorage is highly insecure and should NEVER be done in a production application.
    // This is for demonstration purposes ONLY.
    localStorage.setItem("userPrivateKey", privateKeyInput)

    // In a real application, you would derive the public key from the private key using a library like ethers.js or web3.js.
    // For this Next.js environment, we'll use a placeholder public key.
    const dummyPublicKey = "0x1234567890abcdef1234567890abcdef12345678" // Placeholder for demonstration

    localStorage.setItem("userPublicKey", dummyPublicKey)

    onWalletConnected(privateKeyInput, dummyPublicKey)
    onClose()
  }

  const handleMetaMaskConnect = async () => {
    if (typeof window.ethereum === "undefined") {
      setError("MetaMask is not installed. Please install it to connect.")
      return
    }

    setIsConnectingMetaMask(true)
    setError(null)
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })
      const publicKey = accounts[0]
      localStorage.removeItem("userPrivateKey") // Clear private key if connecting via MetaMask
      localStorage.setItem("userPublicKey", publicKey)
      onWalletConnected(null, publicKey) // Pass null for private key if connected via MetaMask
      onClose()
    } catch (err: any) {
      console.error("MetaMask connection error:", err)
      setError(err.message || "Failed to connect to MetaMask.")
    } finally {
      setIsConnectingMetaMask(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Connect Wallet</DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter your private key or connect with MetaMask.
            <p className="text-red-500 font-bold mt-2">
              WARNING: Storing private keys in local storage is highly insecure and should NEVER be done in a production
              environment. This is for demonstration purposes only.
            </p>
            <p className="text-yellow-400 text-sm mt-1">
              Note: Public key derivation from private key is simulated in this demo. A real application would use a
              library like ethers.js.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="private-key" className="text-gray-300">
              Private Key
            </Label>
            <Input
              id="private-key"
              type="password" // Use password type for security
              value={privateKeyInput}
              onChange={(e) => setPrivateKeyInput(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="Enter your private key"
            />
            <Button
              onClick={handlePrivateKeyConnect}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!privateKeyInput.trim()}
            >
              Connect with Private Key
            </Button>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gray-900 px-2 text-gray-500">Or</span>
          </div>
          <Button
            onClick={handleMetaMaskConnect}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            disabled={isConnectingMetaMask}
          >
            {isConnectingMetaMask ? "Connecting..." : "Connect with MetaMask"}
            <Wallet className="w-4 h-4 ml-2" />
          </Button>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-700 text-white hover:bg-gray-800 bg-transparent"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
