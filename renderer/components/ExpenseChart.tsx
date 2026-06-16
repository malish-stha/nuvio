import React from 'react'

interface ExpenseChartProps {
  expenses: any[]
}

export const ExpenseChart = ({ expenses }: ExpenseChartProps) => {
  const categoryTotals = React.useMemo(() => {
    const totals: Record<string, number> = {}
    let grandTotal = 0

    expenses.forEach(e => {
      const amt = Number(e.amount)
      const cat = e.category || 'Other'
      totals[cat] = (totals[cat] || 0) + amt
      grandTotal += amt
    })

    return { totals, grandTotal }
  }, [expenses])

  const categories = Object.entries(categoryTotals.totals).sort((a, b) => b[1] - a[1])

  const getColorClass = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'rent':
      case 'housing':
        return 'bg-blue-500'
      case 'groceries':
      case 'food':
        return 'bg-emerald-500'
      case 'date night':
      case 'entertainment':
        return 'bg-purple-500'
      case 'shopping':
      case 'bills':
        return 'bg-amber-500'
      default:
        return 'bg-primary'
    }
  }

  return (
    <div className="bg-card/40 border border-border/40 rounded-2xl p-5 select-none shrink-0">
      <div className="flex flex-col mb-4">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Total Spent</span>
        <span className="text-xl font-black text-foreground font-mono leading-none">
          ${categoryTotals.grandTotal.toFixed(2)}
        </span>
      </div>

      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="text-[10px] text-muted-foreground/60 py-6 text-center italic">
            No spending logged yet this month.
          </div>
        ) : (
          categories.slice(0, 5).map(([cat, total]) => {
            const percentage = categoryTotals.grandTotal > 0 
              ? (total / categoryTotals.grandTotal) * 100 
              : 0

            return (
              <div key={cat} className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase leading-none">
                  <span className="truncate pr-4">{cat}</span>
                  <span className="font-mono text-foreground">${total.toFixed(2)} ({percentage.toFixed(0)}%)</span>
                </div>
                <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getColorClass(cat)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
