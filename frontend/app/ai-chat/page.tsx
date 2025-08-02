"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Paperclip, Send, Bot, User, Plus, Zap, ImageIcon, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { uploadFileToIPFS } from "@/lib/pinata"
import { useCredentials } from "@/contexts/CredentialsContext"
import { AccessControlModal } from "@/components/access-control-modal"
import { useAccount, useReadContract } from 'wagmi'

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
  isLoading?: boolean
  images?: Array<{
    data: string
    displayName: string
    mimeType: string
  }>
  generatedImage?: any
  balanceData?: {
    tokens: Array<{
      symbol: string
      name: string
      balance: string
      usdValue?: string
      icon?: string
    }>
    totalUsdValue?: string
  }
  transactionData?: {
    hash: string
    blockHash: string
    blockNumber: string
    chainId: string
    from: string
    to: string
    value: string
    gasUsed: string
    gasPrice: string
    nonce: string
    transactionIndex: string
    type: string
    status?: string
    timestamp?: string
  }
}

interface FileUpload {
  file: File
  displayName: string
  mimeType: string
  data: string
}

// Access Control Constants
const CONTRACT_ADDRESS = '0xCa36dD890F987EDcE1D6D7C74Fb9df627c216BF6'
const CONTRACT_ABI = [
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
]

