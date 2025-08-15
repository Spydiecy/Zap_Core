"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Copy, ExternalLink } from "lucide-react"
import QRCode from "qrcode"

// Web3 types
declare global {
  interface Window {
    ethereum?: any
    Web3?: any
  }
}

const CONTRACT_ADDRESS = "0x6AEeC8deE2B02F0910a3210F8D401D71326Dc50c"
const CONTRACT_ABI = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "receiver",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			}
		],
		"name": "PaymentSent",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_receiver",
				"type": "address"
			}
		],
		"name": "send_payment",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender_address",
				"type": "address"
			}
		],
		"name": "get_payments",
		"outputs": [
			{
				"components": [
					{
						"internalType": "address",
						"name": "sender",
						"type": "address"
					},
					{
						"internalType": "address",
						"name": "receiver",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "amount",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "timestamp",
						"type": "uint256"
					}
				],
				"internalType": "struct PaymentTracker.Payment[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

const NETWORK = {
  chainId: "0x45B",
  chainName: "Core Testnet",
  rpcUrls: ["https://rpc.test.btcs.network"], // ✅ FIXED: Added https://
  blockExplorerUrls: ["https://scan.test.btcs.network"],
}

export default function PaymentPortalPage() {
  const params = useParams()
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "completed" | "failed">("pending")
  const [txHash, setTxHash] = useState<string>("")

  const receiverAddress = params.address as string
  const amount = params.amount as string

  useEffect(() => {
    const generateQR = async () => {
      try {
        const paymentUrl = `ethereum:${receiverAddress}@${NETWORK.chainId}?value=${Number.parseFloat(amount) * 1e18}`
        const qrUrl = await QRCode.toDataURL(paymentUrl, {
          width: 200,
          margin: 2,
          color: { dark: "#000000", light: "#FFFFFF" },
        })
        setQrCodeUrl(qrUrl)
      } catch (error) {
        console.error("Error generating QR code:", error)
      }
    }
    if (receiverAddress && amount) generateQR()
  }, [receiverAddress, amount])

  const addCrossFiNetwork = async () => {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [NETWORK],
    })
  }

  const switchToCrossFi = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: NETWORK.chainId }],
      })
    } catch (error: any) {
      if (error.code === 4902) {
        await addCrossFiNetwork()
      } else {
        throw error
      }
    }
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not found. Please install it.")
      return null
    }
    setIsConnecting(true)
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      await switchToCrossFi()
      return accounts[0]
    } catch (error: any) {
      alert(`Wallet connection failed: ${error.message}`)
      return null
    } finally {
      setIsConnecting(false)
    }
  }

  const sendPaymentViaContract = async () => {
    try {
      setIsPaying(true)
      setPaymentStatus("processing")

      const account = await connectWallet()
      if (!account) return

      const web3 = new (window as any).Web3(window.ethereum)

      // ✅ Convert amount to Wei safely
      const amountInWei = web3.utils.toWei(amount, "ether")

      // ✅ Get contract instance & encode ABI
      const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS)
      const data = contract.methods.send_payment(receiverAddress).encodeABI()

      // ✅ Estimate gas
      const gasEstimate = await web3.eth.estimateGas({
        from: account,
        to: CONTRACT_ADDRESS,
        value: amountInWei,
        data: data,
      })

      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          to: CONTRACT_ADDRESS,
          from: account,
          value: web3.utils.toHex(amountInWei),
          data: data,
          gas: web3.utils.toHex(gasEstimate),
        }],
      })

      console.log("Transaction sent:", txHash)
      setTxHash(txHash)
      await waitForTransactionConfirmation(txHash)
      setPaymentStatus("completed")
      alert(`Payment successful! TX: ${txHash}`)
    } catch (error: any) {
      console.error("Payment error:", error)
      alert(`Payment failed: ${error.message || "Unknown error"}`)
      setPaymentStatus("failed")
    } finally {
      setIsPaying(false)
    }
  }

  const waitForTransactionConfirmation = async (txHash: string) => {
    return new Promise((resolve, reject) => {
      const check = async () => {
        try {
          const receipt = await window.ethereum.request({
            method: "eth_getTransactionReceipt",
            params: [txHash],
          })
          if (receipt) {
            receipt.status === "0x1" ? resolve(receipt) : reject(new Error("Transaction failed"))
          } else {
            setTimeout(check, 2000)
          }
        } catch (error) {
          reject(error)
        }
      }
      check()
    })
  }

  const getStatusColor = () => {
    switch (paymentStatus) {
      case "pending": return "bg-yellow-500/20 text-yellow-400 rounded-md px-3 py-1"
      case "processing": return "bg-blue-500/20 text-blue-400 rounded-md px-3 py-1"
      case "completed": return "bg-green-500/20 text-green-400 rounded-md px-3 py-1"
      case "failed": return "bg-red-500/20 text-red-400 rounded-md px-3 py-1"
      default: return "bg-yellow-500/20 text-yellow-400 rounded-md px-3 py-1"
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">Payment Portal</h1>
          <p className="text-gray-400">Smart Contract Payment System</p>
        </div>

        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-gray-400">Receiver Address:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono break-all max-w-xs">{receiverAddress}</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(receiverAddress)} className="p-1 h-6 w-6">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Amount:</span>
              <span className="font-semibold">{amount} ETH</span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-gray-400">Contract Address:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono break-all max-w-xs">{CONTRACT_ADDRESS}</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(CONTRACT_ADDRESS)} className="p-1 h-6 w-6">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Status:</span>
              <span className={getStatusColor()}>{paymentStatus}</span>
            </div>

            {txHash && (
              <div className="flex justify-between items-start">
                <span className="text-gray-400">Transaction Hash:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono break-all max-w-xs">{txHash}</span>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(txHash)} className="p-1 h-6 w-6">
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => window.open(`${NETWORK.blockExplorerUrls[0]}/tx/${txHash}`, '_blank')} className="p-1 h-6 w-6">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {qrCodeUrl && (
          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Scan to Pay</h3>
              <div className="flex justify-center">
                <img src={qrCodeUrl} alt="Payment QR Code" className="rounded-lg" />
              </div>
            </div>
          </Card>
        )}

        <Button
          onClick={sendPaymentViaContract}
          disabled={isConnecting || isPaying || paymentStatus === "completed"}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-4 text-lg"
        >
          {isConnecting ? "Connecting Wallet..." : isPaying ? "Processing Payment..." : paymentStatus === "completed" ? "Payment Completed" : "Pay via Smart Contract"}
        </Button>

        <Card className="bg-gray-900 border-gray-800 p-4">
          <div className="text-center text-sm text-gray-400">
            <p>This payment will be processed through our smart contract</p>
            <p>Network: {NETWORK.chainName}</p>
            <p>All transactions are recorded on the blockchain for transparency</p>
          </div>
        </Card>
      </div>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/web3/1.8.0/web3.min.js"></script>
    </div>
  )
}