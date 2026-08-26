"use client"

import { useState, useEffect } from "react"
import { Plus, X, Trash2, GraduationCap, Calculator, FileText, ChevronDown, Sparkles, Loader2 } from "lucide-react"
import api from "@/lib/api"

interface Subject {
  id: string
  name: string
  credits: number
  grade: string
}

interface Semester {
  id: string
  name: string
  subjects: Subject[]
}

const gradePoints: Record<string, number> = {
  "O": 10, "A+": 9, "A": 8, "B+": 7, "B": 6, "C": 5, "D": 4, "F": 0,
}

const gradeOptions = Object.keys(gradePoints)

function calculateGPA(subjects: Subject[]): number {
  if (subjects.length === 0) return 0
  const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0)
  if (totalCredits === 0) return 0
  const totalPoints = subjects.reduce((sum, s) => sum + s.credits * (gradePoints[s.grade] || 0), 0)
  return totalPoints / totalCredits
}

export default function GPAPage() {
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [showAddSubject, setShowAddSubject] = useState<string | null>(null)
  const [showAddSemester, setShowAddSemester] = useState(false)
  
  // Forms
  const [semName, setSemName] = useState("")
  const [subName, setSubName] = useState("")
  const [subCredits, setSubCredits] = useState("3")
  const [subGrade, setSubGrade] = useState("A")

  // Add accordion state for semesters
  const [expandedSems, setExpandedSems] = useState<Record<string, boolean>>({})

  // AI Review State
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false)
  const [currentInsight, setCurrentInsight] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("prodexa_gpa")
    if (saved) {
      const parsed = JSON.parse(saved)
      setSemesters(parsed)
      // Expand all by default
      const exp: Record<string, boolean> = {}
      parsed.forEach((s: Semester) => { exp[s.id] = true })
      setExpandedSems(exp)
    }
  }, [])

  function save(updated: Semester[]) {
    setSemesters(updated)
    localStorage.setItem("prodexa_gpa", JSON.stringify(updated))
  }

  function toggleSem(id: string) {
    setExpandedSems(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function addSemester() {
    if (!semName.trim()) return
    const id = Date.now().toString()
    const sem: Semester = { id, name: semName.trim(), subjects: [] }
    save([...semesters, sem])
    setExpandedSems(prev => ({ ...prev, [id]: true }))
    setSemName("")
    setShowAddSemester(false)
  }

  function addSubject(semId: string) {
    if (!subName.trim()) return
    const sub: Subject = {
      id: Date.now().toString(),
      name: subName.trim(),
      credits: parseInt(subCredits) || 3,
      grade: subGrade,
    }
    save(
      semesters.map((s) =>
        s.id === semId ? { ...s, subjects: [...s.subjects, sub] } : s
      )
    )
    setSubName("")
    setSubCredits("3")
    setSubGrade("A")
    setShowAddSubject(null)
  }

  function deleteSubject(semId: string, subId: string) {
    save(
      semesters.map((s) =>
        s.id === semId
          ? { ...s, subjects: s.subjects.filter((sub) => sub.id !== subId) }
          : s
      )
    )
  }

  function deleteSemester(semId: string) {
    if (!confirm("Delete this entire semester?")) return
    save(semesters.filter((s) => s.id !== semId))
  }

  async function handleInsight() {
    if (semesters.length === 0) return
    setIsGeneratingInsight(true)
    try {
      const res = await api.ai.gpaInsights(semesters)
      if (res.insight) setCurrentInsight(res.insight)
    } catch (e) {
      console.error(e)
    } finally {
      setIsGeneratingInsight(false)
    }
  }

  const allSubjects = semesters.flatMap((s) => s.subjects)
  const cgpa = calculateGPA(allSubjects)
  const totalCredits = allSubjects.reduce((sum, s) => sum + s.credits, 0)

  return (
    <div className="flex flex-col gap-8 max-w-4xl w-full mx-auto pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2">
          <GraduationCap className="h-6 w-6" /> Academic GPA
        </h1>
        <div className="flex items-center gap-3">
            <button
              onClick={handleInsight}
              disabled={semesters.length === 0 || isGeneratingInsight}
              className="hidden sm:flex items-center gap-2 rounded-full border border-border/50 bg-background px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-muted disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98] shadow-sm whitespace-nowrap"
            >
              {isGeneratingInsight ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Sparkles className="h-4 w-4 text-foreground" />
              )}
              Academic Review
            </button>
            <button
              onClick={() => setShowAddSemester(true)}
              className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-transform hover:scale-105 active:scale-95 shadow-sm whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Add Semester
            </button>
        </div>
      </div>

      {/* AI Performance Insight Callout */}
      {currentInsight && (
        <div className="animate-in slide-in-from-bottom-4 fade-in relative overflow-hidden rounded-2xl bg-foreground text-background p-6 shadow-xl mb-2">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <GraduationCap className="h-32 w-32 -mt-4 -mr-4" />
          </div>
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex gap-4 sm:gap-6">
              <div className="h-10 w-10 shrink-0 rounded-full bg-background/20 flex items-center justify-center shadow-inner">
                <Sparkles className="h-5 w-5 text-background" />
              </div>
              <div className="pt-0.5">
                 <h3 className="font-semibold text-lg tracking-tight mb-2">Academic Advisor Review</h3>
                 <p className="text-background/90 leading-relaxed text-sm lg:text-base pr-8">{currentInsight}</p>
              </div>
            </div>
            <button onClick={() => setCurrentInsight("")} className="shrink-0 p-2 hover:bg-background/20 rounded-full transition-colors text-background/60 hover:text-background active:scale-95">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Massive Typography Hero Card */}
      <div className="rounded-3xl border border-border bg-card p-8 md:p-12 relative overflow-hidden group">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          
          <div className="md:col-span-2 flex flex-col">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Cumulative CGPA</p>
            <p className="text-7xl md:text-8xl font-black tracking-tighter text-foreground mb-4">
              {cgpa > 0 ? cgpa.toFixed(2) : "0.00"}
            </p>
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                 <span className="text-xl font-bold text-foreground">{totalCredits}</span>
                 <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Total Credits</span>
              </div>
              <div className="h-8 w-px bg-border/50"></div>
              <div className="flex flex-col">
                 <span className="text-xl font-bold text-foreground">{semesters.length}</span>
                 <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Semesters</span>
              </div>
              <div className="h-8 w-px bg-border/50"></div>
              <div className="flex flex-col">
                 <span className="text-xl font-bold text-foreground">{allSubjects.length}</span>
                 <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Courses</span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex justify-end opacity-20 group-hover:opacity-40 transition-opacity">
            <Calculator className="h-48 w-48 text-muted-foreground mix-blend-multiply dark:mix-blend-plus-lighter" />
          </div>
        </div>
      </div>

      {/* Semesters List */}
      <div className="flex flex-col gap-4 mt-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1 border-b border-border pb-2">
          Academic Timeline
        </h2>

        {semesters.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-border rounded-xl bg-muted/5 opacity-70 mt-4">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground tracking-tight">No academic data</p>
            <p className="text-xs text-muted-foreground mt-1">Add your first semester to begin calculating.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 mt-2">
            {semesters.map((sem) => {
              const semGPA = calculateGPA(sem.subjects)
              const semCredits = sem.subjects.reduce((sum, s) => sum + s.credits, 0)
              const isExpanded = expandedSems[sem.id]

              return (
                <div key={sem.id} className="rounded-2xl border border-border bg-card overflow-hidden transition-all shadow-sm">
                  {/* Semester Header */}
                  <div 
                    onClick={() => toggleSem(sem.id)}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 cursor-pointer bg-muted/10 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      <h2 className="text-lg font-bold tracking-tight text-foreground">{sem.name}</h2>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border border-border/50 px-2 py-0.5 rounded-full bg-background hidden sm:block">
                        {semCredits} Credits
                      </span>
                    </div>

                    <div className="flex items-center gap-6 mt-3 sm:mt-0 justify-between w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">GPA</span>
                         <span className="text-xl font-bold tracking-tight text-foreground">{semGPA > 0 ? semGPA.toFixed(2) : "0.00"}</span>
                      </div>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setShowAddSubject(sem.id)}
                          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted"
                        >
                          <Plus className="h-3 w-3" /> Course
                        </button>
                        <button
                          onClick={() => deleteSemester(sem.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Subjects List */}
                  {isExpanded && (
                    <div className="flex flex-col bg-background">
                      {sem.subjects.length === 0 ? (
                        <div className="px-6 py-8 text-center bg-background border-t border-border/50">
                          <p className="text-xs font-medium text-muted-foreground">Empty semester. Add courses to calculate GPA.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <div className="grid grid-cols-12 gap-2 border-y border-border/50 bg-muted/5 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            <div className="col-span-6">Course Name</div>
                            <div className="col-span-2 text-center">Credits</div>
                            <div className="col-span-2 text-center">Grade (Pts)</div>
                            <div className="col-span-2 text-right pr-2">Action</div>
                          </div>
                          
                          {sem.subjects.map((sub) => (
                            <div
                              key={sub.id}
                              className="group/sub grid grid-cols-12 items-center gap-2 border-b border-border/40 px-6 py-3.5 last:border-0 hover:bg-muted/10 transition-colors"
                            >
                              <div className="col-span-6 text-sm font-semibold text-foreground tracking-tight truncate pr-2">{sub.name}</div>
                              <div className="col-span-2 text-center text-xs font-medium text-muted-foreground">{sub.credits} <span className="text-[9px]">CR</span></div>
                              <div className="col-span-2 flex items-center justify-center gap-1.5">
                                <span className="flex items-center justify-center w-7 h-7 rounded bg-foreground text-background text-xs font-bold">
                                  {sub.grade}
                                </span>
                                <span className="text-xs font-medium text-muted-foreground hidden lg:block">({gradePoints[sub.grade] || 0})</span>
                              </div>
                              <div className="col-span-2 flex justify-end">
                                <button
                                  onClick={() => deleteSubject(sem.id, sub.id)}
                                  className="opacity-0 group-hover/sub:opacity-100 p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive rounded-md"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Semester Modal */}
      {showAddSemester && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Add Semester</h2>
              <button onClick={() => setShowAddSemester(false)} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g., Spring 2026"
              value={semName}
              onChange={(e) => setSemName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSemester()}
              autoFocus
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground placeholder-muted-foreground outline-none focus:border-foreground/30"
            />
            <button
              onClick={addSemester}
              disabled={!semName.trim()}
              className="mt-4 w-full rounded-lg bg-foreground py-3 text-sm font-bold text-background transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-[400px] rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Add Course</h2>
              <button onClick={() => setShowAddSubject(null)} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                 <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course Name</label>
                 <input
                   type="text"
                   placeholder="e.g. Data Structures"
                   value={subName}
                   onChange={(e) => setSubName(e.target.value)}
                   autoFocus
                   className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground placeholder-muted-foreground outline-none focus:border-foreground/30"
                 />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Credits</label>
                  <input
                    type="number"
                    value={subCredits}
                    onChange={(e) => setSubCredits(e.target.value)}
                    min="1"
                    max="10"
                    className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-foreground/30"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Letter Grade</label>
                  <select
                    value={subGrade}
                    onChange={(e) => setSubGrade(e.target.value)}
                    className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-foreground/30 font-bold"
                  >
                    {gradeOptions.map((g) => (
                      <option key={g} value={g}>{g} ({gradePoints[g]})</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button
                onClick={() => addSubject(showAddSubject)}
                disabled={!subName.trim()}
                className="mt-2 rounded-lg bg-foreground py-3 text-sm font-bold text-background transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              >
                Log Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
