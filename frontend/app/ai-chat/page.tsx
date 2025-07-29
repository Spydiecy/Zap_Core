"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Paperclip, Send, Bot, User, Plus, Zap, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { uploadFileToIPFS } from "@/lib/pinata"
import { useCredentials } from "@/contexts/CredentialsContext"

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

export default function AstraChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [appName, setAppName] = useState<string>("")
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([])

  // Get credentials from context
  const { publicKey, privateKey, hasCredentials, isConfirmed } = useCredentials()

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

  useEffect(() => {
    const storedSessionId = localStorage.getItem("sessionId")
    const storedUserId = localStorage.getItem("userId")
    const storedAppName = localStorage.getItem("appName")

    if (storedSessionId && storedUserId && storedAppName) {
      setSessionId(storedSessionId)
      setUserId(storedUserId)
      setAppName(storedAppName)
      initializeChat()
    }

    // Listen for new session events from the layout
    const handleNewSession = (event: CustomEvent) => {
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

  if (!sessionId) {
    return (
      <div className="h-full bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Astra AI Assistant</h1>
          <p className="text-gray-400 mb-6">Please create a session using the "New Session" button in the header</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-black text-white flex flex-col">
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
                  message.role === "assistant" ? "bg-gray-800" : "bg-white text-black",
                )}
              >
                {message.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={cn(
                "space-y-2 flex-1",
                message.role === "user" ? "flex flex-col items-end" : "flex flex-col items-start"
              )}>
                <div className={cn(
                  "rounded-lg p-4 border border-gray-800 max-w-[75%]",
                  message.role === "user" 
                    ? "bg-white text-black" 
                    : "bg-gray-900/50"
                )}>
                  {message.isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="text-gray-400">Thinking...</span>
                    </div>
                  ) : (
                    <div className={cn(
                      "whitespace-pre-wrap",
                      message.role === "user" ? "text-black" : "text-gray-100"
                    )}>{message.content}</div>
                  )}
                  
                  {/* Show uploaded images for user messages */}
                  {message.role === "user" && message.images && message.images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image.data}
                            alt={image.displayName}
                            className="max-w-xs max-h-48 rounded-lg border border-gray-700"
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
                          className="max-w-full rounded-lg border border-gray-700"
                        />
                      </div>
                      {message.generatedImage.responseText && (
                        <div className="text-sm text-gray-400 p-3 bg-gray-900 rounded border border-gray-800">
                          <strong>Image Generation Response:</strong>
                          <div className="mt-1">{message.generatedImage.responseText}</div>
                        </div>
                      )}
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
      <div className="border-t border-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Credential Status Indicator */}
          <div className="mb-3">
            {publicKey && privateKey && (
              <div className="flex items-center space-x-2 text-xs text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Wallet credentials active (Public: {publicKey.substring(0, 10)}...)</span>
              </div>
            )}
            {(!publicKey || !privateKey) && (
              <div className="flex items-center space-x-2 text-xs text-yellow-400">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Using fallback credentials</span>
              </div>
            )}
          </div>

          {/* File Uploads */}
          {uploadedFiles.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center space-x-2 bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
                    <Paperclip className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300 truncate max-w-32">{file.displayName}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-white"
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
              className="w-full bg-gray-900 border-gray-700 text-white placeholder-gray-500 pr-20 py-4 text-base rounded-lg focus:border-gray-600 focus:ring-0"
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
                className="p-2 text-gray-400 hover:text-white transition-colors rounded"
                disabled={isLoading}
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <Button
                onClick={sendMessage}
                disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
                size="sm"
                className="bg-white text-black hover:bg-gray-200 border-0"
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