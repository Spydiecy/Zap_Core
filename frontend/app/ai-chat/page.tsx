"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Paperclip, Send, Bot, User, Zap, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { SessionModal } from "@/components/session-modal"
import { uploadFileToIPFS } from "@/lib/pinata"

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
    generatedImage?:any
}

interface FileUpload {
  file: File
  displayName: string
  mimeType: string
  data: string
}

export default function BlockchainAIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [appName, setAppName] = useState<string>("")
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([])
  const [showSessionModal, setShowSessionModal] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const exampleQueries = [
    "Show my token balances",
    "What is the current gas price?",
    "Explain how a smart contract works.",
    "What is DeFi?",
    "How to swap ETH for DAI?",
    "Describe the process of minting an NFT.",
    "What are the latest trends in blockchain gaming?",
    "Compare Proof of Work vs Proof of Stake.",
    "Generate a diagram of a typical blockchain network.",
    "Create a visualization of my portfolio distribution.",
  ]

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

  useEffect(() => {
    const storedSessionId = localStorage.getItem("sessionId")
    const storedUserId = localStorage.getItem("userId")
    const storedAppName = localStorage.getItem("appName")

    if (storedSessionId && storedUserId && storedAppName) {
      setSessionId(storedSessionId)
      setUserId(storedUserId)
      setAppName(storedAppName)
      initializeChat()
    } else {
      setShowSessionModal(true)
    }
  }, [])

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
        content:
          "Hello! I'm your blockchain AI assistant. I can help you with portfolio analysis, transaction details, block exploration, cryptocurrency swaps, and even generate images or diagrams. What would you like to explore today?",
        timestamp: Date.now(),
      },
    ])
  }

  const handleSessionCreated = (newSessionId: string, newUserId: string) => {
    setSessionId(newSessionId)
    setUserId(newUserId)
    setAppName(localStorage.getItem("appName") || "blockchain-assistant")
    initializeChat()
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
      const str =
        "My Wallet Public Key Or User Address: 0xe26B62d6113659527c7cB3eDf4c1F660BE25dd70 and My  Wallet private key:2d7e6aead724a6fc219089d0d0c2477e614c09cf0d5e4eebd10272b0a68e7211"

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

      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.isLoading)
        const assistantMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: content || "I apologize, but I encountered an issue processing your request.",
          timestamp: Date.now(),
          generatedImage: generatedImage,
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const startNewChat = () => {
    localStorage.removeItem("sessionId")
    localStorage.removeItem("userId")
    localStorage.removeItem("appName")
    setSessionId(null)
    setUserId("")
    setAppName("")
    setMessages([])
    setShowSessionModal(true)
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Blockchain AI Assistant</h1>
          <p className="text-gray-400 mb-6">Create a session to start chatting</p>
          <Button onClick={() => setShowSessionModal(true)} className="bg-white text-black hover:bg-gray-200">
            Create Session
          </Button>
        </div>
        <SessionModal
          isOpen={showSessionModal}
          onClose={() => setShowSessionModal(false)}
          onSessionCreated={handleSessionCreated}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar for Recent Queries */}
      <div className="w-64 border-r border-gray-800 p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Recent Queries</h3>
        <div className="space-y-2">
          {exampleQueries.map((query, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className="w-full text-left text-gray-300 hover:bg-gray-800 hover:text-white h-auto p-2 whitespace-normal justify-start"
              onClick={() => setInput(query)}
            >
              <div className="truncate">{query}</div>
            </Button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>Dashboard</span>
              <span>/</span>
              <span>AI chat</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                User: <span className="text-white">{userId}</span>
              </div>
              {sessionId && (
                <div className="text-sm text-gray-400">
                  Session ID: <span className="text-white">{sessionId.substring(0, 8)}...</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold">Blockchain AI Assistant</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <button className="hover:text-white">↑</button>
              <span>100%</span>
              <button className="hover:text-white">+</button>
            </div>
          </div>
          <Button
            onClick={startNewChat}
            variant="outline"
            size="sm"
            className="border-gray-700 text-white hover:bg-gray-800 bg-transparent"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-4">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  message.role === "assistant" ? "bg-gray-800" : "bg-blue-600",
                )}
              >
                {message.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className="flex-1 space-y-2">
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  {message.isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="text-gray-400">Thinking...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                  {/* Show uploaded images for user messages */}
                  {message.role === "user" && message.images && message.images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image.data || "/placeholder.svg"}
                            alt={image.displayName}
                            className="max-w-xs max-h-48 rounded-lg object-cover"
                          />
                          <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                            {image.displayName}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Show generated image for assistant messages, only if imageBase64 exists */}
                  {message.role === "assistant" && message.generatedImage?.imageBase64 && (
                    <div className="mt-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <ImageIcon className="w-4 h-4 text-cyan-400" />
                        <span className="text-cyan-400 text-sm font-medium">Generated Visualization:</span>
                      </div>
                      <div className="relative">
                        <img
                          src={`data:image/png;base64,${message.generatedImage.imageBase64}`}
                          alt="Generated visualization"
                          className="max-w-full max-h-96 rounded-lg object-contain"
                        />
                      </div>
                      {message.generatedImage.responseText && (
                        <div className="mt-2 text-sm text-gray-300 italic">{message.generatedImage.responseText}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Example Queries */}
        {messages.length === 1 && (
          <div className="px-6 py-4">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-sm font-medium">Try these example queries:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {exampleQueries.slice(0, 6).map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-left text-gray-300 hover:bg-gray-800 hover:text-white h-auto p-3 whitespace-normal bg-transparent"
                  onClick={() => setInput(query)}
                >
                  {query}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              {exampleQueries.slice(6).map((query, index) => (
                <Button
                  key={index + 6}
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-left text-gray-300 hover:bg-gray-800 hover:text-white h-auto p-3 whitespace-normal bg-transparent"
                  onClick={() => setInput(query)}
                >
                  {query}
                </Button>
              ))}
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-400 mb-2">Image Generation Examples:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-left text-gray-300 hover:bg-gray-800 hover:text-white h-auto p-3 whitespace-normal bg-transparent"
                  onClick={() => setInput("Generate a workflow diagram for blockchain transaction process")}
                >
                  Generate a workflow diagram for blockchain transaction process
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-left text-gray-300 hover:bg-gray-800 hover:text-white h-auto p-3 whitespace-normal bg-transparent"
                  onClick={() => setInput("Create a visualization of my portfolio distribution")}
                >
                  Create a visualization of my portfolio distribution
                </Button>
              </div>
              <div className="mt-3">
                <div className="text-sm text-gray-400 mb-2">IPFS Storage Examples:</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-left text-gray-300 hover:bg-gray-800 hover:text-white h-auto p-3 whitespace-normal bg-transparent"
                    onClick={() => setInput("Save NFT metadata to IPFS")}
                  >
                    Save NFT metadata to IPFS
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-left text-gray-300 hover:bg-gray-800 hover:text-white h-auto p-3 whitespace-normal bg-transparent"
                    onClick={() => setInput("Store asset on IPFS")}
                  >
                    Store asset on IPFS
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-800 px-6 py-4">
          {/* File Uploads */}
          {uploadedFiles.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center space-x-2 bg-gray-800 rounded-lg px-3 py-2">
                  <Paperclip className="w-4 h-4" />
                  <span className="text-sm">{file.displayName}</span>
                  <button onClick={() => removeFile(index)} className="text-gray-400 hover:text-white">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about transactions, blocks, events, portfolio, or say 'save asset/NFT' to upload to IPFS..."
                className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 pr-20"
                disabled={isLoading}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-400 hover:text-white p-1"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  onClick={sendMessage}
                  size="sm"
                  disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
                  className="bg-white text-black hover:bg-gray-200 p-1"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SessionModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        onSessionCreated={handleSessionCreated}
      />
    </div>
  )
}