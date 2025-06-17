"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useWallet } from "@/contexts/WalletContext"
import { useWalletAddress } from "@/components/wallet/WalletProtection"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Download,
  Calendar,
  DollarSign,
  Coins,
  Activity,
  ChevronDown,
  Search,
  RefreshCw,
  Eye,
  X,
  BarChart3,
  Loader2,
} from "lucide-react"

// Enhanced chain configuration
const AVAILABLE_CHAINS = [{ id: "501", name: "Solana", label: "SOL", color: "from-purple-500 to-blue-500" }]

const TIME_PERIODS = [
  { label: "24H", value: "24h" },
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "1Y", value: "1y" },
]

// Real Solana address for sample data when wallet is not connected
const SAMPLE_SOLANA_ADDRESS = "52C9T2T7JRojtxumYnYZhyUmrN7kqzvCLc4Ksvjk7TxD"

// Get dynamic address - use connected wallet address or fall back to sample address
const getDynamicAddress = (walletAddress?: string | null): string => {
  return walletAddress || SAMPLE_SOLANA_ADDRESS
}

// Rate limiting manager
class RateLimitManager {
  private queue: Array<() => Promise<any>> = []
  private isProcessing = false
  private minDelay = 3000 // 3 seconds between requests
  private maxRetries = 3

  async addRequest<T>(requestFn: () => Promise<T>, retries = 0): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn()
          resolve(result)
        } catch (error: any) {
          if (error.status === 429 && retries < this.maxRetries) {
            // Rate limited, retry with exponential backoff
            const delay = this.minDelay * Math.pow(2, retries)
            console.log(`Rate limited, retrying in ${delay}ms...`)
            setTimeout(() => {
              this.addRequest(requestFn, retries + 1)
                .then(resolve)
                .catch(reject)
            }, delay)
          } else {
            reject(error)
          }
        }
      })

      if (!this.isProcessing) {
        this.processQueue()
      }
    })
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return

    this.isProcessing = true

    while (this.queue.length > 0) {
      const request = this.queue.shift()
      if (request) {
        try {
          await request()
        } catch (error) {
          console.error("Request failed:", error)
        }

        // Wait before processing next request
        if (this.queue.length > 0) {
          await new Promise((resolve) => setTimeout(resolve, this.minDelay))
        }
      }
    }

    this.isProcessing = false
  }
}

const rateLimitManager = new RateLimitManager()

// Filter function to remove tokens with zero value or zero price
function filterValidTokens(
  tokens: any[],
  criteria = { minValue: 0.01, minPrice: 0, minBalance: 0, showZeroBalance: false },
): any[] {
  if (!Array.isArray(tokens)) return []

  return tokens.filter((token) => {
    try {
      const balance = Number(token?.balance || 0)
      const price = Number(token?.tokenPrice || 0)
      const value = balance * price

      // Apply filtering criteria
      if (!criteria.showZeroBalance && balance <= criteria.minBalance) return false
      if (price <= criteria.minPrice) return false
      if (value < criteria.minValue) return false

      return true
    } catch (error) {
      console.warn("Error filtering token:", token, error)
      return false
    }
  })
}

// Filter function for transactions with non-zero amounts
function filterValidTransactions(transactions: any[]): any[] {
  if (!Array.isArray(transactions)) return []

  return transactions.filter((tx) => {
    try {
      const amount = Number(tx?.amount || 0)
      return Math.abs(amount) > 0 // Only show transactions with non-zero amounts
    } catch (error) {
      console.warn("Error filtering transaction:", tx, error)
      return false
    }
  })
}

// Helper function to format timestamp to readable date
function formatTimestamp(timestamp: string | number): string {
  try {
    let date: Date
    const numTimestamp = Number(timestamp)

    // Check if timestamp is in seconds (length ~10 digits) or milliseconds (length ~13 digits)
    if (numTimestamp.toString().length <= 10) {
      // Timestamp is in seconds, convert to milliseconds
      date = new Date(numTimestamp * 1000)
    } else {
      // Timestamp is already in milliseconds
      date = new Date(numTimestamp)
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date"
    }

    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } catch (error) {
    return "Invalid date"
  }
}

