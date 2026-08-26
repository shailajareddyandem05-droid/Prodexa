"use client"

import { useState, useEffect, KeyboardEvent } from "react"
import { Sparkles, Plus, X, Trash2, Wallet, TrendingUp, Calendar, ReceiptText, Loader2 } from "lucide-react"
import api from "@/lib/api"

interface Expense {
  id: string
  name: string
  amount: number
  category: string
  date: string
}

const categories = ["Food", "Transport", "Books", "Entertainment", "Groceries", "Rent", "Utilities", "Other"]

function getToday() {
  return new Date().toISOString().split("T")[0]
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("Food")
  const [date, setDate] = useState(getToday())
  
  // Smart Input State
  const [smartInput, setSmartInput] = useState("")
  const [isParsing, setIsParsing] = useState(false)

  // AI Review State
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false)
  const [currentInsight, setCurrentInsight] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("prodexa_expenses")
    if (saved) setExpenses(JSON.parse(saved))
  }, [])

  function save(updated: Expense[]) {
    setExpenses(updated)
    localStorage.setItem("prodexa_expenses", JSON.stringify(updated))
  }

  function addExpense() {
    if (!name.trim() || !amount) return
    const expense: Expense = {
      id: Date.now().toString(),
      name: name.trim(),
      amount: parseFloat(amount),
      category,
      date,
    }
    save([expense, ...expenses])
    setName("")
    setAmount("")
    setCategory("Food")
    setDate(getToday())
    setShowAdd(false)
  }

  function deleteExpense(id: string) {
    save(expenses.filter((e) => e.id !== id))
  }

  async function handleSmartSubmit(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && smartInput.trim() && !isParsing) {
      setIsParsing(true)
      try {
        const res = await api.ai.expenseParse(smartInput.trim())
        if (res.expense) {
          const expense: Expense = {
            id: Date.now().toString(),
            name: res.expense.name || "Quick Entry",
            amount: res.expense.amount || 0,
            category: res.expense.category || "Other",
            date: getToday(),
          }
          if (expense.amount > 0) {
            save([expense, ...expenses])
            setSmartInput("")
          } else {
            setName(smartInput)
            setShowAdd(true)
            setSmartInput("")
          }
        }
      } catch (err) {
        console.error(err)
        setName(smartInput)
        setShowAdd(true)
        setSmartInput("")
      } finally {
        setIsParsing(false)
      }
    }
  }

  async function handleInsight() {
    if (expenses.length === 0) return
    setIsGeneratingInsight(true)
    try {
      const res = await api.ai.expenseInsights(expenses)
      if (res.insight) setCurrentInsight(res.insight)
    } catch (e) {
      console.error(e)
    } finally {
      setIsGeneratingInsight(false)
    }
  }

  const today = getToday()
  const todayTotal = expenses.filter((e) => e.date === today).reduce((sum, e) => sum + e.amount, 0)

  const thisWeekStart = new Date()
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
  const weekTotal = expenses.filter((e) => new Date(e.date) >= thisWeekStart).reduce((sum, e) => sum + e.amount, 0)

  const thisMonthStart = new Date()
  thisMonthStart.setDate(1)
  const monthTotal = expenses.filter((e) => new Date(e.date) >= thisMonthStart).reduce((sum, e) => sum + e.amount, 0)

  const categoryTotals: Record<string, number> = {}
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount
  })
  const maxCategory = Math.max(...Object.values(categoryTotals), 1)

  return (
    <div className="flex flex-col gap-8 max-w-5xl w-full mx-auto pb-12">
      
      {/* Header & Smart Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2">
            <ReceiptText className="h-6 w-6" /> Expenses
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleInsight}
              disabled={expenses.length === 0 || isGeneratingInsight}
              className="hidden sm:flex items-center gap-2 rounded-full border border-border/50 bg-background px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-muted disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98] shadow-sm whitespace-nowrap"
            >
              {isGeneratingInsight ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Sparkles className="h-4 w-4 text-foreground" />
              )}
              Financial Review
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-transform hover:scale-105 active:scale-95 shadow-sm whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              Manual Log
            </button>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            {isParsing ? (
              <Loader2 className="h-4 w-4 text-foreground animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            )}
          </div>
          <input 
            type="text"
            value={smartInput}
            onChange={e => setSmartInput(e.target.value)}
            onKeyDown={handleSmartSubmit}
            disabled={isParsing}
            placeholder="Log quickly... 'Bought two coffees and a muffin for 12.50 at the station'"
            className="w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-6 text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-foreground/30 focus:shadow-sm disabled:opacity-50"
          />
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
             <span className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase border border-border px-2 py-0.5 rounded-md hidden sm:block">
               ENTER to Parse & Save
             </span>
          </div>
        </div>
      </div>

      {/* AI Performance Insight Callout */}
      {currentInsight && (
        <div className="animate-in slide-in-from-bottom-4 fade-in relative overflow-hidden rounded-2xl bg-foreground text-background p-6 shadow-xl mb-2">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Wallet className="h-32 w-32 -mt-4 -mr-4" />
          </div>
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex gap-4 sm:gap-6">
              <div className="h-10 w-10 shrink-0 rounded-full bg-background/20 flex items-center justify-center shadow-inner">
                <Sparkles className="h-5 w-5 text-background" />
              </div>
              <div className="pt-0.5">
                 <h3 className="font-semibold text-lg tracking-tight mb-2">Financial Advisor Review</h3>
                 <p className="text-background/90 leading-relaxed text-sm lg:text-base pr-8">{currentInsight}</p>
              </div>
            </div>
            <button onClick={() => setCurrentInsight("")} className="shrink-0 p-2 hover:bg-background/20 rounded-full transition-colors text-background/60 hover:text-background active:scale-95">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modern Typographic Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between overflow-hidden relative group">
          <div className="mb-6 flex items-center justify-between z-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Today</p>
            <Wallet className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-foreground/80" />
          </div>
          <p className="text-4xl font-bold text-foreground tracking-tight z-10 flex items-baseline gap-1">
            <span className="text-xl text-muted-foreground font-medium">₹</span>{todayTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between relative group overflow-hidden">
          <div className="mb-6 flex items-center justify-between z-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">This Week</p>
            <TrendingUp className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-foreground/80" />
          </div>
          <p className="text-4xl font-bold text-foreground tracking-tight z-10 flex items-baseline gap-1">
            <span className="text-xl text-muted-foreground font-medium">₹</span>{weekTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between relative group overflow-hidden">
          <div className="mb-6 flex items-center justify-between z-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">This Month</p>
            <Calendar className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-foreground/80" />
          </div>
          <p className="text-4xl font-bold text-foreground tracking-tight z-10 flex items-baseline gap-1">
            <span className="text-xl text-muted-foreground font-medium">₹</span>{monthTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-2">
        {/* Sleek List View */}
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1 border-b border-border pb-2">
            Recent Ledger
          </h2>
          
          {expenses.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-xl bg-muted/10 opacity-70 mt-4">
              <p className="text-sm font-medium text-foreground">Clean slate</p>
              <p className="text-xs text-muted-foreground">No expenses recorded yet. Use the magic bar above.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-foreground/30"
                >
                  <div className="flex items-center gap-4 min-w-0">
                     <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-muted/60 text-muted-foreground text-xs font-bold uppercase border border-border/50">
                        {expense.category.substring(0,2)}
                     </span>
                     <div className="flex flex-col min-w-0">
                       <p className="text-sm font-medium text-foreground truncate max-w-[150px] sm:max-w-xs">{expense.name}</p>
                       <div className="flex gap-2 items-center">
                          <p className="text-[10px] text-muted-foreground font-medium">{expense.date}</p>
                          <span className="text-[9px] uppercase tracking-wider bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground">{expense.category}</span>
                       </div>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm font-bold text-foreground tracking-tight">
                       ₹{expense.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <button
                      onClick={() => deleteExpense(expense.id)}
                      className="opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Minimal Breakdown */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1 border-b border-border pb-2">
            Distribution
          </h2>
          <div className="rounded-xl border border-border bg-card p-5 mt-2">
            <div className="flex flex-col gap-4">
              {Object.entries(categoryTotals)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, total]) => (
                  <div key={cat} className="group flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">{cat}</span>
                      <span className="font-semibold text-foreground tracking-tight">₹{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-foreground transition-all"
                        style={{ width: `${(total / maxCategory) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              {Object.keys(categoryTotals).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No data to distribute</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add expense modal (Manual fallback) */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 fade-in">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Manual Log</h2>
              <button
                onClick={() => setShowAdd(false)}
                className="flex items-center justify-center rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                 <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Item Name</label>
                 <input
                   type="text"
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   autoFocus
                   className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30"
                 />
              </div>
              <div className="flex flex-col gap-1.5">
                 <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cost (₹)</label>
                 <input
                   type="number"
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30"
                 />
              </div>
              <div className="flex flex-col gap-1.5">
                 <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
                 <select
                   value={category}
                   onChange={(e) => setCategory(e.target.value)}
                   className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30"
                 >
                   {categories.map((c) => (
                     <option key={c} value={c}>{c}</option>
                   ))}
                 </select>
              </div>
              <div className="flex flex-col gap-1.5 mb-2">
                 <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</label>
                 <input
                   type="date"
                   value={date}
                   onChange={(e) => setDate(e.target.value)}
                   className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/30 dark:[color-scheme:dark]"
                 />
              </div>

              <button
                onClick={addExpense}
                disabled={!name.trim() || !amount}
                className="rounded-lg bg-foreground py-2.5 text-sm font-semibold text-background transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 mt-2 shadow-sm"
              >
                Save Protocol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
