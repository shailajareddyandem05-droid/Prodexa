"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ArrowLeft,
  Search,
  Star,
  Sparkles,
  CheckSquare,
  FileText,
  Paperclip,
  Reply,
  Forward,
  X,
  Inbox,
  Loader2,
  Link2,
  Plus,
  Check,
  AlertCircle,
  Command,
} from "lucide-react"
import { api } from "@/lib/api"

type Tab = "inbox" | "important"

interface Email {
  id: string
  sender: string
  senderEmail: string
  subject: string
  preview: string
  date: string
  body: string
  read: boolean
  labels?: string[]
  hasAttachment?: boolean
}

interface AITask {
  title: string
  due: string
  priority: "high" | "medium" | "low"
}

const labelColors: Record<string, string> = {
  Work: "bg-foreground text-background",
  Updates: "bg-muted text-muted-foreground border-border",
  Design: "bg-foreground text-background",
  Business: "bg-foreground text-background",
}

const tabConfig: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "important", label: "Starred", icon: Star },
]

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    high: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    low: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  }
  return (
    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${map[priority] || map.medium}`}>
      {priority}
    </span>
  )
}

export default function MailsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("inbox")
  const [selected, setSelected] = useState<Email | null>(null)
  const [important, setImportant] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")

  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null)
  const [connectingGoogle, setConnectingGoogle] = useState(false)

  // Full body status
  const [fullBody, setFullBody] = useState<string>("")
  const [loadingBody, setLoadingBody] = useState(false)

  // AI State
  const [aiTasks, setAiTasks] = useState<AITask[]>([])
  const [aiSummary, setAiSummary] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState("")
  const [addedTaskIds, setAddedTaskIds] = useState<Set<number>>(new Set())
  const [addingTaskId, setAddingTaskId] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const status = await api.google.getStatus()
        setGoogleConnected(status.connected)

        if (status.connected) {
          const data = await api.google.gmailMessages()
          const mapped: Email[] = (data.messages || []).map((msg: any) => ({
            id: msg.id,
            sender: msg.from?.split("<")[0]?.trim() || msg.from || "Unknown",
            senderEmail: msg.from?.match(/<(.+?)>/)?.[1] || msg.from || "",
            subject: msg.subject || "(No subject)",
            preview: msg.snippet || "",
            date: msg.date || "",
            body: msg.snippet || "",
            read: true,
            labels: [],
            hasAttachment: false,
          }))
          setEmails(mapped)
        }
      } catch (err) {
        setGoogleConnected(false)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const loadFullEmail = useCallback(async (email: Email) => {
    setSelected(email)
    setFullBody("")
    setAiTasks([])
    setAiSummary("")
    setAiError("")
    setAddedTaskIds(new Set())
    setLoadingBody(true)

    try {
      const data = await api.google.gmailMessage(email.id)
      setFullBody(data.body || email.body)
    } catch {
      setFullBody(email.body)
    } finally {
      setLoadingBody(false)
    }
  }, [])

  const extractTasks = useCallback(async () => {
    if (!selected || !fullBody) return
    setAiLoading(true)
    setAiError("")
    setAiTasks([])
    setAiSummary("")

    try {
      const data = await api.ai.emailAction({
        action: "extract-tasks",
        emailBody: fullBody,
        emailSubject: selected.subject,
        emailSender: selected.sender,
      })

      if (data.tasks && data.tasks.length > 0) {
        setAiTasks(data.tasks)
      } else {
        setAiSummary("No actionable tasks found in this email.")
      }
    } catch {
      setAiError("Failed to analyze email. Please try again.")
    } finally {
      setAiLoading(false)
    }
  }, [selected, fullBody])

  const summarizeEmail = useCallback(async () => {
    if (!selected || !fullBody) return
    setAiLoading(true)
    setAiError("")
    setAiTasks([])
    setAiSummary("")

    try {
      const data = await api.ai.emailAction({
        action: "summarize",
        emailBody: fullBody,
        emailSubject: selected.subject,
        emailSender: selected.sender,
      })
      setAiSummary(data.result || "Could not summarize.")
    } catch {
      setAiError("Failed to summarize email. Please try again.")
    } finally {
      setAiLoading(false)
    }
  }, [selected, fullBody])

  const addTask = useCallback(async (task: AITask, index: number) => {
    setAddingTaskId(index)
    try {
      await api.tasks.create({
        title: task.title,
        due: task.due,
        priority: task.priority,
        source: "email-ai",
      })
      setAddedTaskIds((prev) => new Set(prev).add(index))
    } catch (err) {
      console.error(err)
    } finally {
      setAddingTaskId(null)
    }
  }, [])

  function getTabEmails(): Email[] {
    let list: Email[]
    switch (activeTab) {
      case "inbox": list = emails; break
      case "important": list = emails.filter((e) => important.has(e.id)); break
      default: list = []
    }
    if (!search) return list
    const q = search.toLowerCase()
    return list.filter(
      (e) =>
        e.sender.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.preview.toLowerCase().includes(q)
    )
  }

  const visibleEmails = getTabEmails()

  function toggleImportant(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setImportant((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleConnectGoogle() {
    setConnectingGoogle(true)
    try {
      const data = await api.google.getAuthUrl()
      window.location.href = data.url
    } catch (err) {
      console.error(err)
    } finally {
      setConnectingGoogle(false)
    }
  }

  /* Loading State */
  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  /* Disconnected State */
  if (googleConnected === false && emails.length === 0) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-6 max-w-sm mx-auto text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-foreground/5 border border-border">
          <Link2 className="h-8 w-8 text-foreground opacity-80" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Sync Comm Data</h2>
          <p className="mt-2 text-sm text-muted-foreground font-medium">Link your main Google ecosystem to read, manage, and extract AI tasks directly from your active inbox.</p>
        </div>
        <button
          onClick={handleConnectGoogle}
          disabled={connectingGoogle}
          className="flex items-center gap-2 rounded-xl bg-foreground px-6 py-3.5 text-sm font-bold tracking-wide text-background transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 mt-2 shadow-sm"
        >
          {connectingGoogle ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
          )}
          Connect Protocol
        </button>
      </div>
    )
  }

  /* FULL EMAIL VIEW */
  if (selected) {
    const hasAiResults = aiTasks.length > 0 || aiSummary || aiError

    return (
      <div className="-m-6 flex h-[calc(100vh-72px)] bg-background">
        
        {/* Main Reading Pane */}
        <div className="flex-1 overflow-y-auto px-8 py-8 md:px-12 flex flex-col relative custom-scrollbar">
           {/* Top Navigation Row */}
           <div className="flex items-center gap-4 mb-10 w-full max-w-4xl mx-auto">
             <button
                onClick={() => { setSelected(null); setFullBody(""); setAiTasks([]); setAiSummary(""); setAiError("") }}
                className="flex items-center justify-center p-2 rounded-full hover:bg-muted/50 transition-colors"
                aria-label="Back"
             >
                <ArrowLeft className="h-4 w-4 text-foreground/70" />
             </button>
             
             <div className="h-4 w-px bg-border/50 hidden sm:block"></div>
             
             <div className="flex items-center gap-1.5 flex-1 hidden sm:flex">
               <button
                 onClick={(e) => toggleImportant(selected.id, e)}
                 className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted/50 transition-colors"
               >
                 <Star className={`h-3.5 w-3.5 ${important.has(selected.id) ? "fill-foreground text-foreground" : ""}`} />
                 Priority
               </button>
             </div>

             <div className="flex items-center gap-2 ml-auto shrink-0 bg-muted/20 border border-border/50 p-1 rounded-2xl">
                <button
                  onClick={extractTasks}
                  disabled={aiLoading || loadingBody}
                  className="flex items-center gap-2 rounded-xl bg-background border border-border/40 px-3 py-1.5 text-xs font-bold text-foreground transition-all hover:bg-muted shadow-sm disabled:opacity-40"
                >
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : <Command className="h-3.5 w-3.5 text-muted-foreground" />}
                  Identify Tasks
                </button>
                <button
                  onClick={summarizeEmail}
                  disabled={aiLoading || loadingBody}
                  className="flex items-center justify-center p-2 text-muted-foreground transition-colors hover:bg-foreground hover:text-background rounded-xl disabled:opacity-40"
                  title="Summarize"
                >
                  <Sparkles className="h-4 w-4" />
                </button>
             </div>
           </div>

           {/* Email Header */}
           <div className="max-w-4xl mx-auto w-full">
             <h1 className="text-3xl font-bold tracking-tight text-foreground leading-tight">{selected.subject}</h1>
             
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8 pb-8 border-b border-border/40">
                
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background font-bold text-lg leading-none pt-0.5">
                    {selected.sender.charAt(0)}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base font-semibold text-foreground tracking-tight">{selected.sender}</span>
                    <span className="text-xs text-muted-foreground tracking-wide flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
                      <span>{selected.senderEmail}</span>
                      <span className="hidden sm:inline-block opacity-40">•</span>
                      <span>{selected.date}</span>
                    </span>
                  </div>
                </div>

                {/* Tags */}
                {((selected.labels && selected.labels.length > 0) || selected.hasAttachment) && (
                  <div className="flex gap-2 shrink-0">
                    {selected.labels?.map((l) => (
                      <span key={l} className={`rounded-md border border-border/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${labelColors[l] || "bg-muted/30 text-muted-foreground"}`}>{l}</span>
                    ))}
                    {selected.hasAttachment && (
                      <span className="flex items-center justify-center h-6 w-6 rounded-md bg-muted/40 text-muted-foreground border border-border/50">
                        <Paperclip className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                )}
             </div>
           </div>

           {/* Reading Pane Content */}
           <div className="max-w-4xl mx-auto w-full mt-8 flex-1">
             {loadingBody ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50 mb-4" />
                  <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Decrypting Transmission</p>
                </div>
              ) : (
                <div className="text-sm md:text-base leading-loose text-foreground/90 pb-20 font-medium font-sans">
                   {fullBody}
                </div>
              )}
           </div>

           {/* Bottom Reply Bar */}
           <div className="max-w-4xl mx-auto w-full py-6 mt-auto flex items-center gap-3">
              <a 
                href={`mailto:${selected.senderEmail}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                className="flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-bold text-background transition-transform hover:scale-105 active:scale-95"
              >
                <Reply className="h-4 w-4" /> Quick Reply
              </a>
              <a 
                href={`mailto:?subject=${encodeURIComponent(`Fwd: ${selected.subject}`)}&body=${encodeURIComponent(`\n\n---------- Forwarded message ---------\nFrom: ${selected.sender} <${selected.senderEmail}>\nDate: ${selected.date}\nSubject: ${selected.subject}\n\n${fullBody.length > 500 ? fullBody.substring(0, 500) + '...' : fullBody}`)}`}
                className="flex items-center gap-2 rounded-xl bg-muted/30 border border-border/50 px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-muted"
              >
                <Forward className="h-4 w-4" /> Forward
              </a>
           </div>
        </div>

        {/* AI Sidebar */}
        {(aiLoading || hasAiResults) && (
          <div className="w-80 lg:w-96 shrink-0 border-l border-border/40 bg-card flex flex-col h-full shadow-2xl relative z-10 animate-in slide-in-from-right-4">
             {/* AI Header */}
             <div className="flex items-center gap-3 p-6 border-b border-border/30">
               <div className="flex items-center justify-center h-8 w-8 rounded-full bg-foreground text-background">
                 <Sparkles className="h-4 w-4" />
               </div>
               <h3 className="text-[13px] font-bold uppercase tracking-widest text-foreground">AI Intelligence</h3>
             </div>

             <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                
                {aiLoading && (
                  <div className="flex flex-col items-center justify-center h-48 opacity-60">
                     <Loader2 className="h-6 w-6 animate-spin text-foreground mb-4" />
                     <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Running Analysis</p>
                  </div>
                )}

                {aiError && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex gap-3">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-destructive/90">{aiError}</p>
                  </div>
                )}

                {/* Summary Card */}
                {aiSummary && !aiLoading && (
                  <div className="rounded-2xl border border-border/50 bg-background shadow-xs p-5">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><FileText className="h-3 w-3" /> TL;DR Briefing</p>
                     <p className="text-sm font-medium leading-relaxed text-foreground">{aiSummary}</p>
                  </div>
                )}

                {/* Extracted Tasks View */}
                {aiTasks.length > 0 && !aiLoading && (
                  <div className="flex flex-col gap-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 pl-1"><CheckSquare className="h-3 w-3" /> Extracted Action Items</p>
                    
                    <div className="flex flex-col gap-3">
                      {aiTasks.map((task, idx) => {
                        const isAdded = addedTaskIds.has(idx)
                        return (
                          <div key={idx} className={`relative flex flex-col gap-3 p-4 rounded-2xl border transition-all ${isAdded ? "bg-green-500/5 border-green-500/20" : "bg-background border-border"}`}>
                            <div className="flex items-start gap-3 w-full min-w-0 pr-10">
                              <p className="text-sm font-semibold text-foreground leading-snug break-words pr-2">{task.title}</p>
                            </div>
                            <div className="flex items-center gap-2">
                               <p className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-md">DUE {task.due}</p>
                               <PriorityBadge priority={task.priority} />
                            </div>

                            <button
                               onClick={() => addTask(task, idx)}
                               disabled={isAdded || addingTaskId === idx}
                               className={`absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 disabled:scale-100 ${isAdded ? "bg-green-500 text-white" : "bg-foreground text-background"}`}
                            >
                              {addingTaskId === idx ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

             </div>
          </div>
        )}

      </div>
    )
  }

  /* LIST VIEW */
  return (
    <div className="-m-6 flex h-[calc(100vh-72px)] bg-card border-x border-border/30 max-w-7xl mx-auto w-full relative">
       
       {/* Sidebar Folders */}
       <div className="hidden lg:flex flex-col w-64 border-r border-border/40 bg-background/50 h-full p-6">
         <div className="flex items-center justify-between mb-8">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Directories</h2>
         </div>

         <div className="flex flex-col gap-1">
           {tabConfig.map(({ key, label, icon: TabIcon }) => {
             const isActive = activeTab === key
             return (
               <button
                 key={key}
                 onClick={() => { setActiveTab(key); setSearch("") }}
                 className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive ? "bg-foreground text-background shadow-xs hover:bg-foreground/90" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
               >
                 <TabIcon className={`h-4 w-4 ${isActive && key === "important" ? "fill-background" : ""}`} />
                 <span className="flex-1 text-left">{label}</span>
                 {key === "inbox" && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isActive ? "bg-background/20" : "bg-muted/50 text-foreground"}`}>{emails.length}</span>}
               </button>
             )
           })}
         </div>
       </div>

       {/* INBOX List */}
       <div className="flex flex-1 flex-col h-full overflow-hidden bg-background">
          <div className="flex items-center gap-4 border-b border-border/40 p-4 shrink-0">
             
             {/* Mobile Tab Fallback */}
             <div className="flex lg:hidden items-center gap-2 bg-muted/20 border border-border/50 p-1 rounded-xl">
               {tabConfig.map(({ key, icon: TabIcon }) => (
                 <button key={key} onClick={() => { setActiveTab(key); setSearch("") }} className={`p-1.5 rounded-lg transition-colors ${activeTab === key ? "bg-background shadow-xs text-foreground" : "text-muted-foreground"}`}>
                   <TabIcon className={`h-4 w-4 ${activeTab === key && key === "important" ? "fill-foreground" : ""}`} />
                 </button>
               ))}
             </div>

             <div className="relative flex-1 max-w-xl group">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 transition-colors group-focus-within:text-foreground" />
               <input
                 type="text"
                 placeholder="Search mail database..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full bg-muted/20 border border-border/50 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-foreground placeholder-muted-foreground/60 outline-none transition-all focus:bg-background focus:border-foreground/30 focus:shadow-sm"
               />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 custom-scrollbar">
            {visibleEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center opacity-70">
                {search ? <Search className="h-10 w-10 text-muted-foreground mb-4" /> : <Inbox className="h-10 w-10 text-muted-foreground mb-4" />}
                <p className="text-xl font-bold tracking-tight text-foreground">{search ? "Search Failed" : "Inbox Zero"}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1 max-w-xs">{search ? "No communications match your query." : "You have processed all incoming traffic."}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {visibleEmails.map(email => (
                  <div key={email.id} onClick={() => loadFullEmail(email)} className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 rounded-xl transition-all cursor-pointer border border-transparent hover:border-border hover:bg-muted/10">
                     
                     <div className="flex items-center gap-3 w-full sm:w-56 shrink-0 justify-between sm:justify-start">
                       <div className="flex items-center gap-3">
                         <button onClick={(e) => toggleImportant(email.id, e)} className="shrink-0 text-muted-foreground/50 transition-colors hover:text-foreground">
                           <Star className={`h-4 w-4 ${important.has(email.id) ? "fill-foreground text-foreground" : ""}`} />
                         </button>
                         <span className="text-sm font-bold text-foreground truncate w-32 sm:w-40 leading-none">{email.sender}</span>
                       </div>
                       <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:hidden">{email.date}</span>
                     </div>

                     <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                       <span className="text-sm font-bold text-foreground truncate leading-none pt-[1px]">{email.subject}</span>
                       <span className="text-xs text-muted-foreground truncate font-medium opacity-60 hidden sm:block">- {email.preview}</span>
                     </div>
                     
                     <div className="hidden sm:flex shrink-0 items-center justify-end w-24">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{email.date}</span>
                     </div>

                  </div>
                ))}
              </div>
            )}
          </div>

       </div>
    </div>
  )
}
