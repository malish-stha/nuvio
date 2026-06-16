import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { MessageSquare, Plus } from 'lucide-react'

interface NavigationSidebarProps {
  servers: any[]
  activeServerId: string
  handleServerSelect: (id: string) => void
  setIsCreateServerOpen: (open: boolean) => void
}

export const NavigationSidebar = ({
  servers,
  activeServerId,
  handleServerSelect,
  setIsCreateServerOpen
}: NavigationSidebarProps) => {
  return (
    <aside className="w-[72px] bg-muted flex flex-col items-center py-4 space-y-4 border-r border-border shrink-0 select-none">
      {/* Home/DMs Button */}
      <Tooltip>
        <TooltipTrigger
          render={
            <div
              onClick={() => handleServerSelect('dms')}
              className={`w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-300 shadow-lg ${
                activeServerId === 'dms'
                  ? 'rounded-xl bg-primary text-primary-foreground shadow-primary/20'
                  : 'rounded-3xl bg-card hover:bg-primary hover:text-primary-foreground hover:rounded-xl border border-border text-foreground/80'
              }`}
            >
              <MessageSquare className="h-5 w-5" />
            </div>
          }
        />
        <TooltipContent side="right">Direct Messages</TooltipContent>
      </Tooltip>

      <div className="w-8 h-[2px] bg-border rounded" />

      {/* Servers List */}
      <div className="flex-1 w-full flex flex-col items-center space-y-3 overflow-y-auto no-scrollbar">
        {servers.map((srv) => (
          <Tooltip key={srv.id}>
            <TooltipTrigger
              render={
                <div
                  onClick={() => handleServerSelect(srv.id)}
                  className={`w-12 h-12 flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-300 relative select-none uppercase ${
                    activeServerId === srv.id
                      ? 'rounded-xl bg-primary text-primary-foreground'
                      : 'rounded-3xl bg-card hover:bg-primary hover:text-primary-foreground hover:rounded-xl border border-border text-foreground/80'
                  }`}
                >
                  {activeServerId === srv.id && (
                    <div className="absolute left-0 w-1 h-8 bg-primary-foreground rounded-r-md -translate-x-[12px]" />
                  )}
                  
                  {srv.imageUrl ? (
                    <img src={srv.imageUrl} alt={srv.name} className="w-full h-full object-cover rounded-[inherit]" />
                  ) : (
                    srv.name.split(' ').map((w: string) => w[0]).join('').substring(0, 3)
                  )}
                </div>
              }
            />
            <TooltipContent side="right">{srv.name}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="w-8 h-[2px] bg-border rounded" />

      {/* Add/Join Server Button */}
      <Tooltip>
        <TooltipTrigger
          render={
            <div
              onClick={() => setIsCreateServerOpen(true)}
              className="w-12 h-12 rounded-3xl bg-card hover:bg-primary/20 flex items-center justify-center text-primary cursor-pointer hover:text-foreground hover:rounded-xl transition-all duration-300 border border-border"
            >
              <Plus className="h-5 w-5" />
            </div>
          }
        />
        <TooltipContent side="right">Add / Join Server</TooltipContent>
      </Tooltip>
    </aside>
  )
}
