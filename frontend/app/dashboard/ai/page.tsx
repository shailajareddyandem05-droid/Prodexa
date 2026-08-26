"use client"

import { useState, useEffect, useRef } from "react"
import {
  Send,
  Plus,
  Bot,
  User,
  Loader2,
  Trash2,
  MessageSquare,
  Search,
  Sparkles,
  Zap,
} from "lucide-react"
import { api } from "@/lib/api"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface ChatMeta {
  id: string
  title: string
  mode: string
  updatedAt: string
}

interface Message {
  role: "user" | "ai"
  content: string
}

const MODES = [
  { id: "standard", label: "Standard", icon: Zap, desc: "Fast & smart assistant", color: "text-foreground" },
  { id: "research", label: "Research", icon: Search, desc: "Web search & citations", color: "text-foreground" },
  { id: "creative", label: "Creative", icon: Sparkles, desc: "Brainstorming & ideas", color: "text-foreground" },
]

export default function PersonalAIPage() {
  const [chats, setChats] = useState<ChatMeta[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [mode, setMode] = useState("standard")
  
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingChat, setLoadingChat] = useState(false)
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Load History on Mount
  useEffect(() => {
    fetchChats()
  }, [])

  // Auto-scroll when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, sending])

  async function fetchChats() {
    setLoadingChats(true)
    try {
      const data = await api.ai.getChats()
      setChats(data.chats || [])
    } catch (err) {
      console.error("Failed to load chats", err)
    } finally {
      setLoadingChats(false)
    }
  }

  // 2. Load Specific Chat
  async function loadChat(id: string) {
    if (activeChatId === id) return
    setActiveChatId(id)
    setLoadingChat(true)
    
    try {
      const data = await api.ai.getChat(id)
      setMessages(data.messages || [])
      setMode(data.mode || "standard")
    } catch (err) {
      console.error("Failed to load chat", err)
      startNewChat()
    } finally {
      setLoadingChat(false)
    }
  }

  function startNewChat() {
    setActiveChatId(null)
    setMessages([])
    setInput("")
    // Mode stays whatever it currently is
  }

  async function deleteChat(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await api.ai.deleteChat(id)
      setChats((prev) => prev.filter((c) => c.id !== id))
      if (activeChatId === id) {
        startNewChat()
      }
    } catch (err) {
      console.error("Failed to delete chat", err)
    }
  }

  // 3. Send Message
  async function handleSend(text?: string) {
    const msg = text || input.trim()
    if (!msg || sending) return

    const userMessage: Message = { role: "user", content: msg }
    const currentMessages = [...messages]
    const updatedMessages = [...currentMessages, userMessage]
    
    setMessages(updatedMessages)
    setInput("")
    setSending(true)

    // Optimistically update sidebar if it's the first message
    let tempChatId = activeChatId
    if (!tempChatId) {
       const newChatMeta: ChatMeta = {
         id: "temp-" + Date.now(),
         title: "New Chat...",
         mode,
         updatedAt: new Date().toISOString()
       }
       setChats([newChatMeta, ...chats])
    }

    try {
      // Pass 'currentMessages' as history. Exclude the one we just added.
      // Actually the backend expects only previous history to build context.
      const data = await api.ai.chat(
        msg, 
        currentMessages, 
        mode, 
        tempChatId?.startsWith("temp-") ? undefined : tempChatId || undefined
      )
      
      setMessages([...updatedMessages, { role: "ai", content: data.response }])

      // If we just created a new chat, the backend returned the real ID. update it.
      if (!tempChatId || tempChatId.startsWith("temp-")) {
        setActiveChatId(data.chatId)
        // Re-fetch chats slightly later to get the AI-generated title
        setTimeout(fetchChats, 2000)
      } else {
        // Just bump the updated timestamp
        fetchChats()
      }
      
    } catch (err: any) {
      setMessages([
        ...updatedMessages,
        { role: "ai", content: `❌ Sorry, I encountered an error: ${err.message}` },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="-m-6 flex h-[calc(100%+48px)] overflow-hidden bg-background">
      
      {/* ── Left Sidebar (History) ── */}
      <div className="w-64 shrink-0 border-r border-border bg-muted/10 flex flex-col">
        <div className="p-4">
          <button
            onClick={startNewChat}
            className="flex w-full items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {loadingChats ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No recent chats
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recent
              </p>
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => loadChat(chat.id)}
                  className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    activeChatId === chat.id || (activeChatId == null && chat.id.startsWith("temp-"))
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{chat.title}</span>
                  
                  <div
                    onClick={(e) => deleteChat(chat.id, e)}
                    className="absolute right-2 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                    title="Delete Chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Main Area (Chat) ── */}
      <div className="flex flex-1 flex-col relative w-full min-w-0 bg-background">
        
        {/* Mode Selector (Top Header) */}
        {!activeChatId && messages.length === 0 && (
          <div className="absolute top-6 left-0 right-0 z-10 flex justify-center px-4">
            <div className="flex items-center rounded-xl border border-border bg-card p-1 shadow-sm">
              {MODES.map((m) => {
                const isActive = mode === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      isActive ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <m.icon className={`h-4 w-4 ${isActive ? m.color : ""}`} />
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
          
          {loadingChat ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            
            /* ── Empty State ── */
            <div className="flex h-full flex-col items-center justify-center px-4 text-center mt-12 animate-in fade-in slide-in-from-bottom-4">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30 border border-border">
                {mode === "standard" && <Zap className="h-8 w-8 text-foreground" />}
                {mode === "research" && <Search className="h-8 w-8 text-foreground" />}
                {mode === "creative" && <Sparkles className="h-8 w-8 text-foreground" />}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                {mode === "standard" && "How can I help you today?"}
                {mode === "research" && "What do you want to learn?"}
                {mode === "creative" && "Let's brainstorm together."}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground max-w-md">
                {MODES.find(m => m.id === mode)?.desc}. Powered by LLaMA 3.
                {mode === "research" && " Now with live DuckDuckGo web search."}
              </p>

              {/* Suggestion Cards */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl text-left">
                {[
                   { t: "Summarize this week's progress", v: "Can you summarize my task progress for this week and tell me what to focus on next?" },
                   { t: "Create a 3-day study plan", v: "Make a comprehensive 3-day study plan for my exams, breaking it down by morning and afternoon tasks." },
                   { t: "Find the latest news on AI", v: "Search the web for the latest major news in Artificial Intelligence this week and summarize the top 3 stories." },
                   { t: "Draft an email to my professor", v: "Draft a polite email to my professor asking for an extension on the upcoming assignment due to personal reasons." },
                ].map((s) => (
                  <button
                    key={s.t}
                    onClick={() => handleSend(s.v)}
                    className="flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4 transition-all hover:bg-muted/60 active:scale-[0.98]"
                  >
                    <span className="text-sm font-medium text-foreground">{s.t}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">{s.v}</span>
                  </button>
                ))}
              </div>
            </div>

          ) : (
            
            /* ── Conversation Thread ── */
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  
                  {/* Avatar */}
                  <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                    msg.role === "user" ? "border-transparent bg-foreground/10 text-foreground" : "border-border shadow-sm text-muted-foreground"
                  }`}>
                    {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col text-sm leading-relaxed max-w-[85%] ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}>
                    <div className={`inline-block px-5 py-3.5 rounded-2xl ${
                      msg.role === "user" 
                        ? "bg-foreground text-background rounded-tr-sm" 
                        : "bg-transparent text-foreground" // AI responses look better boundary-less, just rich text
                    }`}>
                      {msg.role === "user" ? (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      ) : (
                      <div className="prose dark:prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-a:font-medium prose-a:underline prose-a:underline-offset-2 text-foreground">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Thinking Indicator */}
              {sending && (
                <div className="flex gap-4 flex-row animate-in fade-in">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border shadow-sm text-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="flex flex-col justify-center max-w-[85%] px-2">
                    <p className="text-sm text-muted-foreground animate-pulse">
                      {mode === "research" ? "Searching the web and analyzing..." : "Thinking..."}
                    </p>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} className="h-2" />
            </div>
            
          )}
        </div>

        {/* ── Input Bar ── */}
        <div className="px-4 pb-6 pt-2 bg-gradient-to-t from-background via-background to-transparent md:px-8">
          <div className="mx-auto flex w-full max-w-3xl items-end gap-3 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:ring-1 focus-within:ring-foreground/20 focus-within:border-foreground/30 transition-shadow">
            
            {/* Mode Indicator Mini (if chat is active) */}
            {activeChatId && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 mb-0.5" title={`${mode} mode`}>
                {mode === "standard" && <Zap className="h-4 w-4 text-foreground" />}
                {mode === "research" && <Search className="h-4 w-4 text-foreground" />}
                {mode === "creative" && <Sparkles className="h-4 w-4 text-foreground" />}
              </div>
            )}
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={mode === "research" ? "Ask anything..." : "Message Pai..."}
              disabled={sending}
              rows={1}
              style={{ minHeight: "44px", maxHeight: "200px" }}
              className="flex-1 resize-none bg-transparent px-3 py-3 text-sm text-foreground placeholder-muted-foreground outline-none disabled:opacity-50"
            />
            
            <button
              onClick={() => handleSend()}
              disabled={sending || !input.trim()}
              className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mx-auto mt-2 text-center">
            <p className="text-[10px] text-muted-foreground max-w-3xl mx-auto">
              Pai can make mistakes. Consider verifying critical information.
            </p>
          </div>
        </div>
        
      </div>
    </div>
  )
}
