import { X, Check } from 'lucide-react'

interface SettleUpModalProps {
  isOpen: boolean
  onClose: () => void
  debts: any[]
  activeUserId: string | null | undefined
  onSettle: (debt: { from: string; to: string; amount: number; toName: string }) => void
}

export const SettleUpModal = ({
  isOpen,
  onClose,
  debts,
  activeUserId,
  onSettle
}: SettleUpModalProps) => {

  if (!isOpen) return null

  // Debts where activeUser is the sender (debtor)
  const myDebts = debts.filter(d => d.from === activeUserId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none">
      <div className="bg-[#0f131f] border border-border/60 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 border-b border-border/40 pb-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Settle Balances</h3>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/40 p-1.5 rounded-lg transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Debts List */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {myDebts.length === 0 ? (
            <p className="text-xs text-muted-foreground/75 italic text-center py-6">
              You do not owe money to any server members.
            </p>
          ) : (
            myDebts.map((d, i) => (
              <div 
                key={i}
                className="bg-muted/10 border border-border/30 rounded-xl p-4 flex items-center justify-between hover:border-emerald-500/20 transition"
              >
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">
                    Pay To
                  </p>
                  <p className="text-xs font-bold text-foreground leading-none">
                    {d.toName}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs font-black font-mono text-rose-400">
                    ${d.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => {
                      onSettle(d)
                      onClose()
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black p-2 rounded-lg transition cursor-pointer flex items-center gap-1"
                    title="Mark as Settled"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Record Pay
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-border/40 mt-5">
          <button
            onClick={onClose}
            className="bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
