import React from 'react'
import { Wallet, Users2, Landmark } from 'lucide-react'
import { pusherClient } from '../lib/pusher-client'
import { isClerkConfigured } from '../lib/clerk-fallback'
import { ExpenseChart } from './ExpenseChart'
import { ExpenseLedger } from './ExpenseLedger'
import { SharedExpenses } from './SharedExpenses'
import { SettleUpModal } from './SettleUpModal'

interface ExpenseTrackerViewProps {
  serverId: string
  activeUserId: string | null | undefined
  getToken: () => Promise<string | null>
}

export const ExpenseTrackerView = ({
  serverId,
  activeUserId,
  getToken
}: ExpenseTrackerViewProps) => {
  const [activeTab, setActiveTab] = React.useState<'personal' | 'shared'>('personal')
  const [personalExpenses, setPersonalExpenses] = React.useState<any[]>([])
  const [sharedExpenses, setSharedExpenses] = React.useState<any[]>([])
  const [debts, setDebts] = React.useState<any[]>([])
  const [members, setMembers] = React.useState<any[]>([])
  const [isSettleOpen, setIsSettleOpen] = React.useState(false)

  // Fetch initial personal ledger, shared bills, and split balances
  const fetchExpenses = React.useCallback(async () => {
    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch(`/api/expenses?serverId=${serverId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setPersonalExpenses(data.personal || [])
        setSharedExpenses(data.shared || [])
        setDebts(data.debts || [])
        setMembers(data.members || [])
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err)
    }
  }, [serverId, getToken])

  React.useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  // Pusher subscription to sync shared server expenses
  React.useEffect(() => {
    if (!pusherClient || !serverId) return

    const channel = pusherClient.subscribe(`server-${serverId}`)

    channel.bind('expense-updated', () => {
      // Refresh the entire payload to recalculate splitwise balances
      fetchExpenses()
    })

    return () => {
      channel.unbind('expense-updated')
      pusherClient.unsubscribe(`server-${serverId}`)
    }
  }, [serverId, fetchExpenses])

  const handleAddExpense = async (data: { 
    description: string
    amount: number
    category: string
    isPersonal: boolean
    payerId?: string
    splits?: { userId: string; amount: number }[]
  }) => {
    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          serverId,
          payerId: activeUserId,
          ...data
        })
      })
      if (res.ok) {
        // Refetch/re-calculate
        fetchExpenses()
      }
    } catch (err) {
      console.error('Failed to log expense:', err)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const token = isClerkConfigured ? await getToken() : 'mock-token'
      const res = await fetch(`/api/expenses?expenseId=${expenseId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (res.ok) {
        fetchExpenses()
      }
    } catch (err) {
      console.error('Failed to delete expense:', err)
    }
  }

  // Record settlement transaction paid by activeUser to creditor
  const handleSettleUp = async (debt: { from: string; to: string; amount: number; toName: string }) => {
    await handleAddExpense({
      description: `Settlement: Paid ${debt.toName}`,
      amount: debt.amount,
      category: 'Others',
      isPersonal: false,
      payerId: activeUserId || '',
      splits: [{ userId: debt.to, amount: debt.amount }]
    })
  }

  return (
    <div className="h-full flex flex-col bg-muted/10 overflow-hidden select-none">
      {/* Expense Header bar */}
      <div className="h-12 border-b border-border bg-card/60 backdrop-blur-sm px-6 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Landmark className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Expense Tracker</h2>
        </div>

        {/* Ledger vs Shared tab toggle */}
        <div className="flex items-center gap-2 bg-muted/10 border border-border/40 rounded-xl px-2 py-1 select-none">
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                : 'hover:bg-muted/40 text-muted-foreground'
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            Personal Ledger
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'shared'
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                : 'hover:bg-muted/40 text-muted-foreground'
            }`}
          >
            <Users2 className="h-3.5 w-3.5" />
            Shared Bills
          </button>
        </div>

        <div className="w-24" /> {/* Spacer */}
      </div>

      {/* Analytics & tab content wrapper */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Main interactive panel */}
        <div className="flex-1 overflow-hidden h-full">
          {activeTab === 'personal' ? (
            <ExpenseLedger
              expenses={personalExpenses}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              activeUserId={activeUserId}
            />
          ) : (
            <SharedExpenses
              expenses={sharedExpenses}
              debts={debts}
              members={members}
              activeUserId={activeUserId}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onSettleUpClick={() => setIsSettleOpen(true)}
            />
          )}
        </div>

        {/* Budget Analytics column */}
        <div className="w-80 flex flex-col gap-6 shrink-0 h-full overflow-hidden justify-start">
          <ExpenseChart expenses={activeTab === 'personal' ? personalExpenses : sharedExpenses} />
        </div>
      </div>

      {/* Settle Up Dialog */}
      <SettleUpModal
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        debts={debts}
        activeUserId={activeUserId}
        onSettle={handleSettleUp}
      />
    </div>
  )
}
