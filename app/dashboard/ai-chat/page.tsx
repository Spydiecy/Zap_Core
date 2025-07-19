"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Wallet, Plus, Paperclip, Send, Bot, User, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { SessionModal } from "@/components/session-modal"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
  isLoading?: boolean
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
    "Display latest blocks",
    "Show events for block 20959992",
    "Get event details for 20959992-3",
    "Display block events for 20874717",
    "Show my token balances",
    "Display my portfolio overview",
    "Get address details",
    "Show my wallet information",
    "Show recent transactions",
  ]

  useEffect(() => {
    // Check for existing session
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
          "Hello! I'm your blockchain AI assistant. I can help you with portfolio analysis, transaction details, block exploration, and even cryptocurrency swaps. What would you like to explore today?",
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
          data: base64Data.split(",")[1], // Remove data:mime;base64, prefix
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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Add loading message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isLoading: true,
    }
    setMessages((prev) => [...prev, loadingMessage])

    try {
      // Prepare message parts
      const parts: any[] = [{ text: input }]

      // Add file uploads to parts
      uploadedFiles.forEach((fileUpload) => {
        parts.push({
          inlineData: {
            displayName: fileUpload.displayName,
            data: fileUpload.data,
            mimeType: fileUpload.mimeType,
          },
        })
      })

      const response = await fetch("/api/run-agent", {
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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const responseData = await response.json()

      // Remove loading message and add actual response
      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.isLoading)
        const assistantMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content:
            responseData[0]?.content?.parts?.[0]?.text ||
            "I apologize, but I encountered an issue processing your request.",
          timestamp: Date.now(),
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
      setUploadedFiles([])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const startNewChat = () => {
    // Clear current session and show modal for new session
    localStorage.removeItem("sessionId")
    localStorage.removeItem("userId")
    localStorage.removeItem("appName")
    setSessionId(null)
    setUserId("")
    setAppName("")
    setMessages([])
    setShowSessionModal(true)
  }

  const TypewriterText = ({ text }: { text: string }) => {
    const [displayText, setDisplayText] = useState("")
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
      if (currentIndex < text.length) {
        const timeout = setTimeout(() => {
          setDisplayText((prev) => prev + text[currentIndex])
          setCurrentIndex((prev) => prev + 1)
        }, 20)
        return () => clearTimeout(timeout)
      }
    }, [currentIndex, text])

    return <span>{displayText}</span>
  }

  // Show session modal if no session exists
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
    <div className="min-h-screen bg-black text-white">
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
            <Button variant="outline" size="sm" className="border-gray-700 text-white hover:bg-gray-800 bg-transparent">
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col h-[calc(100vh-80px)]">
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
                    <TypewriterText text={message.content} />
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
                placeholder="Ask about transactions, blocks, events, portfolio, or say 'I want to swap tokens'..."
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
