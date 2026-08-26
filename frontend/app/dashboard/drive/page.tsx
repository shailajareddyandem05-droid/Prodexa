"use client"

import { useState, useEffect, Suspense } from "react"
import {
  FileText,
  File,
  Loader2,
  HardDrive,
  ExternalLink,
  Sparkles,
  RefreshCw,
  X
} from "lucide-react"
import { api } from "@/lib/api"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  link: string
  icon: string
}

export default function DrivePage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <DriveContent />
    </Suspense>
  )
}

function DriveContent() {
  const [files, setFiles] = useState<DriveFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [connected, setConnected] = useState(true) // assume connected first

  const [summarizingId, setSummarizingId] = useState<string | null>(null)
  const [summaryPreview, setSummaryPreview] = useState<{title: string, summary: string} | null>(null)

  useEffect(() => {
    checkGoogleStatus()
  }, [])

  function checkGoogleStatus() {
    api.google.getStatus().then((res) => {
      setConnected(res.connected)
      if (res.connected) {
        fetchFiles()
      } else {
        setLoading(false)
      }
    }).catch((err) => {
      setError("Failed to check Google connection status.")
      setLoading(false)
    })
  }

  function fetchFiles() {
    setLoading(true)
    setError(null)
    api.google.driveFiles()
      .then((data) => {
        setFiles(data.files || [])
      })
      .catch((err) => {
        console.error("Failed to load drive files:", err)
        setError(err.message || "Failed to load Google Drive files.")
        if (err.message && err.message.toLowerCase().includes("reconnect")) {
           setConnected(false)
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }

  async function handleSummarize(file: DriveFile) {
    if (file.mimeType !== "application/vnd.google-apps.document") return

    setSummarizingId(file.id)
    setSummaryPreview(null)
    try {
      // 1. Fetch file content
      const fileData = await api.google.driveFile(file.id)
      const content = fileData.content || ""

      if (!content.trim()) {
        throw new Error("File is empty or could not be read.")
      }

      // 2. Ask AI to summarize
      const summaryRes = await api.ai.summarize([{ title: file.name, content: content.substring(0, 5000) }]) // Limit large files
      
      setSummaryPreview({
        title: file.name,
        summary: summaryRes.summary
      })
    } catch (err: any) {
      alert("Summarization failed: " + (err.message || "Unknown error"))
    } finally {
      setSummarizingId(null)
    }
  }

  async function handleConnect() {
    try {
      const res = await api.google.getAuthUrl()
      if (res.url) {
        const popup = window.open(res.url, 'googleAuth', 'width=500,height=600')
        const timer = setInterval(() => {
          if (!popup) {
            clearInterval(timer)
            return
          }
          if (popup.closed) {
            clearInterval(timer)
            checkGoogleStatus()
            return
          }
          try {
            if (popup.location.href.includes("google=success")) {
              popup.close()
              clearInterval(timer)
              checkGoogleStatus()
            }
          } catch (e) {
            // Ignore cross-origin error
          }
        }, 500)
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (!loading && !connected) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 bg-card rounded-2xl border border-border shadow-sm">
        <div className="flex bg-muted/50 p-4 rounded-full mb-4 items-center justify-center">
            <HardDrive className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Connect Google Drive</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm text-center">
          Bring your documents into Prodexa to preview, organize, and summarize them instantly with AI.
        </p>
        <button
          onClick={handleConnect}
          className="rounded-lg bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Connect Google Account
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full -mx-2 px-2 pb-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2">
             <HardDrive className="h-6 w-6" /> Google Drive
           </h1>
           <p className="text-sm text-muted-foreground mt-1">Access and summarize your recent documents.</p>
        </div>
        <button
          onClick={fetchFiles}
          disabled={loading}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-border text-foreground transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* error state */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading && files.length === 0 ? (
         <div className="flex h-64 items-center justify-center">
           <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
         </div>
      ) : files.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-24 bg-muted/10 mx-auto w-full max-w-2xl mt-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
            <File className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground"> No recent files </p>
            <p className="mt-1 text-xs text-muted-foreground"> Open some files in Google Drive to see them here. </p>
          </div>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {files.map((file) => {
            const isDoc = file.mimeType === "application/vnd.google-apps.document"
            const dateStr = new Date(file.modifiedTime).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })

            return (
              <div
                key={file.id}
                className="group break-inside-avoid flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:bg-muted/20 shadow-sm hover:shadow-md relative"
              >
                <div className="flex space-x-3 items-start pr-6">
                   {/* File Icon */}
                   <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/40">
                     {file.icon ? (
                       <img src={file.icon} alt="" className="h-5 w-5" />
                     ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                     )}
                   </div>
                   <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-foreground truncate" title={file.name}>{file.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{dateStr}</p>
                   </div>
                </div>
                
                <div className="mt-2 flex items-center gap-2 pt-3 border-t border-border/50">
                   <a 
                     href={file.link} 
                     target="_blank" 
                     rel="noreferrer"
                     className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                   >
                     <ExternalLink className="h-3 w-3" /> Open
                   </a>
                   
                   {isDoc && (
                     <button 
                       onClick={() => handleSummarize(file)}
                       disabled={summarizingId !== null}
                       className="flex items-center gap-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 px-3 py-1.5 text-xs font-semibold  transition-colors hover:bg-indigo-500/20 disabled:opacity-50"
                     >
                       {summarizingId === file.id ? (
                         <><Loader2 className="h-3 w-3 animate-spin" /> Summarizing...</>
                       ) : (
                         <><Sparkles className="h-3 w-3" /> AI Summary</>
                       )}
                     </button>
                   )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Summary Modal */}
      {summaryPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 fade-in flex flex-col max-h-[90vh]">
            
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/80 px-6 py-4 backdrop-blur-md rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2 text-indigo-500 text-xs font-bold uppercase tracking-wider mb-1">
                   <Sparkles className="h-3.5 w-3.5" /> AI Summary
                </div>
                <h2 className="text-xl font-bold text-foreground truncate max-w-md" title={summaryPreview.title}>{summaryPreview.title}</h2>
              </div>
              <button
                onClick={() => setSummaryPreview(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 md:p-8">
              <div className="prose dark:prose-invert max-w-none prose-sm md:prose-base prose-p:leading-relaxed text-foreground bg-background rounded-xl border border-border p-5">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {summaryPreview.summary}
                </ReactMarkdown>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