export default function AstraChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [appName, setAppName] = useState<string>("")
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([])
  const [hasAccess, setHasAccess] = useState(false)
  const [showAccessModal, setShowAccessModal] = useState(true)

  // Get credentials from context
  const { publicKey, privateKey, hasCredentials, isConfirmed } = useCredentials()
  
  // Wallet connection
  const { address, isConnected } = useAccount()

  // Check if user has paid for access
  const { data: hasPaid } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'hasPaid',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  }) as { data: boolean | undefined }

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const imageGenerationKeywords = [
    "generate",
    "create",
    "draw",
    "sketch",
    "illustrate",
    "visualize",
    "diagram",
    "chart",
    "graph",
  ]

  // Keywords that trigger IPFS storage functionality
  const ipfsStorageKeywords = [
    "save asset",
    "store asset",
    "save nft",
    "store nft",
    "upload asset",
    "upload nft",
    "mint nft",
    "create nft",
    "store metadata",
    "save metadata",
  ]

  const shouldGenerateImage = (text: string): boolean => {
    const lowerText = text.toLowerCase()
    return imageGenerationKeywords.some((keyword) => lowerText.includes(keyword))
  }

  const shouldUseIPFSStorage = (text: string): boolean => {
    const lowerText = text.toLowerCase()
    return ipfsStorageKeywords.some((keyword) => lowerText.includes(keyword))
  }

  const isBalanceResponse = (text: string): boolean => {
    const lowerText = text.toLowerCase()
    
    // Check for specific balance response patterns
    const balanceKeywords = [
      'wallet balance is',
      'balance is',
      'your balance',
      'current balance',
      'account balance',
      'balance:',
      'lsk balance',
      'lisk balance',
      'lisk token balance',
      'show balance',
      'check balance',
      'my balance'
    ]
    
    const hasBalanceKeyword = balanceKeywords.some(keyword => lowerText.includes(keyword))
    
    // Also check for token-specific balance patterns
    const tokenBalancePattern = (
      lowerText.includes("balance") || 
      lowerText.includes("wallet") ||
      lowerText.includes("tokens") ||
      lowerText.includes("eth") ||
      lowerText.includes("usdt") ||
      lowerText.includes("inj") ||
      lowerText.includes("lsk") ||
      lowerText.includes("lisk") ||
      lowerText.includes("lisk token") ||
      lowerText.includes("agent")
    )
    
    // Check for numerical values that look like balances
    const hasNumericValue = /[\d.]+/.test(text)
    
    return (hasBalanceKeyword || tokenBalancePattern) && hasNumericValue
  }

  const parseBalanceData = async (text: string, userInput?: string) => {
    // Try to extract balance information from the AI response
    const tokens: Array<{
      symbol: string
      name: string
      balance: string
      usdValue: string
      icon: string
    }> = []
    
    // Enhanced patterns for better balance extraction
    const patterns = [
      // Pattern: "Wallet Balance0.1" (exact concatenated format from backend)
      /^wallet\s*balance([\d.,]+)$/gi,
      // Pattern: "Your wallet balance is 0.609746632743044111"
      /(?:wallet\s+balance\s+is|balance\s+is)\s*([\d.,]+)/gi,
      // Pattern: "Balance: 0.1" (simple backend response format)
      /^balance:\s*([\d.,]+)$/gi,
      // Pattern: General "Wallet Balance" with spaces and numbers
      /wallet\s*balance\s*:?\s*([\d.,]+)/gi,
      // Pattern: "INJ: 2.64" or "USDT: 30.23"
      /(\w+):\s*([\d.,]+)/gi,
      // Pattern: "INJ balance: 2.64" 
      /(\w+)\s+balance:\s*([\d.,]+)/gi,
      // Pattern: "2.64 INJ" or "30.23 USDT"
      /([\d.,]+)\s+(\w+)/gi,
      // Pattern: "balance: 0.619957302943058765"
      /balance:\s*([\d.,]+)/gi,
      // Pattern: "LSK balance is 0.1" or "Lisk balance is 0.1"
      /(?:lsk|lisk)\s+balance\s+is\s*([\d.,]+)/gi,
      // Pattern: "Your LSK balance: 0.1"
      /(?:your\s+)?(?:lsk|lisk)\s+balance:\s*([\d.,]+)/gi
    ]
    
    // Common token symbols to look for
    const tokenSymbols = ['INJ', 'USDT', 'ETH', 'LSK', 'LISK', 'AGENT', 'BTC', 'WETH', 'MATIC', 'ATOM', 'OSMO']
    
    let foundTokens = new Set() // To avoid duplicates
    
    // Process each pattern
    for (const [patternIndex, pattern] of patterns.entries()) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        let tokenSymbol, balanceValue
        
        if (match.length === 3) {
          // Two capture groups - could be symbol:balance or balance symbol
          const first = match[1].toUpperCase()
          const second = match[2]
          
          if (tokenSymbols.includes(first)) {
            tokenSymbol = first
            balanceValue = second
          } else if (tokenSymbols.includes(second.toUpperCase())) {
            tokenSymbol = second.toUpperCase()
            balanceValue = first
          }
        } else if (match.length === 2) {
          // One capture group - likely just a balance number
          balanceValue = match[1]
          
          // Enhanced token detection logic
          // Look for token symbols in the surrounding text
          tokenSymbol = tokenSymbols.find(symbol => 
            text.toUpperCase().includes(symbol)
          )
          
          // Enhanced context-based token detection
          if (!tokenSymbol) {
            const lowerText = text.toLowerCase()
            const userInputLower = userInput?.toLowerCase() || ''
            
            // Check for Lisk-related keywords first (from user input or AI response)
            if (lowerText.includes('lisk') || lowerText.includes('lsk') || 
                lowerText.includes('lisk token') || lowerText.includes('lisk balance') ||
                lowerText.includes('show lsk') || lowerText.includes('tell my balance') ||
                lowerText.includes('my lisk') || lowerText.includes('my lsk') ||
                userInputLower.includes('lisk') || userInputLower.includes('lsk') ||
                userInputLower.includes('lisk token') || userInputLower.includes('lisk balance')) {
              tokenSymbol = 'LSK'
            }
            // Check for other specific token contexts
            else if (lowerText.includes('ethereum') || lowerText.includes('eth') || text.includes('0x') ||
                     userInputLower.includes('ethereum') || userInputLower.includes('eth')) {
              tokenSymbol = 'ETH'
            } else if (lowerText.includes('injective') || lowerText.includes('inj') ||
                       userInputLower.includes('injective') || userInputLower.includes('inj')) {
              tokenSymbol = 'INJ'
            } else if (lowerText.includes('usdt') || lowerText.includes('tether') ||
                       userInputLower.includes('usdt') || userInputLower.includes('tether')) {
              tokenSymbol = 'USDT'
            } else if (lowerText.includes('bitcoin') || lowerText.includes('btc') ||
                       userInputLower.includes('bitcoin') || userInputLower.includes('btc')) {
              tokenSymbol = 'BTC'
            } else {
              // For simple "Wallet Balance" or "Balance:" responses, default to LSK since this is a Lisk project
              if (patternIndex === 0 || patternIndex === 1 || patternIndex === 2 || 
                  text.trim().startsWith('Balance:') || text.trim().startsWith('Wallet Balance')) {
                tokenSymbol = 'LSK'
              } else {
                // Default fallback
                tokenSymbol = 'ETH'
              }
            }
          }
        }
        
        if (tokenSymbol && balanceValue && !foundTokens.has(tokenSymbol)) {
          foundTokens.add(tokenSymbol)
          
          const cleanBalance = parseFloat(balanceValue.replace(/,/g, ''))
          if (!isNaN(cleanBalance)) {
            const usdValue = await calculateUSDValue(tokenSymbol, cleanBalance)
            tokens.push({
              symbol: tokenSymbol,
              name: getTokenFullName(tokenSymbol),
              balance: cleanBalance.toFixed(6),
              usdValue: usdValue,
              icon: getTokenIcon(tokenSymbol)
            })
          }
        }
      }
    }

    // Calculate total USD value
    let totalUsdValue = '0.00'
    if (tokens.length > 0) {
      const total = tokens.reduce((sum, token) => {
        return sum + parseFloat(token.usdValue || '0')
      }, 0)
      totalUsdValue = total.toFixed(2)
    }

    return tokens.length > 0 ? { tokens, totalUsdValue } : null
  }

  const getTokenFullName = (symbol: string): string => {
    const tokenNames: Record<string, string> = {
      'INJ': 'Injective Protocol',
      'USDT': 'Tether USD',
      'ETH': 'Ethereum',
      'LSK': 'Lisk',
      'LISK': 'Lisk',
      'AGENT': 'Agent Token',
      'BTC': 'Bitcoin',
      'WETH': 'Wrapped Ethereum'
    }
    return tokenNames[symbol] || symbol
  }

  const calculateUSDValue = async (symbol: string, balance: number): Promise<string> => {
    try {
      // Map token symbols to Coinbase API symbols
      const coinbaseSymbols: Record<string, string> = {
        'USDT': 'USDT-USD',
        'ETH': 'ETH-USD',
        'BTC': 'BTC-USD',
        'WETH': 'ETH-USD', // Use ETH price for WETH
        'MATIC': 'MATIC-USD',
        'ATOM': 'ATOM-USD'
      }
      
      const coinbaseSymbol = coinbaseSymbols[symbol]
      
      if (!coinbaseSymbol) {
        // Fallback to mock price for unsupported tokens
        const mockPrices: Record<string, number> = {
          'AGENT': 0.50,
          'LSK': 1.50,
          'LISK': 1.50,
          'OSMO': 0.80
        }
        const price = mockPrices[symbol] || 0
        return (balance * price).toFixed(2)
      }
      
      const response = await fetch(`https://api.coinbase.com/v2/prices/${coinbaseSymbol}/spot`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch price for ${symbol}`)
      }
      
      const data = await response.json()
      const price = parseFloat(data.data.amount)
      
      return (balance * price).toFixed(2)
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error)
      
      // Fallback to mock prices if API fails
      const mockPrices: Record<string, number> = {
        'USDT': 1.00,
        'ETH': 3200.00,
        'LSK': 1.50, // Lisk price
        'LISK': 1.50, // Alternative Lisk symbol
        'AGENT': 0.50,
        'BTC': 45000.00,
        'WETH': 3200.00,
        'MATIC': 1.20,
        'ATOM': 8.50,
        'OSMO': 0.80
      }
      
      const price = mockPrices[symbol] || 0
      return (balance * price).toFixed(2)
    }
  }

  const getTokenIcon = (symbol: string): string => {
    const tokenIcons: Record<string, string> = {
      'INJ': '⚡',
      'USDT': '💎',
      'ETH': '/eth.svg', // Ethereum icon (blue diamond)
      'LSK': '/lisk.svg', // Lisk logo
      'LISK': '/lisk.svg', // Alternative Lisk symbol
      'AGENT': '🤖',
      'BTC': '₿',
      'WETH': '🔶'
    }
    return tokenIcons[symbol] || '🪙'
  }

  const isTransactionResponse = (text: string): boolean => {
    const lowerText = text.toLowerCase()
    
    // Check for transaction-related keywords including markdown bold format
    const transactionKeywords = [
      'transaction',
      'transaction hash',
      'block hash',
      'block number',
      'gas used',
      'gas price',
      'transaction index',
      'from address',
      'to address',
      'chain id',
      'nonce',
      '**block hash:**',
      '**block number:**',
      '**chain id:**',
      '**from address:**',
      '**to address:**',
      '**gas used:**',
      '**gas price:**',
      '**hash:**',
      '**nonce:**',
      '**transaction index:**',
      '**type:**',
      '**value:**',
      'tx hash',
      'txn hash',
      'transaction details'
    ]
    
    const hasTransactionKeyword = transactionKeywords.some(keyword => lowerText.includes(keyword))
    
    // Check for transaction hash pattern (various formats)
    const hasTransactionHash = /[a-fA-F0-9]{64}/.test(text) || /0x[a-fA-F0-9]{64}/.test(text)
    
    // Check for address patterns (0x followed by 40 hex characters)
    const hasAddress = /0x[a-fA-F0-9]{40}/.test(text)
    
    // Check for the specific phrase about transaction details
    const hasTransactionPhrase = lowerText.includes('details for the transaction') || 
                                 lowerText.includes('transaction with hash') ||
                                 lowerText.includes('here are the details') ||
                                 lowerText.includes('transaction information')
    
    // More lenient detection - if we have transaction keywords AND any identifying data
    const result = hasTransactionKeyword && (hasTransactionHash || hasAddress || hasTransactionPhrase)
    
    console.log('Transaction detection debug:', {
      hasTransactionKeyword,
      hasTransactionHash,
      hasAddress,
      hasTransactionPhrase,
      result,
      textSample: lowerText.substring(0, 200)
    })
    
    return result
  }

  const parseTransactionData = (text: string) => {
    const patterns = {
      hash: /(?:\*\*Hash:\*\*|\*\*Transaction Hash:\*\*|hash|transaction\s+with\s+hash|tx\s*hash|txn\s*hash)[\s:`"]*([a-fA-F0-9x]{64,66})/i,
      blockHash: /(?:\*\*Block\s+Hash:\*\*|block\s+hash)[\s:`"]*([a-fA-F0-9x]+)/i,
      blockNumber: /(?:\*\*Block\s+Number:\*\*|block\s+number)[\s:`"]*[#]?(\d+)/i,
      chainId: /(?:\*\*Chain\s+ID:\*\*|chain\s+id)[\s:`"]*(\d+)/i,
      from: /(?:\*\*From[\s\w]*:\*\*|from[\s\w]*address)[\s:`"]*([a-fA-F0-9x]{40,42})/i,
      to: /(?:\*\*To[\s\w]*:\*\*|to[\s\w]*address)[\s:`"]*([a-fA-F0-9x]{40,42})/i,
      value: /(?:\*\*Value:\*\*|value)[\s:`"]*(\d+)/i,
      gasUsed: /(?:\*\*Gas\s+Used:\*\*|gas\s+used)[\s:`"]*(\d+)/i,
      gasPrice: /(?:\*\*Gas\s+Price:\*\*|gas\s+price)[\s:`"]*(\d+)/i,
      nonce: /(?:\*\*Nonce:\*\*|nonce)[\s:`"]*(\d+)/i,
      transactionIndex: /(?:\*\*Transaction\s+Index:\*\*|transaction\s+index)[\s:`"]*(\d+)/i,
      type: /(?:\*\*Type:\*\*|type)[\s:`"]*(\d+)/i
    }

    const result: any = {}
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern)
      if (match) {
        result[key] = match[1]
      }
    }

    console.log('Transaction parsing debug:', {
      foundFields: Object.keys(result),
      result,
      textSample: text.substring(0, 300)
    })

    // Return if we have at least a hash OR any meaningful transaction data
    if (result.hash || Object.keys(result).length >= 2) {
      return result
    }

    return null
  }

  const formatTransactionValue = (value: string): string => {
    if (!value) return '0'
    try {
      // Convert wei to ETH (divide by 10^18)
      const ethValue = parseFloat(value) / Math.pow(10, 18)
      return ethValue.toFixed(6) + ' ETH'
    } catch {
      return value
    }
  }

  const formatGasPrice = (gasPrice: string): string => {
    if (!gasPrice) return '0'
    try {
      // Convert wei to Gwei (divide by 10^9)
      const gweiValue = parseFloat(gasPrice) / Math.pow(10, 9)
      return gweiValue.toFixed(2) + ' Gwei'
    } catch {
      return gasPrice
    }
  }

  useEffect(() => {
    // Check access when wallet connects or payment status changes
    if (isConnected && hasPaid) {
      setHasAccess(true)
      setShowAccessModal(false)
    } else if (isConnected && hasPaid === false) {
      setHasAccess(false)
      setShowAccessModal(true)
    }
  }, [isConnected, hasPaid])

  useEffect(() => {
    const storedSessionId = localStorage.getItem("sessionId")
    const storedUserId = localStorage.getItem("userId")
    const storedAppName = localStorage.getItem("appName")

    if (storedSessionId && storedUserId && storedAppName && hasAccess) {
      setSessionId(storedSessionId)
      setUserId(storedUserId)
      setAppName(storedAppName)
      initializeChat()
    }

    // Listen for new session events from the layout
    const handleNewSession = (event: CustomEvent) => {
      if (!hasAccess) return // Don't create session if no access
      
      console.log('New session created:', event.detail)
      const { sessionId: newSessionId, userId: newUserId } = event.detail
      setSessionId(newSessionId)
      setUserId(newUserId)
      setAppName(localStorage.getItem("appName") || "astra-assistant")
      setMessages([]) // Clear existing messages
      initializeChat()
    }
    
    window.addEventListener('newSessionCreated', handleNewSession as EventListener)
    
    return () => {
      window.removeEventListener('newSessionCreated', handleNewSession as EventListener)
    }
  }, [hasAccess])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const initializeChat = () => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: "Hello! I'm your Astra AI assistant. I can help you with portfolio analysis, transaction details, block exploration, cryptocurrency swaps, and even generate images or diagrams. What would you like to explore today?",
        timestamp: Date.now(),
      },
    ])
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64Data = e.target?.result as string
        const fileUpload: FileUpload = {
          file,
          displayName: file.name,
          mimeType: file.type,
          data: base64Data,
        }
        setUploadedFiles((prev) => [...prev, fileUpload])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const sendMessage = async () => {
    if (!input.trim() && uploadedFiles.length === 0) return
    if (!sessionId || !userId) return

    const messageImages = uploadedFiles
      .filter((file) => file.mimeType.startsWith("image/"))
      .map((file) => ({
        data: file.data,
        displayName: file.displayName,
        mimeType: file.mimeType,
      }))

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: Date.now(),
      images: messageImages.length > 0 ? messageImages : undefined,
    }
    setMessages((prev) => [...prev, userMessage])

    const currentInput = input
    const currentFiles = [...uploadedFiles]
    setInput("")
    setUploadedFiles([])
    setIsLoading(true)

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isLoading: true,
    }
    setMessages((prev) => [...prev, loadingMessage])

    try {
      const needsImageGeneration = shouldGenerateImage(currentInput)
      const needsIPFSStorage = shouldUseIPFSStorage(currentInput)

      let finalPrompt = currentInput
      
      // Check if we actually have credential values (not just hasCredentials boolean)
      const hasActualCredentials = publicKey && privateKey && publicKey.trim() !== '' && privateKey.trim() !== ''
      
      // Use context credentials if available, otherwise fallback to hardcoded (for backwards compatibility)
      const str = hasActualCredentials 
        ? `My Wallet Public Key Or User Address: ${publicKey} and My  Wallet private key:${privateKey}`
        : "My Wallet Public Key Or User Address: 0xe26B62d6113659527c7cB3eDf4c1F660BE25dd70 and My  Wallet private key:2d7e6aead724a6fc219089d0d0c2477e614c09cf0d5e4eebd10272b0a68e7211"
        
      console.log('Has actual credentials:', hasActualCredentials)
      console.log('Credential string to append:', str)

      // Handle IPFS storage for specific keywords
      if (needsIPFSStorage && currentFiles.length > 0) {
        try {
          // Upload files to IPFS first
          console.log("IPFS File Storage Running for this.........");
          
          const uploadPromises = currentFiles.map(async (fileUpload) => {
            try {
              const { ipfsUrl } = await uploadFileToIPFS(fileUpload.file)
              return {
                fileName: fileUpload.displayName,
                ipfsUrl: ipfsUrl,
                success: true,
              }
            } catch (error) {
              console.error(`Failed to upload ${fileUpload.displayName}:`, error)
              return {
                fileName: fileUpload.displayName,
                error: error instanceof Error ? error.message : "Unknown error",
                success: false,
              }
            }
          })

          const uploadResults = await Promise.all(uploadPromises)

          // Create IPFS URLs string to append to prompt
          const ipfsInfo = uploadResults
            .map((result) => {
              if (result.success) {
                return `File "${result.fileName}" uploaded to IPFS: ${result.ipfsUrl}`
              } else {
                return `Failed to upload "${result.fileName}": ${result.error}`
              }
            })
            .join("\n")

          // Append IPFS URLs to the original prompt
          finalPrompt = `${currentInput}\n\nMy Image Link is::IPFS ${ipfsInfo}`
        } catch (error) {
          console.error("IPFS upload error:", error)
          finalPrompt = `${currentInput}\n\nNote: IPFS upload failed - ${error instanceof Error ? error.message : "Unknown error"}`
        }
      }

      // Prepare parts for runAgent
      const parts: any[] = [{ text: finalPrompt + str }]

      // IMPORTANT: Only add file data to runAgent if NOT using IPFS storage
      if (!needsIPFSStorage) {
        currentFiles.forEach((fileUpload) => {
          parts.push({
            inlineData: {
              displayName: fileUpload.displayName,
              data: fileUpload.data.split(",")[1], // Remove data:mime;base64, prefix
              mimeType: fileUpload.mimeType,
            },
          })
        })
      }
      // For IPFS storage keywords, we only send the text with IPFS URLs, no file data

      const runAgentResponse = await fetch("/api/run-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appName: appName,
          userId: userId,
          sessionId: sessionId,
          newMessage: {
            parts: parts,
            role: "user",
          },
          streaming: false,
        }),
      })

      if (!runAgentResponse.ok) {
        const errorData = await runAgentResponse.json()
        throw new Error(errorData.error || `HTTP error! status: ${runAgentResponse.status}`)
      }

      const responseData: any = await runAgentResponse.json()
      console.log("runAgent response data:", responseData)

      let content = ""
      if (Array.isArray(responseData)) {
  responseData.forEach((element) => {
    const parts = element?.content?.parts;
    if (Array.isArray(parts)) {
      parts.forEach((part) => {
        if (part?.text) {
          content += part.text;
        }
      });
    }
  });
} else {
  const parts = responseData?.content?.parts;
  if (Array.isArray(parts)) {
    parts.forEach((part) => {
      if (part?.text) {
        content += part.text;
      }
    });
  }
}

      let generatedImage = null
      if (needsImageGeneration && content) {
        try {
          const enhancedPrompt = `${content}\n\nBased on the above response, generate the workflow diagram or image or graph as suitable based on the given response.`
          const imageResponse = await fetch("/api/generate-image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: enhancedPrompt,
            }),
          })

          if (imageResponse.ok) {
            const imageData = await imageResponse.json()
            console.log("Image generation response:", imageData)
            if (imageData.imageBase64) {
              generatedImage = {
                imageBase64: imageData.imageBase64,
                responseText: imageData.responseText,
              }
            }
          } else {
            console.error("Image generation failed:", await imageResponse.text())
          }
        } catch (imageError) {
          console.error("Image generation error:", imageError)
        }
      }

      // Check if this is a balance response and parse the data
      console.log('AI Response content:', content)
      const isBalance = isBalanceResponse(content)
      console.log('Is balance response:', isBalance)
      
      const balanceData = isBalance ? await parseBalanceData(content, currentInput) : null
      console.log('Parsed balance data:', balanceData)

      // Check if this is a transaction response and parse the data
      const isTransaction = isTransactionResponse(content)
      console.log('Is transaction response:', isTransaction)
      console.log('Full AI response content for debugging:', content)
      
      const transactionData = isTransaction ? parseTransactionData(content) : null
      console.log('Parsed transaction data:', transactionData)

      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.isLoading)
        
        const assistantMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: content || "I apologize, but I encountered an issue processing your request.",
          timestamp: Date.now(),
          generatedImage: generatedImage,
          balanceData: balanceData || undefined,
          transactionData: transactionData || undefined,
        }
        return [...filtered, assistantMessage]
      })
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.isLoading)
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content:
            error instanceof Error ? error.message : "I apologize, but I encountered an error. Please try again.",
          timestamp: Date.now(),
        }
        return [...filtered, errorMessage]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccessGranted = () => {
    setHasAccess(true)
    setShowAccessModal(false)
    
    // Initialize session if not already done
    const storedSessionId = localStorage.getItem("sessionId")
    const storedUserId = localStorage.getItem("userId")
    const storedAppName = localStorage.getItem("appName")

    if (storedSessionId && storedUserId && storedAppName) {
      setSessionId(storedSessionId)
      setUserId(storedUserId)
      setAppName(storedAppName)
      initializeChat()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Show access control modal if user doesn't have access
  if (!hasAccess || showAccessModal) {
    return (
      <>
        <AccessControlModal
          isOpen={showAccessModal}
          onAccessGranted={handleAccessGranted}
        />
        <div className="h-full bg-white dark:bg-black text-black dark:text-white flex items-center justify-center transition-colors duration-300">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-4">Astra AI Assistant</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Premium access required to continue</p>
          </div>
        </div>
      </>
    )
  }

  if (!sessionId) {
    return (
      <div className="h-full bg-white dark:bg-black text-black dark:text-white flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Astra AI Assistant</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Please create a session using the "New Session" button in the header</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white dark:bg-black text-black dark:text-white flex flex-col transition-colors duration-300">
      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="w-full space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={cn(
              "flex items-start space-x-3 w-full",
              message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
            )}>
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  message.role === "assistant" 
                    ? "bg-gray-200 dark:bg-gray-800" 
                    : "bg-gray-800 dark:bg-white text-white dark:text-black",
                )}
              >
                {message.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={cn(
                "space-y-2 flex-1",
                message.role === "user" ? "flex flex-col items-end" : "flex flex-col items-start"
              )}>
                <div className={cn(
                  "rounded-lg p-4 border border-gray-300 dark:border-gray-800 max-w-[75%]",
                  message.role === "user" 
                    ? "bg-gray-800 dark:bg-white text-white dark:text-black" 
                    : "bg-gray-100 dark:bg-gray-900/50"
                )}>
                  {message.isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 dark:border-white"></div>
                      <span className="text-gray-600 dark:text-gray-400">Thinking...</span>
                    </div>
                  ) : (
                    <>
                      {/* Only show text content if this isn't a balance or transaction response */}
                      {!message.balanceData && !message.transactionData && (
                        <div className={cn(
                          "whitespace-pre-wrap",
                          message.role === "user" 
                            ? "text-white dark:text-black" 
                            : "text-gray-800 dark:text-gray-100"
                        )}>{message.content}</div>
                      )}
                      
                      {/* Show a brief message for balance responses */}
                      {message.balanceData && (
                        <div className={cn(
                          "text-sm",
                          message.role === "user" 
                            ? "text-white dark:text-black" 
                            : "text-gray-600 dark:text-gray-400"
                        )}>
                          Here's your wallet balance information:
                        </div>
                      )}
                      
                      {/* Show a brief message for transaction responses */}
                      {message.transactionData && (
                        <div className={cn(
                          "text-sm",
                          message.role === "user" 
                            ? "text-white dark:text-black" 
                            : "text-gray-600 dark:text-gray-400"
                        )}>
                          Here are the transaction details:
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Show uploaded images for user messages */}
                  {message.role === "user" && message.images && message.images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image.data}
                            alt={image.displayName}
                            className="max-w-xs max-h-48 rounded-lg border border-gray-400 dark:border-gray-700"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Show generated images for assistant messages */}
                  {message.role === "assistant" && message.generatedImage && (
                    <div className="mt-4 space-y-3">
                      <div className="relative">
                        <img
                          src={`data:image/png;base64,${message.generatedImage.imageBase64}`}
                          alt="Generated visualization"
                          className="max-w-full rounded-lg border border-gray-400 dark:border-gray-700"
                        />
                      </div>
                      {message.generatedImage.responseText && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-100 dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-800">
                          <strong>Image Generation Response:</strong>
                          <div className="mt-1">{message.generatedImage.responseText}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show balance data for assistant messages */}
                  {message.role === "assistant" && message.balanceData && (
                    <div className="mt-4 p-4 bg-gray-900 dark:bg-gray-900 rounded-lg border border-gray-700">
                      <h3 className="text-sm font-medium text-white mb-3">Wallet Balance</h3>
                      <div className="space-y-3">
                        {message.balanceData.tokens.map((token, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-800 dark:bg-gray-800 rounded-lg border border-gray-700">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg">
                                {token.icon && token.icon.startsWith('/') ? (
                                  <img 
                                    src={token.icon} 
                                    alt={token.symbol} 
                                    className="w-6 h-6"
                                  />
                                ) : (
                                  <span className="text-white">{token.icon || '🪙'}</span>
                                )}
                              </div>
                              <div>
                                <div className="text-white font-medium">{token.symbol}</div>
                                <div className="text-sm text-gray-300">{token.name}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-medium">{token.balance}</div>
                              {token.usdValue && (
                                <div className="text-sm text-gray-300">${token.usdValue}</div>
                              )}
                            </div>
                            <div className="ml-3">
                            </div>
                          </div>
                        ))}
                      </div>
                      {message.balanceData.totalUsdValue && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Total Value</span>
                            <span className="text-white font-medium">${message.balanceData.totalUsdValue}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show transaction data for assistant messages */}
                  {message.role === "assistant" && message.transactionData && (
                    <div className="mt-4 p-4 bg-white dark:bg-black rounded-lg border border-gray-300 dark:border-gray-800">
                      <h3 className="text-sm font-medium text-black dark:text-white mb-4 flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-800 dark:bg-white flex items-center justify-center mr-3">
                          🔗
                        </div>
                        Transaction Details
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Transaction Hash */}
                        {message.transactionData.hash && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800 col-span-1 md:col-span-2">
                            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Transaction Hash</div>
                            <div className="text-black dark:text-white font-mono text-sm break-all">
                              {message.transactionData.hash}
                            </div>
                            <button 
                              onClick={() => navigator.clipboard.writeText(message.transactionData!.hash)}
                              className="mt-2 text-xs text-gray-800 dark:text-gray-200 hover:underline"
                            >
                              Copy Hash
                            </button>
                          </div>
                        )}

                        {/* Block Information */}
                        <div className="space-y-3">
                          {message.transactionData.blockNumber && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800">
                              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Block Number</div>
                              <div className="text-black dark:text-white font-medium">
                                #{message.transactionData.blockNumber}
                              </div>
                            </div>
                          )}
                          
                          {message.transactionData.chainId && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800">
                              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Chain ID</div>
                              <div className="text-black dark:text-white font-medium flex items-center">
                                <img src="/lisk.svg" alt="Lisk" className="w-4 h-4 mr-2" />
                                {message.transactionData.chainId}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Transaction Details */}
                        <div className="space-y-3">
                          {message.transactionData.value && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800">
                              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Value</div>
                              <div className="text-black dark:text-white font-medium">
                                {formatTransactionValue(message.transactionData.value)}
                              </div>
                            </div>
                          )}
                          
                          {message.transactionData.gasUsed && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800">
                              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Gas Used</div>
                              <div className="text-black dark:text-white font-medium">
                                {parseInt(message.transactionData.gasUsed).toLocaleString()}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Addresses */}
                        {message.transactionData.from && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800">
                            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">From Address</div>
                            <div className="text-black dark:text-white font-mono text-sm break-all">
                              {message.transactionData.from}
                            </div>
                            <button 
                              onClick={() => navigator.clipboard.writeText(message.transactionData!.from)}
                              className="mt-2 text-xs text-gray-800 dark:text-gray-200 hover:underline"
                            >
                              Copy Address
                            </button>
                          </div>
                        )}

                        {message.transactionData.to && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800">
                            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">To Address</div>
                            <div className="text-black dark:text-white font-mono text-sm break-all">
                              {message.transactionData.to}
                            </div>
                            <button 
                              onClick={() => navigator.clipboard.writeText(message.transactionData!.to)}
                              className="mt-2 text-xs text-gray-800 dark:text-gray-200 hover:underline"
                            >
                              Copy Address
                            </button>
                          </div>
                        )}

                        {/* Additional Details */}
                        <div className="grid grid-cols-2 gap-3 col-span-1 md:col-span-2">
                          {message.transactionData.gasPrice && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800">
                              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Gas Price</div>
                              <div className="text-black dark:text-white font-medium">
                                {formatGasPrice(message.transactionData.gasPrice)}
                              </div>
                            </div>
                          )}
                          
                          {message.transactionData.nonce && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800">
                              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Nonce</div>
                              <div className="text-black dark:text-white font-medium">
                                {message.transactionData.nonce}
                              </div>
                            </div>
                          )}
                          
                          {message.transactionData.transactionIndex && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800">
                              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Transaction Index</div>
                              <div className="text-black dark:text-white font-medium">
                                {message.transactionData.transactionIndex}
                              </div>
                            </div>
                          )}
                          
                          {message.transactionData.type && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800">
                              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Type</div>
                              <div className="text-black dark:text-white font-medium">
                                {message.transactionData.type}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Block Hash */}
                        {message.transactionData.blockHash && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-800 col-span-1 md:col-span-2">
                            <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Block Hash</div>
                            <div className="text-black dark:text-white font-mono text-sm break-all">
                              {message.transactionData.blockHash}
                            </div>
                            <button 
                              onClick={() => navigator.clipboard.writeText(message.transactionData!.blockHash)}
                              className="mt-2 text-xs text-gray-800 dark:text-gray-200 hover:underline"
                            >
                              Copy Block Hash
                            </button>
                          </div>
                        )}
                        
                        {/* Explorer Link */}
                        <div className="col-span-1 md:col-span-2 pt-3 border-t border-gray-300 dark:border-gray-800">
                          <a 
                            href={`https://sepolia-blockscout.lisk.com/tx/0x${message.transactionData!.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-gray-800 dark:text-gray-200 hover:underline text-sm"
                          >
                            View on Lisk Explorer ↗
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-300 dark:border-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          {/* File Uploads */}
          {uploadedFiles.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center space-x-2 bg-gray-200 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-300 dark:border-gray-700">
                    <Paperclip className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-32">{file.displayName}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input Form */}
          <div className="relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message Astra..."
              className="w-full bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-500 pr-20 py-4 text-base rounded-lg focus:border-gray-500 dark:focus:border-gray-600 focus:ring-0"
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors rounded"
                disabled={isLoading}
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <Button
                onClick={sendMessage}
                disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
                size="sm"
                className="bg-gray-800 dark:bg-white text-white dark:text-black hover:bg-gray-700 dark:hover:bg-gray-200 border-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}