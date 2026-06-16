import React from 'react'
import { Plus, Trash2, Users, DollarSign, Wallet2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface SharedExpensesProps {
  expenses: any[]
  debts: any[]
  members: any[]
  activeUserId: string | null | undefined
  onAddExpense: (data: { 
    description: string 
    amount: number 
    category: string 
    isPersonal: boolean
    payerId: string
    splits: { userId: string; amount: number }[]
  }) => void
  onDeleteExpense: (expenseId: string) => void
  onSettleUpClick: () => void
}

export const SharedExpenses = ({
  expenses,
  debts,
  members,
  activeUserId,
  onAddExpense,
  onDeleteExpense,
  onSettleUpClick
}: SharedExpensesProps) => {
  const [description, setDescription] = React.useState('')
  const [amount, setAmount] = React.useState('')
  const [category, setCategory] = React.useState('Groceries')

  const categories = ['Rent', 'Groceries', 'Date night', 'Shopping', 'Bills', 'Travel', 'Others']

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!description || isNaN(amt) || amt <= 0 || members.length === 0) return

    // Standard Splitwise split: split equally among all members
    const splitAmount = Number((amt / members.length).toFixed(2))
    const splits = members.map(m => ({
      userId: m.id,
      amount: splitAmount
    }))

    onAddExpense({
      description,
      amount: amt,
      category,
      isPersonal: false,
      payerId: activeUserId || '',
      splits
    })

    setDescription('')
    setAmount('')
  }

  const formatLocalDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Filter debts involving the current user
  const userDebts = React.useMemo(() => {
    return debts.filter(d => d.from === activeUserId || d.to === activeUserId)
  }, [debts, activeUserId])

  return (
    <div className="flex-1 flex gap-6 overflow-hidden h-full select-none">
      {/* Balances panel and splits lists */}
      <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
        {/* Balances Board */}
        <div className="bg-card/40 border border-border/40 rounded-2xl p-5 shrink-0 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Group Balances</h3>
            </div>
            {userDebts.length > 0 && (
              <button
                onClick={onSettleUpClick}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <DollarSign className="h-3 w-3" />
                Settle Up
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {userDebts.length === 0 ? (
              <div className="col-span-2 text-xs text-muted-foreground/60 italic py-2">
                All settled up! No outstanding balances in the server.
              </div>
            ) : (
              userDebts.map((d, i) => {
                const owesMe = d.to === activeUserId
                return (
                  <div 
                    key={i} 
                    className={`border rounded-xl p-3 flex items-center justify-between ${
                      owesMe 
                        ? 'border-emerald-500/20 bg-emerald-500/5' 
                        : 'border-rose-500/20 bg-rose-500/5'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase leading-none mb-1">
                        {owesMe ? 'Owed to you' : 'You owe'}
                      </p>
                      <p className="text-xs font-bold text-foreground truncate leading-none">
                        {owesMe ? d.fromName : d.toName}
                      </p>
                    </div>
                    <span className={`text-xs font-black font-mono ${owesMe ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${d.amount.toFixed(2)}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Expenses List Panel */}
        <div className="flex-1 bg-card/40 rounded-2xl border border-border/40 p-5 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-4 border-b border-border/40 pb-2">
            <Wallet2 className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Shared Bill Log</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {expenses.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 italic text-muted-foreground/60 text-xs">
                No bills logged yet. Log groceries, rent, etc. to split.
              </div>
            ) : (
              expenses.map(exp => {
                const isPayer = exp.payerId === activeUserId
                return (
                  <div 
                    key={exp.id}
                    className="bg-muted/10 border border-border/30 rounded-xl p-3 flex items-center justify-between group hover:border-primary/20 transition select-text"
                  >
                    <div className="min-w-0 pr-4 flex items-center gap-3">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={exp.payer?.imageUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                          {exp.payer?.fullName?.charAt(0).toUpperCase() || 'M'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5 uppercase tracking-wider mb-1 inline-block leading-none">
                          {exp.category}
                        </span>
                        <h4 className="text-xs font-bold text-foreground truncate break-words mb-0.5 leading-tight">
                          {exp.description}
                        </h4>
                        <p className="text-[9px] text-muted-foreground/60 leading-none">
                          Paid by {exp.payer?.fullName} on {formatLocalDate(exp.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 select-none">
                      <div className="text-right">
                        <p className="text-xs font-black font-mono text-foreground">${Number(exp.amount).toFixed(2)}</p>
                        <p className="text-[8px] font-bold text-muted-foreground">
                          {isPayer ? 'You split' : `Your split: $${(Number(exp.amount) / members.length).toFixed(2)}`}
                        </p>
                      </div>
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="opacity-0 group-hover:opacity-100 hover:text-rose-500 text-muted-foreground transition cursor-pointer p-1 rounded-lg hover:bg-muted/60"
                        title="Delete Bill"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Logger Form Panel */}
      <div className="w-80 bg-card/40 border border-border/40 rounded-2xl p-5 flex flex-col h-full justify-between">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="border-b border-border/40 pb-2 mb-2">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Log Shared Bill</h4>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Pizza, Rent payment"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#161c2e] border border-border/40 text-foreground text-xs font-medium px-3 py-2 rounded-xl outline-none focus:border-primary transition"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Bill Amount ($)</label>
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

          <p className="text-[9px] text-muted-foreground/60 leading-relaxed italic mt-2">
            * Note: Bill will be split equally among all {members.length} members of this server.
          </p>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer mt-4"
          >
            <Plus className="h-4 w-4" />
            Add Shared Bill
          </button>
        </form>
      </div>
    </div>
  )
}
