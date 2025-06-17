"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowDown, Settings, Clock, Zap, Info, ChevronDown, Check, ExternalLink, Copy, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWallet } from "@/contexts/WalletContext"
import { useWalletAddress } from "@/components/wallet/WalletProtection"

// Token interface for API response
interface Token {
  symbol: string
  name: string
  address: string
  decimals: number
  logoUrl?: string
  hasLogo?: boolean
}

interface SolanaSwapResult {
  success: boolean
  action: string
  timestamp: string
  chainId: string
  code: string
  data: any
  msg: string
}

interface ExecuteResult {
  success: boolean
  transactionId: string
  explorerUrl: string
  timestamp?: string
  tokenInfo: {
    fromToken: { symbol: string; decimals: number; price: string }
    toToken: { symbol: string; decimals: number; price: string }
  }
  swapDetails: {
    fromAmount: string
    fromToken: string
    toToken: string
    slippage: string
  }
  instructionsUsed: number
  lookupTablesUsed: number
}

export default function SolanaSwapPage() {
  // Wallet context
  const { connected, publicKey } = useWallet()
  const walletAddress = useWalletAddress()

  // State for tokens
  const [availableTokens, setAvailableTokens] = useState<Token[]>([])
  const [loadingTokens, setLoadingTokens] = useState(true)
  const [tokensError, setTokensError] = useState<string | null>(null)

  // Add these new state variables after the existing state declarations
  const [isRequestInProgress, setIsRequestInProgress] = useState(false)
  const [lastRequestTime, setLastRequestTime] = useState(0)
  const [retryCount, setRetryCount] = useState(0)

  // State for wallet balances
  const [tokenBalances, setTokenBalances] = useState<Record<string, { balance: string; price: string }>>({})
  const [loadingBalances, setLoadingBalances] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)

  // Default tokens (fallback)
  const defaultTokens: Token[] = [
    { symbol: "SOL", name: "Solana", address: "11111111111111111111111111111111", decimals: 9 },
    { symbol: "USDC", name: "USD Coin", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
  ]

  const [fromToken, setFromToken] = useState<Token>(defaultTokens[0])
  const [toToken, setToToken] = useState<Token>(defaultTokens[1])
  const [fromAmount, setFromAmount] = useState("0.1")
  const [toAmount, setToAmount] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [swapResult, setSwapResult] = useState<SolanaSwapResult | null>(null)
  const [quoteResult, setQuoteResult] = useState<any>(null)
  const [executeResult, setExecuteResult] = useState<ExecuteResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [quoting, setQuoting] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFromTokens, setShowFromTokens] = useState(false)
  const [showToTokens, setShowToTokens] = useState(false)

  // Use real wallet address instead of demo address
  const userWalletAddress = walletAddress || publicKey

  // Function to fetch real wallet balances
  const fetchTokenBalances = async () => {
    if (!userWalletAddress || !connected) {
      console.log("No wallet connected, using demo balances")
      return
    }

    setLoadingBalances(true)
    setBalanceError(null)

    try {
      console.log("Fetching token balances for:", userWalletAddress)

      const response = await fetch("/api/portfolio/total_token_balances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: userWalletAddress,
          chains: "501",
          excludeRiskToken: "0",
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch balances: ${response.status}`)
      }

      const data = await response.json()
      console.log("Balance response:", data)

      if (data.success && data.data && data.data[0]?.tokenAssets) {
        const balances: Record<string, { balance: string; price: string }> = {}
        
        data.data[0].tokenAssets.forEach((token: any) => {
          const balance = token.balance || "0"
          const price = token.tokenPrice || "0"
          
          // Map token addresses to balances
          balances[token.tokenContractAddress] = {
            balance: balance,
            price: price,
          }
          
          // Also map by symbol for easier lookup
          if (token.symbol) {
            balances[token.symbol] = {
              balance: balance,
              price: price,
            }
          }
        })

        setTokenBalances(balances)
        console.log("Updated token balances:", balances)
      } else {
        throw new Error("Invalid balance data received")
      }
    } catch (error: any) {
      console.error("Error fetching token balances:", error)
      setBalanceError(error.message)
    } finally {
      setLoadingBalances(false)
    }
  }

  // Function to get balance for a specific token
  const getTokenBalance = (token: Token): { balance: string; price: string; usdValue: string } => {
    if (!connected || !userWalletAddress) {
      // Return demo balances when not connected
      const demoBalances: Record<string, string> = {
        SOL: "12.45",
        USDC: "350.21",
        USDT: "125.50",
      }
      const demoBalance = demoBalances[token.symbol] || "0.00"
      const demoPrice = token.symbol === "SOL" ? "97.35" : token.symbol === "USDC" ? "1.00" : "1.00"
      const usdValue = (Number(demoBalance) * Number(demoPrice)).toFixed(2)
      
      return {
        balance: demoBalance,
        price: demoPrice,
        usdValue: usdValue,
      }
    }

    // Use real balance data
    const balanceData = tokenBalances[token.address] || tokenBalances[token.symbol] || { balance: "0", price: "0" }
    const balance = Number(balanceData.balance) / Math.pow(10, token.decimals)
    const price = Number(balanceData.price)
    const usdValue = (balance * price).toFixed(2)

    return {
      balance: balance.toFixed(6),
      price: price.toFixed(2),
      usdValue: usdValue,
    }
  }

  // Function to set max amount for from token
  const setMaxAmount = () => {
    const tokenBalance = getTokenBalance(fromToken)
    const maxBalance = tokenBalance.balance
    
    // For SOL, reserve a small amount for transaction fees (0.01 SOL)
    let adjustedMax = Number(maxBalance)
    if (fromToken.symbol === "SOL" && adjustedMax > 0.01) {
      adjustedMax = adjustedMax - 0.01
    }
    
    setFromAmount(Math.max(0, adjustedMax).toFixed(6))
    setSwapResult(null)
    setQuoteResult(null)
    setExecuteResult(null)
    setToAmount("")
  }

  // Replace the fetchSupportedTokens function with this improved version:
  const fetchSupportedTokens = async (isRetry = false) => {
    // Prevent multiple simultaneous requests
    if (isRequestInProgress) {
      console.log("Request already in progress, skipping...")
      return
    }

    // Rate limiting: minimum 2 seconds between requests
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    const minDelay = 2000 // 2 seconds

    if (timeSinceLastRequest < minDelay && !isRetry) {
      console.log("Rate limiting: waiting before next request...")
      setTimeout(() => fetchSupportedTokens(isRetry), minDelay - timeSinceLastRequest)
      return
    }

    setIsRequestInProgress(true)
    setLoadingTokens(true)
    setTokensError(null)
    setLastRequestTime(now)

    try {
      // Add exponential backoff delay for retries
      if (isRetry && retryCount > 0) {
        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000) // Max 10 seconds
        console.log(`Retry attempt ${retryCount}, waiting ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }

      console.log("Fetching supported tokens from OKX API...")

      const response = await fetch("/api/dex-tokens?chainIndex=501", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment before trying again.")
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success && data.tokens && data.tokens.length > 0) {
        setAvailableTokens(data.tokens)
        setRetryCount(0) // Reset retry count on success

        // Update default selections if they exist in the fetched tokens
        const solToken = data.tokens.find((token: Token) => token.symbol === "SOL")
        const usdcToken = data.tokens.find((token: Token) => token.symbol === "USDC")

        if (solToken && fromToken.symbol === "SOL") setFromToken(solToken)
        if (usdcToken && toToken.symbol === "USDC") setToToken(usdcToken)

        console.log(`Successfully loaded ${data.tokens.length} supported tokens from OKX`)
        setTokensError(null)
      } else {
        throw new Error(data.error || "No tokens received from API")
      }
    } catch (error: any) {
      console.error("Error fetching tokens:", error)
      setRetryCount((prev) => prev + 1)

      let errorMessage = error.message
      if (error.message.includes("Rate limit") || error.message.includes("429")) {
        errorMessage = "Too many requests. Please wait a moment before retrying."
      } else if (error.message.includes("fetch")) {
        errorMessage = "Network error. Please check your connection and try again."
      }

      setTokensError(errorMessage)

      // Use default tokens as fallback only if this isn't a retry
      if (!isRetry) {
        console.log("Using default tokens as fallback...")
        setAvailableTokens(defaultTokens)
      }
    } finally {
      setIsRequestInProgress(false)
      setLoadingTokens(false)
    }
  }

  // Replace the useEffect with this improved version:
  useEffect(() => {
    // Add a small delay on initial load to prevent immediate API calls
    const initialDelay = setTimeout(() => {
      fetchSupportedTokens(false)
    }, 500) // 500ms delay on initial load

    return () => clearTimeout(initialDelay)
  }, []) // Remove any dependencies to prevent multiple calls

  // Fetch balances when wallet connects or when tokens change
  useEffect(() => {
    if (connected && userWalletAddress) {
      fetchTokenBalances()
    }
  }, [connected, userWalletAddress, fromToken, toToken])

  // Refresh balances when tokens are updated
  useEffect(() => {
    if (connected && userWalletAddress && availableTokens.length > 0) {
      const timer = setTimeout(() => {
        fetchTokenBalances()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [availableTokens])

  const handleSwapTokens = () => {
    const tempToken = fromToken
    setFromToken(toToken)
    setToToken(tempToken)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
    // Clear previous results
    setSwapResult(null)
    setQuoteResult(null)
    setExecuteResult(null)
  }

  const formatAmount = (amount: string, decimals: number): string => {
    const num = Number.parseFloat(amount || "0")
    return Math.floor(num * Math.pow(10, decimals)).toString()
  }

  const formatDisplayAmount = (amount: string, decimals: number): string => {
    const num = Number.parseFloat(amount || "0")
    return (num / Math.pow(10, decimals)).toFixed(6)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Utility function to format timestamps
  const formatTimestamp = (timestamp: string | number): string => {
    try {
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) {
        return "Invalid date"
      }
      
      // Format as "Dec 17, 2025 at 3:45 PM"
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch (error) {
      console.error('Error formatting timestamp:', error)
      return "Invalid date"
    }
  }

  // Get quote first
  const handleGetQuote = async () => {
    if (!fromAmount || Number.parseFloat(fromAmount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setQuoting(true)
    setError(null)
    setQuoteResult(null)

    try {
      const formattedAmount = formatAmount(fromAmount, fromToken.decimals)

      const params = {
        action: "quote",
        chainId: "501", // Solana
        fromTokenAddress: fromToken.address,
        toTokenAddress: toToken.address,
        amount: formattedAmount,
        slippage: slippage,
        userWalletAddress: userWalletAddress,
      }

      console.log("Quote params:", params)

      const res = await fetch("/api/dex-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })

      const data = await res.json()
      console.log("Quote response:", data)

      if (data.error) {
        setError(data.error)
      } else if (data.success && data.data && data.data.length > 0) {
        // Add timestamp to the quote result
        const quoteWithTimestamp = {
          ...data,
          timestamp: new Date().toISOString()
        }
        setQuoteResult(quoteWithTimestamp)
        // Update estimated receive amount
        const estimatedAmount = formatDisplayAmount(data.data[0].toTokenAmount, toToken.decimals)
        setToAmount(estimatedAmount)
      } else {
        setError(data.msg || "Failed to get quote")
      }
    } catch (e: any) {
      setError(e.message || "Network error occurred")
    } finally {
      setQuoting(false)
    }
  }

  // Get swap instructions
  const handleGetSwapInstructions = async () => {
    if (!fromAmount || Number.parseFloat(fromAmount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setLoading(true)
    setError(null)
    setSwapResult(null)

    try {
      const formattedAmount = formatAmount(fromAmount, fromToken.decimals)

      const params = {
        action: "instructions",
        chainId: "501", // Solana
        fromTokenAddress: fromToken.address,
        toTokenAddress: toToken.address,
        amount: formattedAmount,
        slippage: slippage,
        userWalletAddress: userWalletAddress,
        feePercent: "1",
        priceTolerance: "0",
        autoSlippage: "false",
        pathNum: "3",
      }

      console.log("Swap instruction params:", params)

      const res = await fetch("/api/dex-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })

      const data = await res.json()
      console.log("Swap instructions response:", data)

      if (data.error) {
        setError(data.error)
      } else if (data.success && data.data) {
        // Add timestamp to the swap result
        const swapWithTimestamp = {
          ...data,
          timestamp: new Date().toISOString()
        }
        setSwapResult(swapWithTimestamp)
        // Update estimated receive amount if available
        if (data.data.toTokenAmount) {
          const estimatedAmount = formatDisplayAmount(data.data.toTokenAmount, toToken.decimals)
          setToAmount(estimatedAmount)
        }
      } else {
        setError(data.msg || "Failed to get swap instructions")
      }
    } catch (e: any) {
      setError(e.message || "Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Execute swap
  const handleExecuteSwap = async () => {
    if (!fromAmount || Number.parseFloat(fromAmount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    setExecuting(true)
    setError(null)
    setExecuteResult(null)

    try {
      const formattedAmount = formatAmount(fromAmount, fromToken.decimals)

      const params = {
        action: "execute",
        chainId: "501", // Solana
        fromTokenAddress: fromToken.address,
        toTokenAddress: toToken.address,
        amount: formattedAmount,
        slippage: slippage,
        userWalletAddress: userWalletAddress,
        feePercent: "1",
        priceTolerance: "0",
        autoSlippage: "false",
        pathNum: "3",
      }

      console.log("Execute swap params:", params)

      const res = await fetch("/api/dex-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      })

      const data = await res.json()
      console.log("Execute swap response:", data)

      if (data.error) {
        setError(data.error)
      } else if (data.success) {
        // Add timestamp to the result
        const resultWithTimestamp = {
          ...data,
          timestamp: new Date().toISOString()
        }
        setExecuteResult(resultWithTimestamp)
      } else {
        setError(data.msg || "Failed to execute swap")
      }
    } catch (e: any) {
      setError(e.message || "Network error occurred")
    } finally {
      setExecuting(false)
    }
  }

  // Replace the retry button onClick with this improved handler:
  const handleRetryTokens = () => {
    setRetryCount(0) // Reset retry count for manual retry
    fetchSupportedTokens(true)
  }

  const TokenSelector = ({
    tokens,
    selectedToken,
    onSelect,
    show,
    onToggle,
  }: {
    tokens: Token[]
    selectedToken: Token
    onSelect: (token: Token) => void
    show: boolean
    onToggle: () => void
  }) => (
    <div className="relative z-[9999]">
      <Button
        className="bg-accent/20 hover:bg-accent/30 gap-2 font-medium border-none h-9"
        variant="outline"
        onClick={onToggle}
      >
        <TokenIcon token={selectedToken} />
        {selectedToken.symbol}
        <ChevronDown className="h-4 w-4" />
      </Button>

      {show && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={onToggle}
          />
          <div className="absolute top-full mt-2 right-0 bg-popover border border-border backdrop-blur-sm rounded-lg p-2 min-w-[250px] z-[9999] max-h-80 overflow-y-auto shadow-2xl">
            {loadingTokens ? (
              <div className="text-center py-6 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-3" />
                <div className="text-sm">Loading tokens...</div>
                <div className="text-xs text-muted-foreground/60 mt-1">
                  {isRequestInProgress ? "Fetching from OKX API..." : "Please wait..."}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {tokens.map((token) => (
                  <button
                    key={token.address}
                    className="w-full flex items-center gap-3 p-2 hover:bg-accent/20 rounded text-left text-foreground transition-colors"
                    onClick={() => {
                      onSelect(token)
                      onToggle()
                      // Clear results when token changes
                      setSwapResult(null)
                      setQuoteResult(null)
                      setExecuteResult(null)
                      setToAmount("")
                    }}
                  >
                    <TokenIcon token={token} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-xs text-muted-foreground truncate">{token.name}</div>
                      <div className="text-xs text-muted-foreground/60 font-mono truncate">
                        {token.address.slice(0, 8)}...{token.address.slice(-6)}
                      </div>
                    </div>
                    {selectedToken.address === token.address && (
                      <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {tokensError && (
              <div className="text-center py-4 border-t border-border mt-2">
                <div className="text-destructive text-xs mb-3">{tokensError}</div>
                <div className="flex gap-2 justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={handleRetryTokens}
                    disabled={isRequestInProgress}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isRequestInProgress ? "animate-spin" : ""}`} />
                    {isRequestInProgress ? "Retrying..." : "Retry"}
                  </Button>
                  {retryCount > 0 && <div className="text-xs text-muted-foreground/60 self-center">Attempt {retryCount}</div>}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-600 text-transparent bg-clip-text mb-1">
            Solana Swap
          </h1>
          <p className="text-muted-foreground">
            {loadingTokens
              ? "Loading supported tokens..."
              : `Trade tokens on Solana with best rates • ${availableTokens.length} tokens available`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={handleRetryTokens}
            disabled={loadingTokens || isRequestInProgress}
          >
            <RefreshCw className={`h-4 w-4 ${loadingTokens ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full">
            <Clock className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="backdrop-blur-sm bg-background/40 dark:bg-black/20 border border-border rounded-xl hover:border-border/80 dark:hover:border-white/20 transition-all hover:shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">From</span>
            <div className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full border border-purple-500/30">
              <span className="text-xs text-purple-300 font-medium">Solana</span>
            </div>
          </div>
          <div className="flex justify-between items-center mb-2">
            <input
              type="text"
              value={fromAmount}
              onChange={(e) => {
                setFromAmount(e.target.value)
                setSwapResult(null)
                setQuoteResult(null)
                setExecuteResult(null)
                setToAmount("")
              }}
              className="text-2xl font-medium bg-transparent outline-none w-[60%] text-foreground"
              placeholder="0.0"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={setMaxAmount}
              >
                MAX
              </Button>
              <TokenSelector
                tokens={availableTokens}
                selectedToken={fromToken}
                onSelect={setFromToken}
                show={showFromTokens}
                onToggle={() => setShowFromTokens(!showFromTokens)}
              />
            </div>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {(() => {
              const tokenBalance = getTokenBalance(fromToken)
              return `Balance: ${loadingBalances ? "Loading..." : tokenBalance.balance} ${fromToken.symbol} • $${tokenBalance.usdValue}`
            })()}
          </div>
        </div>

        <div className="flex justify-center -mt-2 -mb-2 z-10 relative">
          <Button
            onClick={handleSwapTokens}
            size="icon"
            className="rounded-full h-10 w-10 shadow-md bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border border-accent/30 hover:border-accent/50"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">To</span>
            <div className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full border border-purple-500/30">
              <span className="text-xs text-purple-300 font-medium">Solana</span>
            </div>
          </div>
          <div className="flex justify-between items-center mb-2">
            <input
              type="text"
              value={toAmount}
              className="text-2xl font-medium bg-transparent outline-none w-[60%] text-foreground"
              placeholder="0.0"
              readOnly
            />
            <TokenSelector
              tokens={availableTokens}
              selectedToken={toToken}
              onSelect={setToToken}
              show={showToTokens}
              onToggle={() => setShowToTokens(!showToTokens)}
            />
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {(() => {
              const tokenBalance = getTokenBalance(toToken)
              return `Balance: ${loadingBalances ? "Loading..." : tokenBalance.balance} ${toToken.symbol} • $${tokenBalance.usdValue}`
            })()}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="backdrop-blur-sm bg-background/40 dark:bg-black/20 border border-border rounded-xl p-5 hover:border-border/80 dark:hover:border-white/20 transition-all hover:shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-foreground font-medium">Transaction Settings</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">Slippage Tolerance</span>
                <button className="text-muted-foreground hover:text-foreground">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                {["0.1", "0.5", "1.0", "3.0"].map((value) => (
                  <Button
                    key={value}
                    variant="outline"
                    size="sm"
                    className={`h-7 px-2.5 py-1 text-xs ${
                      slippage === value ? "bg-purple-500/20 border-purple-500/40" : ""
                    }`}
                    onClick={() => setSlippage(value)}
                  >
                    {value}%
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Network</span>
              <span className="text-sm text-foreground font-medium">Solana Mainnet</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">DEX Aggregator</span>
              <span className="text-sm text-foreground font-medium">OKX</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Supported Tokens</span>
              <span className="text-sm text-foreground font-medium">{availableTokens.length} tokens</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-6">
        <Button
          className="py-6 text-sm gap-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 border border-purple-500/30 hover:border-purple-500/50 shadow-lg backdrop-blur-sm"
          size="lg"
          onClick={handleGetQuote}
          disabled={quoting || !fromAmount || Number.parseFloat(fromAmount) <= 0}
        >
          <Info className="h-4 w-4" />
          {quoting ? "Getting..." : "Quote"}
        </Button>

        <Button
          className="py-6 text-sm gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30 hover:border-blue-500/50 shadow-lg backdrop-blur-sm"
          size="lg"
          onClick={handleGetSwapInstructions}
          disabled={loading || !fromAmount || Number.parseFloat(fromAmount) <= 0}
        >
          <Clock className="h-4 w-4" />
          {loading ? "Loading..." : "Prepare"}
        </Button>

        <Button
          className="py-6 text-sm gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 hover:border-green-500/50 shadow-lg backdrop-blur-sm"
          size="lg"
          onClick={handleExecuteSwap}
          disabled={executing || !fromAmount || Number.parseFloat(fromAmount) <= 0}
        >
          <Zap className="h-4 w-4" />
          {executing ? "Executing..." : "Execute"}
        </Button>
      </div>

      {error && (
        <Card className="mt-4 bg-destructive/10 border-destructive/30">
          <CardContent className="p-4">
            <div className="text-destructive text-sm">
              <strong>Error:</strong> {error}
            </div>
          </CardContent>
        </Card>
      )}

      {quoteResult && !error && (
        <Card className="mt-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-foreground text-lg flex items-center gap-2">
              <Info className="h-5 w-5" />
              Swap Quote
              {quoteResult.timestamp && (
                <span className="text-xs text-muted-foreground ml-auto font-normal">
                  Generated {formatTimestamp(quoteResult.timestamp)}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quoteResult.data.map((quote: any, index: number) => (
              <div key={index} className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">You Pay:</span>
                    <div className="text-foreground font-medium">
                      {formatDisplayAmount(quote.fromTokenAmount, fromToken.decimals)} {fromToken.symbol}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">You Receive:</span>
                    <div className="text-foreground font-medium">
                      {formatDisplayAmount(quote.toTokenAmount, toToken.decimals)} {toToken.symbol}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Rate:</span>
                    <div className="text-foreground font-medium">
                      1 {fromToken.symbol} = {(Number(quote.toTokenAmount) / Number(quote.fromTokenAmount)).toFixed(4)}{" "}
                      {toToken.symbol}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price Impact:</span>
                    <div className="text-green-400 font-medium">{"< 0.1%"}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {swapResult && !error && (
        <Card className="mt-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-foreground text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Swap Instructions Ready
              {swapResult.timestamp && (
                <span className="text-xs text-muted-foreground ml-auto font-normal">
                  Created {formatTimestamp(swapResult.timestamp)}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">You Pay:</span>
                  <div className="text-foreground font-medium">
                    {formatDisplayAmount(swapResult.data.fromTokenAmount, fromToken.decimals)} {fromToken.symbol}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">You Receive:</span>
                  <div className="text-foreground font-medium">
                    {formatDisplayAmount(swapResult.data.toTokenAmount, toToken.decimals)} {toToken.symbol}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Minimum Received:</span>
                  <div className="text-foreground font-medium">
                    {formatDisplayAmount(swapResult.data.minimumReceived, toToken.decimals)} {toToken.symbol}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Instructions:</span>
                  <div className="text-foreground font-medium">{swapResult.data.instructionLists.length} steps</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <div className="text-foreground font-medium">{formatTimestamp(swapResult.timestamp)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="text-foreground font-medium">{swapResult.action}</div>
                </div>
              </div>

              <div className="bg-accent/10 rounded-lg p-3">
                <div className="text-foreground font-medium mb-2">Solana Transaction Details</div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Instructions:</span>
                    <span className="text-foreground">{swapResult.data.instructionLists.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lookup Tables:</span>
                    <span className="text-foreground">{swapResult.data.addressLookupTableAccount.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">From Token Price:</span>
                    <span className="text-foreground">${swapResult.data.fromToken.tokenUnitPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To Token Price:</span>
                    <span className="text-foreground">${swapResult.data.toToken.tokenUnitPrice}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {executeResult && !error && (
        <Card className="mt-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-foreground text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-400" />
              Swap Executed Successfully!
              {executeResult.timestamp && (
                <span className="text-xs text-muted-foreground ml-auto font-normal">
                  Completed {formatTimestamp(executeResult.timestamp)}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Swapped:</span>
                  <div className="text-foreground font-medium">
                    {formatDisplayAmount(
                      executeResult.swapDetails.fromAmount,
                      executeResult.tokenInfo.fromToken.decimals,
                    )}{" "}
                    {executeResult.swapDetails.fromToken}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">For:</span>
                  <div className="text-foreground font-medium">{executeResult.swapDetails.toToken}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Instructions Used:</span>
                  <div className="text-foreground font-medium">{executeResult.instructionsUsed}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Lookup Tables:</span>
                  <div className="text-foreground font-medium">{executeResult.lookupTablesUsed}</div>
                </div>
                {executeResult.timestamp && (
                  <div>
                    <span className="text-muted-foreground">Executed:</span>
                    <div className="text-foreground font-medium">{formatTimestamp(executeResult.timestamp)}</div>
                  </div>
                )}
              </div>

              <div className="bg-accent/10 rounded-lg p-3">
                <div className="text-foreground font-medium mb-2">Transaction Details</div>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Transaction ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-mono text-xs">
                        {executeResult.transactionId.slice(0, 8)}...{executeResult.transactionId.slice(-8)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(executeResult.transactionId)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {executeResult.timestamp && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction Time:</span>
                      <span className="text-foreground text-xs">{formatTimestamp(executeResult.timestamp)}</span>
                    </div>
                  )}
                  <div className="flex justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-500/30 hover:bg-green-500/10 text-green-400 gap-2"
                      onClick={() => window.open(executeResult.explorerUrl, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on Solscan
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <div className="text-green-400 font-medium mb-2 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Transaction Confirmed
                </div>
                <div className="text-sm text-green-300 dark:text-green-200">
                  Your swap has been successfully executed on Solana. The transaction has been confirmed and is now
                  visible on the blockchain.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-5 text-center">
        <p className="text-xs text-muted-foreground/60">
          Powered by OKX DEX Aggregator on Solana. Best rates across all Solana DEXs.
        </p>
      </div>
    </div>
  )
}

function TokenIcon({ token }: { token: Token }) {
  // If token has a logo URL, use it
  if (token.logoUrl && token.hasLogo) {
    return (
      <div className="w-5 h-5 rounded-full overflow-hidden bg-accent/20 flex items-center justify-center">
        <img
          src={token.logoUrl || "/placeholder.svg"}
          alt={token.symbol}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to gradient if image fails to load
            const target = e.target as HTMLImageElement
            target.style.display = "none"
            target.parentElement!.innerHTML = `<div class="w-5 h-5 rounded-full ${getTokenGradient(token.symbol)} flex items-center justify-center text-white text-xs font-bold">${token.symbol.slice(0, 2)}</div>`
          }}
        />
      </div>
    )
  }

  // Fallback to gradient background with token symbol
  return (
    <div
      className={`w-5 h-5 rounded-full ${getTokenGradient(token.symbol)} flex items-center justify-center text-white text-xs font-bold`}
    >
      {token.symbol.slice(0, 2)}
    </div>
  )
}

function getTokenGradient(symbol: string): string {
  const colors: Record<string, string> = {
    SOL: "bg-gradient-to-r from-purple-500 to-blue-500",
    USDC: "bg-blue-500",
    USDT: "bg-green-500",
    RAY: "bg-gradient-to-r from-blue-400 to-purple-500",
    SRM: "bg-gradient-to-r from-cyan-400 to-blue-500",
    ORCA: "bg-gradient-to-r from-pink-400 to-purple-500",
    MNGO: "bg-gradient-to-r from-yellow-400 to-orange-500",
    STEP: "bg-gradient-to-r from-green-400 to-blue-500",
    COPE: "bg-gradient-to-r from-red-400 to-pink-500",
    FIDA: "bg-gradient-to-r from-indigo-400 to-purple-500",
  }
  return colors[symbol] || "bg-gradient-to-r from-gray-500 to-gray-600"
}
