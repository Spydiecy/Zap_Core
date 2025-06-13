"use client"

import { useState } from "react"
import { useWallet } from "@/contexts/WalletContext"
import { useWalletAddress } from "@/components/wallet/WalletProtection"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink, QrCode, Send, Download, Plus, History, Wallet } from "lucide-react"

// Sample address for demo when wallet is not connected
const SAMPLE_SOLANA_ADDRESS = "yYu74v9PbemzH7xTF1AyvYmQBgLQTNpp9mQQmJY5UW7"

export default function WalletPage() {
  const { connected, publicKey } = useWallet()
  const walletAddress = useWalletAddress()
  
  // Use real wallet address or fallback to sample
  const currentAddress = walletAddress || publicKey || SAMPLE_SOLANA_ADDRESS

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(currentAddress)
    // In a real implementation, you would show a toast notification here
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 text-transparent bg-clip-text mb-1">Wallet</h1>
          <p className="text-white/60">Manage your crypto assets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 border-white/20 hover:bg-white/10 text-white">
            <History className="h-4 w-4" />
            History
          </Button>
          <Button variant="outline" size="sm" className="gap-2 border-white/20 bg-white/10 text-white">
            <Download className="h-4 w-4" />
            Receive
          </Button>
          <Button size="sm" className="gap-2 bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 text-white">
            <Send className="h-4 w-4" />
            Send
          </Button>
        </div>
      </div>

      {connected ? (
        <>
          <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-xl font-bold mb-2 bg-gradient-to-r from-white to-white/90 text-transparent bg-clip-text">Solana Wallet</h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-white/60">{formatAddress(currentAddress)}</p>
                  <button 
                    onClick={handleCopyAddress}
                    className="p-1 hover:bg-white/10 rounded-md transition-all"
                  >
                    <Copy className="h-4 w-4 text-white/80" />
                  </button>
                  <a 
                    href={`https://explorer.solana.com/address/${currentAddress}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-white/10 rounded-md transition-all"
                  >
                    <ExternalLink className="h-4 w-4 text-white/80" />
                  </a>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-white/90 p-3 rounded-lg mb-2">
                  <QrCode className="h-20 w-20 text-black" />
                </div>
                <Button variant="outline" size="sm" className="gap-2 border-white/20 hover:bg-white/10 text-white">
                  <QrCode className="h-4 w-4" />
                  Show QR
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all shadow-md">
              <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-white to-white/90 text-transparent bg-clip-text">Native Balance</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/20 border border-white/10 flex items-center justify-center">
                  <svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.9998 12.5714L17.0712 9.35893C16.4284 7.35893 15.6427 6.5 13.7141 6.5H10.9998V5H13.2855C13.6426 5 13.9998 4.64286 13.9998 4.28571C13.9998 3.92857 13.6426 3.57143 13.2855 3.57143H10.9998V2.14286C10.9998 1.42857 10.4284 0.857143 9.71409 0.857143C8.99981 0.857143 8.42838 1.42857 8.42838 2.14286V3.57143H6.14266C5.78552 3.57143 5.42838 3.92857 5.42838 4.28571C5.42838 4.64286 5.78552 5 6.14266 5H8.42838V6.5H5.71409C3.7855 6.5 2.99982 7.35893 2.35696 9.35893L1.42839 12.5714C0.857102 14.9286 1.71424 16 4.21417 16H15.2141C17.7141 16 18.5712 14.9286 17.9998 12.5714ZM11.9284 10.9286C11.9284 11.4643 11.5355 11.7857 10.9998 11.7857C10.4641 11.7857 10.0712 11.4286 10.0712 10.9286C10.0712 10.4286 10.4641 10.0714 10.9998 10.0714C11.5355 10.0714 11.9284 10.3929 11.9284 10.9286ZM6.96424 10.9286C6.96424 11.4643 6.57138 11.7857 6.03567 11.7857C5.49995 11.7857 5.10709 11.4286 5.10709 10.9286C5.10709 10.4286 5.49995 10.0714 6.03567 10.0714C6.57138 10.0714 6.96424 10.3929 6.96424 10.9286Z" fill="white"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-bold">42.5 SOL</p>
                  <p className="text-sm text-white/60">≈ $4,137.38</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 border-white/20 hover:bg-white/10 text-white">Stake</Button>
                <Button variant="outline" size="sm" className="flex-1 border-white/20 hover:bg-white/10 text-white">Swap</Button>
                <Button size="sm" className="flex-1 bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 text-white">Send</Button>
              </div>
            </div>

            <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all shadow-md">
              <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-white to-white/90 text-transparent bg-clip-text">Tokens</h2>
              <div className="space-y-4">
                <TokenRow 
                  name="USDC" 
                  amount="3,245.67" 
                  value="$3,245.67" 
                  color="bg-white/30" 
                />
                <TokenRow 
                  name="BONK" 
                  amount="24.56M" 
                  value="$524.08" 
                  color="bg-white/25" 
                />
                <TokenRow 
                  name="JUP" 
                  amount="1,245.67" 
                  value="$1,083.73" 
                  color="bg-white/20" 
                />
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-4 gap-2 text-white hover:bg-white/10">
                <Plus className="h-4 w-4" />
                Add Custom Token
              </Button>
            </div>
          </div>

          <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all shadow-md">
            <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-white to-white/90 text-transparent bg-clip-text">Recent Activity</h2>
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-3 hover:bg-white/5 transition-all rounded-lg border border-white/5 hover:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${tx.type === "receive" ? "bg-white/10 border border-white/10" : "bg-white/5 border border-white/10"}`}>
                      {tx.type === "receive" ? <Download className="h-4 w-4 text-white" /> : <Send className="h-4 w-4 text-white" />}
                    </div>
                    <div>
                      <p className="font-medium">{tx.title}</p>
                      <p className="text-sm text-white/60">{tx.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{tx.amount}</p>
                    <p className="text-sm text-white/60">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4 border-white/20 hover:bg-white/10 text-white">
              View All Transactions
            </Button>
          </div>
        </>
      ) : (
        <div className="backdrop-blur-sm bg-black/20 border border-white/10 rounded-xl p-10 text-center hover:border-white/20 transition-all shadow-md">
          <div className="mb-6">
            <div className="w-16 h-16 rounded-full bg-white/10 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2 bg-gradient-to-r from-white to-white/90 text-transparent bg-clip-text">Connect Your Wallet</h2>
            <p className="text-white/60 mb-6">Connect your Solana wallet to view your assets and interact with the Astra DeFi platform</p>
          </div>
          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            <Button size="lg" className="w-full bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 text-white">Connect Wallet</Button>
            <Button variant="outline" size="lg" className="w-full border-white/20 hover:bg-white/10 text-white">Create New Wallet</Button>
          </div>
        </div>
      )}
    </div>
  )
}

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

interface TokenRowProps {
  name: string
  amount: string
  value: string
  color: string
}

function TokenRow({ name, amount, value, color }: TokenRowProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full ${color} border border-white/10 flex items-center justify-center`}></div>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-xs text-white/60">{amount}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium">{value}</p>
        <div className="flex justify-end gap-1 mt-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/10 text-white/80">
            <Send className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/10 text-white/80">
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

const transactions = [
  {
    id: "1",
    title: "Received SOL",
    date: "Today, 12:30 PM",
    amount: "+2.45 SOL",
    status: "Confirmed",
    type: "receive"
  },
  {
    id: "2",
    title: "Swapped BONK to SOL",
    date: "Yesterday, 3:15 PM",
    amount: "1200 BONK → 0.063 SOL",
    status: "Confirmed",
    type: "swap"
  },
  {
    id: "3",
    title: "Sent JUP",
    date: "May 18, 8:52 AM",
    amount: "-15.7 JUP",
    status: "Confirmed",
    type: "send"
  },
  {
    id: "4",
    title: "NFT Purchase",
    date: "May 17, 11:23 AM",
    amount: "-0.12 SOL",
    status: "Confirmed",
    type: "send"
  }
]
