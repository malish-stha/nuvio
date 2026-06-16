import React from 'react'
import { Plus, Trash2, Wallet } from 'lucide-react'

interface ExpenseLedgerProps {
  expenses: any[]
  onAddExpense: (data: { description: string; amount: number; category: string; isPersonal: boolean }) => void
  onDeleteExpense: (expenseId: string) => void
  activeUserId: string | null | undefined
}

export const ExpenseLedger = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
  activeUserId
}: ExpenseLedgerProps) => {
  const [description, setDescription] = React.useState('')
  const [amount, setAmount] = React.useState('')
  const [category, setCategory] = React.useState('Groceries')

  const categories = ['Rent', 'Groceries', 'Date night', 'Shopping', 'Bills', 'Travel', 'Others']

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!description || isNaN(amt) || amt <= 0) return
    
    onAddExpense({
      description,
      amount: amt,
      category,
      isPersonal: true
    })

    setDescription('')
    setAmount('')
  }

  const formatLocalDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="flex-1 flex gap-6 overflow-hidden h-full">
      {/* List Panel */}
      <div className="flex-1 bg-card/40 rounded-2xl border border-border/40 p-5 flex flex-col h-full overflow-hidden select-none">
        <div className="flex items-center gap-2 mb-4 border-b border-border/40 pb-2">
          <Wallet className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Private Expense Ledger</h3>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
          {expenses.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 italic text-muted-foreground/60 text-xs">
              No private daily expenses logged yet.
            </div>
          ) : (
            expenses.map(exp => (
              <div 
                key={exp.id}
                className="bg-muted/10 border border-border/30 rounded-xl p-3 flex items-center justify-between group hover:border-primary/20 transition select-text"
              >
                <div className="min-w-0 pr-4">
                  <span className="text-[9px] font-bold bg-muted-foreground/15 text-muted-foreground rounded px-1.5 py-0.5 uppercase tracking-wider mb-1.5 inline-block">
                    {exp.category}
                  </span>
                  <h4 className="text-xs font-bold text-foreground truncate break-words mb-0.5">
                    {exp.description}
                  </h4>
                  <span className="text-[9px] text-muted-foreground/60 leading-none">
                    {formatLocalDate(exp.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-4 shrink-0 select-none">
                  <span className="text-xs font-black font-mono text-foreground">
                    -${Number(exp.amount).toFixed(2)}
                  </span>
                  <button
                    onClick={() => onDeleteExpense(exp.id)}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-500 text-muted-foreground transition cursor-pointer p-1 rounded-lg hover:bg-muted/60"
                    title="Delete Transaction"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Logger Form Panel */}
      <div className="w-80 bg-card/40 border border-border/40 rounded-2xl p-5 flex flex-col h-full select-none justify-between">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="border-b border-border/40 pb-2 mb-2">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Log New Transaction</h4>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Electric Bill, Coffee"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#161c2e] border border-border/40 text-foreground text-xs font-medium px-3 py-2 rounded-xl outline-none focus:border-primary transition"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#161c2e] border border-border/40 text-foreground text-xs font-semibold px-3 py-2 rounded-xl outline-none focus:border-primary transition font-mono"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#161c2e] border border-border/40 text-foreground text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-primary transition cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer mt-4"
          >
            <Plus className="h-4 w-4" />
            Add Private Item
          </button>
        </form>
      </div>
    </div>
  )
}