export default function PortfolioPage() {
  const { connected, publicKey } = useWallet()
  const walletAddress = useWalletAddress()
  const [activeModal, setActiveModal] = useState<null | string>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState("")
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [tokenBalances, setTokenBalances] = useState<any[]>([])
  const [filteredTokenBalances, setFilteredTokenBalances] = useState<any[]>([])
  const [filteredHistory, setFilteredHistory] = useState<any[]>([])
  const [totalValue, setTotalValue] = useState<string>("0")
  const [specificToken, setSpecificToken] = useState<any[]>([])
  const [selectedTable, setSelectedTable] = useState<"balances" | "history" | "specific" | "total_value">("balances")
  const [selectedChains, setSelectedChains] = useState<string[]>(["501"])
  const [selectedPeriod, setSelectedPeriod] = useState("30d")
  const [searchTerm, setSearchTerm] = useState("")
  const [showChainDropdown, setShowChainDropdown] = useState(false)
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)
  const [portfolioStats, setPortfolioStats] = useState({
    totalValue: "0",
    tokenCount: "0",
    transactionCount: "0",
    portfolioDiversity: "0",
    dayChangePercent: "0",
    diversityScore: "0",
    activeTokens: "0",
    filteredTokens: "0",
    totalTokens: "0",
  })

  // Get dynamic address based on wallet connection
  const currentAddress = getDynamicAddress(walletAddress || publicKey)

  // Toggle chain selection for multi-select
  const toggleChain = (chainId: string) => {
    setSelectedChains((prev) => (prev.includes(chainId) ? prev.filter((c) => c !== chainId) : [...prev, chainId]))
  }

  // Calculate real portfolio statistics from actual data
  const calculateRealStats = (balances: any[], transactions: any[], totalVal: string) => {
    const total = Number(totalVal)
    const allTokenCount = balances.length
    const filteredTokens = filterValidTokens(balances)
    const filteredTransactions = filterValidTransactions(transactions)
    const activeTokenCount = filteredTokens.length
    const transactionCount = filteredTransactions.length

    // Calculate portfolio diversity (number of different tokens with value > $1)
    const significantTokens = filteredTokens.filter((token) => {
      const value = Number(token.balance || 0) * Number(token.tokenPrice || 0)
      return value > 1
    }).length

    // Calculate diversity score (0-100 based on token distribution)
    const diversityScore = Math.min(100, (significantTokens / Math.max(activeTokenCount, 1)) * 100)

    // Calculate recent activity (transactions in last 24h - mock for now)
    const recentActivity = Math.min(100, (transactionCount / 10) * 100)

    // Calculate total value from filtered tokens
    const calculatedValue = filteredTokens.reduce((sum, token) => {
      const value = Number(token.balance || 0) * Number(token.tokenPrice || 0)
      return sum + value
    }, 0)

    const finalTotalValue = Number(totalVal) > 0 ? totalVal : calculatedValue.toString()

    setPortfolioStats({
      totalValue: finalTotalValue,
      tokenCount: allTokenCount.toString(),
      transactionCount: transactionCount.toString(),
      portfolioDiversity: diversityScore.toFixed(1),
      dayChangePercent: recentActivity.toFixed(1),
      diversityScore: diversityScore.toFixed(1),
      activeTokens: significantTokens.toString(),
      filteredTokens: activeTokenCount.toString(),
      totalTokens: allTokenCount.toString(),
    })

    // Update filtered data
    setFilteredTokenBalances(filteredTokens)
    setFilteredHistory(filteredTransactions)
  }

  // Enhanced fetch function with rate limiting
  const fetchWithRateLimit = async (url: string, options: RequestInit) => {
    return rateLimitManager.addRequest(async () => {
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return response.json()
    })
  }

  // Fetch all portfolio data with sequential loading using dynamic address
  const fetchPortfolioData = async () => {
    setLoading(true)
    setLoadingProgress(0)

    try {
      console.log(
        "Fetching portfolio data for address:",
        currentAddress,
        connected ? "(Connected wallet)" : "(Sample data)",
      )

      // Step 1: Fetch transaction history
      setLoadingStep("Loading transaction history...")
      setLoadingProgress(25)

      const historyJson = await fetchWithRateLimit("/api/portfolio/history_by_add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: currentAddress,
          chains: "501",
          limit: "50",
        }),
      })

      const transactions = historyJson?.data?.[0]?.transactionList || historyJson?.data?.[0]?.transactions || []
      setHistory(transactions)

      // Step 2: Fetch token balances
      setLoadingStep("Loading token balances...")
      setLoadingProgress(50)

      const balancesJson = await fetchWithRateLimit("/api/portfolio/total_token_balances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: currentAddress,
          chains: "501",
          excludeRiskToken: "0",
        }),
      })

      const balances = balancesJson?.data?.[0]?.tokenAssets || []
      setTokenBalances(balances)

      // Step 3: Fetch total portfolio value
      setLoadingStep("Calculating portfolio value...")
      setLoadingProgress(75)

      const valueJson = await fetchWithRateLimit("/api/portfolio/token_value", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: currentAddress,
          chains: "501",
          excludeRiskToken: "0",
        }),
      })

      const value = valueJson?.data?.[0]?.totalValue || "0"
      setTotalValue(value)

      // Step 4: Fetch specific token data
      setLoadingStep("Loading specific token data...")
      setLoadingProgress(90)

      const specificJson = await fetchWithRateLimit("/api/portfolio/specific_token_balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: currentAddress,
          tokenContractAddresses: [
            {
              chainIndex: "501",
              tokenContractAddress: "",
            },
          ],
        }),
      })

      const specific = specificJson?.data?.[0]?.tokenAssets || []
      setSpecificToken(specific)

      // Calculate real statistics with filtering
      setLoadingStep("Filtering and calculating portfolio statistics...")
      setLoadingProgress(100)
      calculateRealStats(balances, transactions, value)
    } catch (error) {
      console.error("Error fetching portfolio data:", error)
      setLoadingStep("Error loading data. Please try again.")
    } finally {
      setLoading(false)
      setLoadingStep("")
      setLoadingProgress(0)
    }
  }

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchPortfolioData()
    setRefreshing(false)
  }

  // Export functionality
  const handleExport = () => {
    const data = {
      portfolioStats,
      tokenBalances: filteredTokenBalances, // Export filtered data
      allTokenBalances: tokenBalances, // Also include raw data
      transactions: filteredHistory, // Export filtered transactions
      allTransactions: history, // Also include raw data
      exportDate: new Date().toISOString(),
      selectedChains,
      walletInfo: {
        connected,
        address: currentAddress,
        isConnectedWallet: connected,
        isSampleData: !connected,
      },
      filterInfo: {
        totalTokens: tokenBalances.length,
        filteredTokens: filteredTokenBalances.length,
        totalTransactions: history.length,
        filteredTransactions: filteredHistory.length,
      },
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `portfolio-export-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Filter data based on search term (using filtered data)
  const filteredData = () => {
    let data: any[] = []

    if (selectedTable === "balances") {
      data = filteredTokenBalances.filter(
        (asset) =>
          asset.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          asset.tokenContractAddress?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    } else if (selectedTable === "history") {
      data = filteredHistory.filter(
        (tx) =>
          tx.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.txHash?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply sorting for token balances
    if (selectedTable === "balances" && data.length > 0) {
      data.sort((a, b) => {
        // Default sort by value descending
        const aVal = Number(a.balance || 0) * Number(a.tokenPrice || 0)
        const bVal = Number(b.balance || 0) * Number(b.tokenPrice || 0)
        return bVal - aVal // Descending order
      })
    }

    return data
  }

  // Watch for wallet connection changes and refresh data
  useEffect(() => {
    const refreshDataOnWalletChange = async () => {
      try {
        console.log("Wallet connection status changed. Connected:", connected, "PublicKey:", publicKey)

        // Add a small delay to ensure wallet context has fully updated
        setTimeout(async () => {
          await fetchPortfolioData()
        }, 1000)
      } catch (error) {
        console.error("Failed to refresh data on wallet change:", error)
      }
    }

    // Only trigger refresh if we've already loaded data once (avoid double loading on initial mount)
    if (tokenBalances.length > 0 || history.length > 0) {
      refreshDataOnWalletChange()
    }
  }, [connected, publicKey]) // Watch for changes in wallet connection status

  useEffect(() => {
    // Add initial delay to prevent immediate API calls
    const timer = setTimeout(() => {
      fetchPortfolioData()
    }, 1000)

    return () => clearTimeout(timer)
  }, [selectedChains])

  const getChainInfo = (chainId: string) => {
    return AVAILABLE_CHAINS.find((chain) => chain.id === chainId) || AVAILABLE_CHAINS[0]
  }

  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 text-transparent bg-clip-text mb-2">
            Portfolio
          </h1>
          <p className="text-muted-foreground">
            Track and manage your Solana assets
            {connected ? (
              <span className="ml-2 text-emerald-500">• Connected Wallet</span>
            ) : (
              <span className="ml-2 text-amber-500">• Sample Data</span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
              disabled={loading}
            >
              <Calendar className="h-4 w-4" />
              {TIME_PERIODS.find((p) => p.value === selectedPeriod)?.label}
              <ChevronDown className="h-4 w-4" />
            </Button>
            {showPeriodDropdown && (
              <div className="absolute top-full mt-2 right-0 bg-card border border-border rounded-lg p-2 min-w-[120px] z-50 backdrop-blur-sm">
                {TIME_PERIODS.map((period) => (
                  <button
                    key={period.value}
                    className="w-full text-left p-2 hover:bg-muted/50 rounded text-foreground text-sm"
                    onClick={() => {
                      setSelectedPeriod(period.value)
                      setShowPeriodDropdown(false)
                    }}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExport}
            disabled={loading}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading Progress */}
      {loading && (
        <Card className="bg-card/50 border-border">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground/80">{loadingStep}</span>
                <span className="text-muted-foreground">{loadingProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing API requests with rate limiting...
                <span className="text-muted-foreground/60">({connected ? "Connected wallet data" : "Sample data"})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real Portfolio Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PortfolioCard
          title="Total Value"
          value={`$${Number(portfolioStats.totalValue).toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          change={`${portfolioStats.filteredTokens} active tokens`}
          trend="up"
          icon={DollarSign}
          gradientFrom="#8B5CF6"
          gradientTo="#3B82F6"
        />
        <PortfolioCard
          title="Active Tokens"
          value={portfolioStats.filteredTokens}
          change={`${portfolioStats.totalTokens} total tokens`}
          trend="up"
          icon={Coins}
          gradientFrom="#EC4899"
          gradientTo="#8B5CF6"
        />
        <PortfolioCard
          title="Transactions"
          value={portfolioStats.transactionCount}
          change={`${portfolioStats.dayChangePercent}% activity`}
          trend="up"
          icon={Activity}
          gradientFrom="#F59E0B"
          gradientTo="#EF4444"
        />
        <PortfolioCard
          title="Portfolio Health"
          value={`${portfolioStats.portfolioDiversity}%`}
          change={`${portfolioStats.activeTokens} significant tokens`}
          trend="up"
          icon={BarChart3}
          gradientFrom="#10B981"
          gradientTo="#3B82F6"
        />
      </div>

      {/* Controls */}
      <Card className="bg-card/50 border-border hover:border-border/80 transition-all relative overflow-visible">
        <CardContent className="p-6 overflow-visible">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 items-center">
              <select
                className="bg-card/50 border border-border rounded-lg px-4 py-2 text-foreground backdrop-blur-sm hover:border-border/80 transition-colors"
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value as any)}
                disabled={loading}
              >
                <option value="balances">Active Token Balances ({filteredTokenBalances.length})</option>
                <option value="history">Transaction History ({filteredHistory.length})</option>
                <option value="specific">Specific Token Balance</option>
              </select>
              <Button
                onClick={() => setActiveModal("details")}
                variant="outline"
                size="sm"
                className="border-border dark:border-white/20 hover:bg-accent dark:hover:bg-white/10 text-foreground dark:text-white gap-2"
                disabled={loading}
              >
                <Eye className="h-4 w-4" />
                Show Details
              </Button>
            </div>
            <div className="flex gap-3 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/40 dark:text-white/40" />
                <input
                  type="text"
                  placeholder="Search tokens, addresses, or transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={loading}
                  className="bg-card/50 border border-border rounded-lg pl-10 pr-4 py-2 text-foreground backdrop-blur-sm hover:border-border/80 transition-colors disabled:opacity-50 w-80"
                />
              </div>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-muted-foreground dark:text-white/60" />
                <span className="text-sm text-muted-foreground dark:text-white/70">Chain:</span>
                <div className="flex gap-2">
                  {AVAILABLE_CHAINS.map((chain) => {
                    const isSelected = selectedChains.includes(chain.id)
                    return (
                      <button
                        key={chain.id}
                        onClick={() => !loading && toggleChain(chain.id)}
                        disabled={loading}
                        className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                          isSelected
                            ? "bg-accent dark:bg-white/15 text-foreground dark:text-white border border-border dark:border-white/20"
                            : "bg-card/50 dark:bg-white/5 text-muted-foreground dark:text-white/60 hover:bg-accent/50 dark:hover:bg-white/10 border border-transparent"
                        } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {chain.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Data Table */}
      <Card className="bg-background/50 dark:bg-black/20 border-border dark:border-white/10 hover:border-border/80 dark:hover:border-white/20 transition-all hover:shadow-xl relative z-10">
        <CardHeader>
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 dark:from-white dark:to-white/80 text-transparent bg-clip-text">
            {selectedTable === "balances" && `Active Portfolio Breakdown (${filteredTokenBalances.length} tokens)`}
            {selectedTable === "history" && `Active Transaction History (${filteredHistory.length} transactions)`}
            {selectedTable === "specific" && "Specific Token Balance"}
            {!connected && <span className="ml-2 text-sm text-orange-600 dark:text-orange-400 font-normal">• Sample Data</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center text-muted-foreground dark:text-white/60 py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="mb-2">{loadingStep}</p>
                <div className="w-48 mx-auto bg-accent/50 dark:bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : selectedTable === "balances" ? (
              <TokenBalancesTable assets={filteredData()} />
            ) : selectedTable === "history" ? (
              <HistoryTable transactions={filteredData()} />
            ) : selectedTable === "specific" ? (
              <TokenBalancesTable assets={filterValidTokens(specificToken)} />
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Modal for details */}
      {activeModal === "details" && (
        <Modal onClose={() => setActiveModal(null)}>
          <div className="p-6 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-white/80 text-transparent bg-clip-text">
              Portfolio API Data
            </h2>
            <div className="space-y-4">
              <div className="bg-black/50 p-4 rounded-lg border border-white/10">
                <h3 className="font-semibold mb-2 text-purple-400">Wallet Information</h3>
                <div className="text-xs text-white/80">
                  <p>Connected: {connected ? "Yes" : "No"}</p>
                  <p>Address: {currentAddress}</p>
                  <p>Data Type: {connected ? "Real wallet data" : "Sample data"}</p>
                  <p>Last Updated: {new Date().toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-black/50 p-4 rounded-lg border border-white/10">
                <h3 className="font-semibold mb-2 text-purple-400">Portfolio Statistics</h3>
                <pre className="text-xs overflow-x-auto text-white/80">{JSON.stringify(portfolioStats, null, 2)}</pre>
              </div>
              <div className="bg-black/50 p-4 rounded-lg border border-white/10">
                <h3 className="font-semibold mb-2 text-blue-400">
                  Active Token Balances ({filteredTokenBalances.length} of {tokenBalances.length})
                </h3>
                <pre className="text-xs overflow-x-auto text-white/80 max-h-40">
                  {JSON.stringify(filteredTokenBalances.slice(0, 5), null, 2)}
                </pre>
              </div>
              <div className="bg-black/50 p-4 rounded-lg border border-white/10">
                <h3 className="font-semibold mb-2 text-green-400">
                  Active Transactions ({filteredHistory.length} of {history.length})
                </h3>
                <pre className="text-xs overflow-x-auto text-white/80 max-h-40">
                  {JSON.stringify(filteredHistory.slice(0, 3), null, 2)}
                </pre>
              </div>
              <div className="bg-black/50 p-4 rounded-lg border border-white/10">
                <h3 className="font-semibold mb-2 text-orange-400">Filter Information</h3>
                <div className="text-xs text-white/80">
                  <p>Total Tokens: {tokenBalances.length}</p>
                  <p>Active Tokens (filtered): {filteredTokenBalances.length}</p>
                  <p>Total Transactions: {history.length}</p>
                  <p>Active Transactions (filtered): {filteredHistory.length}</p>
                  <p>
                    Filter Criteria: Balance {">"} 0, Price {">"} 0, Value {"<"} $0.01
                  </p>
                  <p>Address Source: {connected ? "Connected Wallet" : "Sample Address"}</p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function PortfolioCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
  gradientFrom,
  gradientTo,
}: {
  title: string
  value: string
  change: string
  trend: "up" | "down"
  icon: any
  gradientFrom: string
  gradientTo: string
}) {
  return (
    <div className="relative group">
      <div
        className="absolute inset-0 bg-gradient-to-r rounded-xl blur-sm opacity-20 group-hover:opacity-30 transition-opacity"
        style={{ backgroundImage: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})` }}
      ></div>
      <div className="relative h-full backdrop-blur-sm bg-card border border-border rounded-xl p-6 overflow-hidden group-hover:border-border/80 transition-all group-hover:shadow-xl">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
            <div className="flex items-center mt-1">
              <span className="text-xs text-muted-foreground/80">{change}</span>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 backdrop-blur-sm border border-border/50">
            <Icon className="h-5 w-5 text-foreground/80" />
          </div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r opacity-60"
          style={{ backgroundImage: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})` }}
        ></div>
      </div>
    </div>
  )
}

function TokenBalancesTable({ assets }: { assets: any[] }) {
  if (!assets.length)
    return (
      <div className="text-center py-12">
        <Coins className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
        <p className="text-muted-foreground">No active token balances found.</p>
        <p className="text-muted-foreground/60 text-sm mt-2">
          All tokens have been filtered out (zero balance, zero price, or value {"<"} $0.01)
        </p>
      </div>
    )

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-border/40">
          <th className="text-left pb-4 text-muted-foreground font-medium">Asset</th>
          <th className="text-right pb-4 text-muted-foreground font-medium">Chain</th>
          <th className="text-right pb-4 text-muted-foreground font-medium">Price</th>
          <th className="text-right pb-4 text-muted-foreground font-medium">Holdings</th>
          <th className="text-right pb-4 text-muted-foreground font-medium">Value</th>
        </tr>
      </thead>
      <tbody>
        {assets.map((asset, idx) => {
          const chainInfo = AVAILABLE_CHAINS.find((c) => c.id === asset.chainIndex) || AVAILABLE_CHAINS[0]
          const balance = Number(asset.balance || 0)
          const price = Number(asset.tokenPrice || 0)
          const tokenValue = balance * price

          return (
            <tr key={idx} className="border-b border-border/20 hover:bg-muted/50 transition-colors group">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full bg-gradient-to-r ${chainInfo.color} flex items-center justify-center`}
                  >
                    <span className="text-background text-xs font-bold">{asset.symbol?.slice(0, 2) || "TK"}</span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground group-hover:text-foreground/90">{asset.symbol || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{asset.tokenContractAddress?.slice(0, 10)}...</p>
                  </div>
                </div>
              </td>
              <td className="text-right py-4">
                <span
                  className={`px-2 py-1 bg-gradient-to-r ${chainInfo.color} bg-opacity-20 rounded text-xs text-background`}
                >
                  {chainInfo.label}
                </span>
              </td>
              <td className="text-right py-4 text-foreground font-medium">
                ${price.toLocaleString(undefined, { maximumFractionDigits: 6 })}
              </td>
              <td className="text-right py-4 text-foreground">
                {balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
              </td>
              <td className="text-right py-4 text-foreground font-bold">
                ${tokenValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                {tokenValue >= 1000 && <span className="ml-1 text-xs text-emerald-500">●</span>}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function HistoryTable({ transactions }: { transactions: any[] }) {
  if (!transactions.length)
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
        <p className="text-muted-foreground">No active transaction history found.</p>
        <p className="text-muted-foreground/60 text-sm mt-2">All zero-amount transactions have been filtered out</p>
      </div>
    )

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-border/40">
          <th className="text-left pb-4 text-muted-foreground font-medium">Transaction</th>
          <th className="text-right pb-4 text-muted-foreground font-medium">Amount</th>
          <th className="text-right pb-4 text-muted-foreground font-medium">Token</th>
          <th className="text-right pb-4 text-muted-foreground font-medium">Status</th>
          <th className="text-right pb-4 text-muted-foreground font-medium">Time</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((tx, idx) => {
          const amount = Number(tx.amount || 0)
          return (
            <tr key={idx} className="border-b border-border/20 hover:bg-muted/50 transition-colors group">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      amount > 0
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                    }`}
                  >
                    {amount > 0 ? "+" : "-"}
                  </div>
                  <div>
                    <p className="font-medium text-foreground font-mono text-sm">
                      {tx.txHash?.slice(0, 10)}...{tx.txHash?.slice(-8)}
                    </p>
                    <p className="text-xs text-muted-foreground">Transaction Hash</p>
                  </div>
                </div>
              </td>
              <td className="text-right py-4 text-foreground font-medium">
                {Math.abs(amount).toLocaleString(undefined, { maximumFractionDigits: 6 })}
              </td>
              <td className="text-right py-4">
                <span className="px-2 py-1 bg-muted rounded text-xs text-foreground">{tx.symbol || "Unknown"}</span>
              </td>
              <td className="text-right py-4">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    tx.txStatus === "success"
                      ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-500 border border-rose-500/30"
                  }`}
                >
                  {tx.txStatus || "Unknown"}
                </span>
              </td>
              <td className="text-right py-4 text-muted-foreground text-sm">
                {tx.txTime ? formatTimestamp(tx.txTime) : "Unknown"}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-xl shadow-2xl border border-border relative max-w-6xl w-full mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl z-10 p-2 hover:bg-muted/50 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  )
}
