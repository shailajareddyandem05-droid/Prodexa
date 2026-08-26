"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useSearchParams } from "next/navigation"
import {
  Plus,
  FolderPlus,
  Sparkles,
  Download,
  X,
  ArrowLeft,
  Folder,
  Loader2,
  MoreVertical,
  Check,
  AlignLeft,
  Maximize2,
  Wand2,
  Trash2,
  HardDrive
} from "lucide-react"
import { api } from "@/lib/api"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Note {
  id: string
  title: string
  content: string
  date: string
  group?: string
}

export default function NotesPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <NotesContent />
    </Suspense>
  )
}

function NotesContent() {
  const searchParams = useSearchParams()
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  // Editor states
  const [editorTitle, setEditorTitle] = useState("")
  const [editorContent, setEditorContent] = useState("")
  const [editorGroup, setEditorGroup] = useState("")
  const [saving, setSaving] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // AI states
  const [aiLoadingAction, setAiLoadingAction] = useState<string | null>(null)
  const [aiPreview, setAiPreview] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  // Drive Export states
  const [exportingNoteId, setExportingNoteId] = useState<string | null>(null)
  const [exportingGroup, setExportingGroup] = useState<string | null>(null)

  useEffect(() => {
    fetchNotes()
  }, [])

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      openEditor()
    }
  }, [searchParams])

  function fetchNotes() {
    api.notes.list()
      .then((data) => setNotes(data.notes || []))
      .catch((err) => console.error("Failed to load notes:", err))
      .finally(() => setPageLoading(false))
  }

  function openEditor(note?: Note) {
    if (note) {
      setEditorTitle(note.title)
      setEditorContent(note.content)
      setEditorGroup(note.group || "")
    } else {
      setEditorTitle("")
      setEditorContent("")
      setEditorGroup("")
    }
    setAiPreview(null)
    setShowEditor(true)
  }

  /* Automatically adjust textarea height */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [editorContent, showEditor])

  /* Groups processing */
  const allGroupNames = Array.from(new Set(notes.filter(n => n.group).map(n => n.group!)))
  const groupCounts: Record<string, number> = {}
  for (const g of allGroupNames) {
    groupCounts[g] = notes.filter((n) => n.group === g).length
  }

  const filtered = activeGroup === null
      ? notes.filter((n) => !n.group)
      : notes.filter((n) => n.group === activeGroup)

  /* Save logic with Auto-Tag and Auto-Title */
  async function handleSaveNote() {
    if (!editorContent.trim() && !editorTitle.trim()) return
    setSaving(true)

    try {
      let finalTitle = editorTitle.trim()
      let finalGroup = editorGroup.trim()

      if (!finalTitle && editorContent) {
        const res = await api.ai.noteAction("auto_title", editorContent)
        finalTitle = res.result || "Untitled Note"
      }

      if (!finalGroup && editorContent) {
        const tagRes = await api.ai.noteAction("auto_tag", editorContent)
        if (tagRes.result && tagRes.result.length < 20) {
          finalGroup = tagRes.result
        }
      }

      const data = await api.notes.create({
        title: finalTitle || "Untitled Note",
        content: editorContent,
        group: finalGroup || undefined,
      })
      
      setNotes((prev) => [data, ...prev])
      setShowEditor(false)
    } catch (err: any) {
      console.error("Failed to save note:", err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteNote(id: string) {
    if (!confirm("Are you sure you want to delete this note?")) return
    try {
      await api.notes.delete(id)
      setNotes((prev) => prev.filter(n => n.id !== id))
      if (selectedNote?.id === id) {
        setSelectedNote(null)
      }
    } catch (err) {
      console.error("Failed to delete note:", err)
    }
  }

  async function handleExportNote(note: Note) {
    setExportingNoteId(note.id)
    try {
      await api.google.exportNoteToDrive({
        title: note.title,
        content: note.content
      })
      alert("Note exported to Google Drive successfully!")
    } catch (err: any) {
      alert("Failed to export: " + err.message)
    } finally {
      setExportingNoteId(null)
    }
  }

  async function handleExportGroup(group: string) {
    setExportingGroup(group)
    try {
      const groupNotes = notes.filter(n => n.group === group)
      await api.google.exportGroupToDrive({
        groupName: group,
        notes: groupNotes.map(n => ({ title: n.title, content: n.content }))
      })
      alert(`Group "${group}" exported to Google Drive successfully!`)
    } catch (err: any) {
      alert("Failed to export group: " + err.message)
    } finally {
      setExportingGroup(null)
    }
  }

  /* Inline AI Actions */
  async function runAiAction(action: "fix_grammar" | "expand" | "summarize") {
    if (!editorContent.trim()) return
    setAiLoadingAction(action)
    setAiError(null)
    setAiPreview(null)

    try {
      const res = await api.ai.noteAction(action, editorContent)
      setAiPreview(res.result)
    } catch (err: any) {
      setAiError(err.message)
    } finally {
      setAiLoadingAction(null)
    }
  }

  function applyAiAction(type: "replace" | "append") {
    if (!aiPreview) return

    if (type === "replace") {
      setEditorContent(aiPreview)
    } else {
      setEditorContent(editorContent + "\n\n" + aiPreview)
    }
    setAiPreview(null)
  }

  if (pageLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  /* ================================================================ */
  /*  FULL-PAGE NOTION-STYLE EDITOR                                   */
  /* ================================================================ */
  if (showEditor) {
    return (
      <div className="-m-6 flex h-[calc(100%+48px)] flex-col bg-background">
        
        {/* Toolbar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-6 py-3 backdrop-blur-md">
          <button
            onClick={() => setShowEditor(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-2 font-medium">Group / Tag:</span>
            <input
              type="text"
              placeholder="e.g. Marketing"
              value={editorGroup}
              onChange={(e) => setEditorGroup(e.target.value)}
              className="rounded-md border border-border bg-transparent px-3 py-1.5 text-xs text-foreground placeholder-muted-foreground outline-none w-32 focus:border-foreground/30"
            />
            <button
              onClick={handleSaveNote}
              disabled={saving || (!editorTitle.trim() && !editorContent.trim())}
              className="rounded-md bg-foreground px-4 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Note"}
            </button>
          </div>
        </div>

        {/* Editor Canvas */}
        <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto px-6 py-12 md:px-12 flex flex-col items-stretch">
          
          <input
            type="text"
            placeholder="Note Title"
            value={editorTitle}
            onChange={(e) => setEditorTitle(e.target.value)}
            className="w-full bg-transparent text-4xl font-bold text-foreground placeholder-muted-foreground/30 outline-none mb-6"
          />

          <textarea
            ref={textareaRef}
            placeholder="Start typing..."
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            className="w-full resize-none bg-transparent text-base md:text-lg leading-relaxed text-foreground placeholder-muted-foreground/50 outline-none min-h-[300px]"
          />

          {/* AI Preview Block */}
          {aiPreview && (
            <div className="mt-8 rounded-xl border border-border bg-muted/20 p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Output Ready</span>
              </div>
              
              <div className="prose dark:prose-invert max-w-none prose-sm prose-p:leading-relaxed text-foreground bg-background rounded-lg border border-border p-4 mb-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiPreview}</ReactMarkdown>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => applyAiAction("replace")}
                  className="flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background transition-colors hover:opacity-90"
                >
                  <Check className="h-3.5 w-3.5" /> Replace Content
                </button>
                <button
                  onClick={() => applyAiAction("append")}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-transparent px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <AlignLeft className="h-3.5 w-3.5" /> Insert Below
                </button>
                <button
                  onClick={() => setAiPreview(null)}
                  className="ml-auto flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* AI Toolbar (Floating) */}
          <div className="sticky bottom-6 mt-16 self-center animate-in fade-in">
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-card/80 p-1.5 shadow-sm backdrop-blur-md">
              <div className="px-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground border-r border-border mr-1 select-none">
                <Wand2 className="h-3.5 w-3.5" /> Ask AI
              </div>
              
              <button
                onClick={() => runAiAction("fix_grammar")}
                disabled={aiLoadingAction !== null || !editorContent.trim()}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted disabled:opacity-40"
              >
                {aiLoadingAction === "fix_grammar" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Fix Grammar"}
              </button>
              <button
                onClick={() => runAiAction("expand")}
                disabled={aiLoadingAction !== null || !editorContent.trim()}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted disabled:opacity-40"
              >
                {aiLoadingAction === "expand" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Expand Text"}
              </button>
              <button
                onClick={() => runAiAction("summarize")}
                disabled={aiLoadingAction !== null || !editorContent.trim()}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted disabled:opacity-40"
              >
                {aiLoadingAction === "summarize" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Summarize"}
              </button>
            </div>
            {aiError && (
              <p className="mt-2 text-center text-xs text-red-500">{aiError}</p>
            )}
          </div>

        </div>
      </div>
    )
  }

  /* ================================================================ */
  /*  NOTES GRID UI                                                   */
  /* ================================================================ */
  return (
    <div className="flex flex-col h-full -mx-2 px-2 pb-6">
      
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-8">
         <h1 className="text-2xl font-semibold text-foreground tracking-tight">Notes</h1>
         <button
            onClick={() => openEditor()}
            className="flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-transform hover:scale-105 active:scale-95 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Note
          </button>
      </div>

      {/* Modern Group Filter */}
      {allGroupNames.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveGroup(null)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
              activeGroup === null 
                ? "bg-foreground text-background shadow-sm" 
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
            }`}
          >
            Ungrouped <span className="opacity-60 ml-1">{notes.filter((n) => !n.group).length}</span>
          </button>
          
          {allGroupNames.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                activeGroup === g 
                  ? "bg-foreground text-background shadow-sm" 
                  : "border border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {g} <span className="opacity-60 ml-1">{groupCounts[g] || 0}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {activeGroup === null ? "Ungrouped Notes" : `${activeGroup} Collection`}
        </h2>
        
        {activeGroup !== null && (
          <button
            onClick={() => handleExportGroup(activeGroup)}
            disabled={exportingGroup === activeGroup}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            {exportingGroup === activeGroup ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <HardDrive className="h-3.5 w-3.5" />
            )}
            Export Group to Drive
          </button>
        )}
      </div>

      {/* Masonry Grid Simulation (flex or true masonry) */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-24 bg-muted/10 mx-auto w-full max-w-2xl mt-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
            {activeGroup ? <Folder className="h-5 w-5 text-muted-foreground" /> : <Plus className="h-5 w-5 text-muted-foreground" />}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground"> Empty Space </p>
            <p className="mt-1 text-xs text-muted-foreground"> Your thoughts go here. Start writing. </p>
          </div>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {filtered.map((note) => (
            <div
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className="group break-inside-avoid flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:bg-muted/20 cursor-pointer shadow-sm hover:shadow-md hover:border-foreground/30 relative"
            >
              <h4 className="text-base font-semibold text-foreground leading-snug pr-6">{note.title}</h4>
              
              {/* Preview with typography but severely truncated */}
              <div className="prose dark:prose-invert prose-sm line-clamp-4 text-muted-foreground opacity-80 pointer-events-none text-xs leading-relaxed max-w-none">
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
              </div>
              
              <div className="mt-2 flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-[10px] font-medium text-muted-foreground/70">{note.date}</span>
                {note.group && (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{note.group}</span>
                )}
              </div>

              <div className="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100 p-1.5 rounded-md bg-background border border-border">
                 <Maximize2 className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note Detail Reader Modal */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 md:p-12 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 fade-in flex flex-col max-h-[90vh]">
            
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/80 px-8 py-5 backdrop-blur-md rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">{selectedNote.title}</h2>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs font-medium text-muted-foreground">{selectedNote.date}</span>
                  {selectedNote.group && (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">{selectedNote.group}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 bg-background rounded-full border border-border p-1 shadow-sm">
                <button 
                  onClick={() => openEditor(selectedNote)} 
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Edit Note
                </button>
                <button 
                  onClick={() => handleExportNote(selectedNote)} 
                  disabled={exportingNoteId === selectedNote.id}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-indigo-500 transition-colors hover:bg-indigo-500/10 disabled:opacity-50"
                  title="Export to Google Drive"
                >
                  {exportingNoteId === selectedNote.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <HardDrive className="h-3.5 w-3.5" />
                  )}
                </button>
                <button 
                  onClick={() => handleDeleteNote(selectedNote.id)} 
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="w-px h-4 bg-border"></div>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ml-1"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="prose dark:prose-invert max-w-none prose-sm md:prose-base prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-a:font-medium prose-a:underline prose-a:underline-offset-2 text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedNote.content}
                </ReactMarkdown>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
