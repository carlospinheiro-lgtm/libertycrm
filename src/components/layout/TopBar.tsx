import { Bell, Search, User, Building2, Menu, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAgentFilter } from '@/contexts/AgentFilterContext';
import { useAgencyActiveUsers } from '@/hooks/useAgencyActiveUsers';
import { useAuth } from '@/contexts/AuthContext';

interface TopBarProps {
  sidebarCollapsed: boolean;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function TopBar({ sidebarCollapsed, onMenuClick, showMenuButton = false }: TopBarProps) {
  const { currentUser } = useAuth();
  const { selectedAgentId, setSelectedAgentId, isAgentLocked } = useAgentFilter();
  const { data: agents = [] } = useAgencyActiveUsers(currentUser?.agencyId);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 bg-card border-b border-border transition-all duration-300",
        showMenuButton ? 'left-0' : (sidebarCollapsed ? 'left-16' : 'left-64')
      )}
    >
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Left side - Menu button and Search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          {showMenuButton && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onMenuClick}
              className="shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <div className="relative flex-1 hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              className="pl-10 bg-background"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Global Agent Filter */}
          <div className="hidden md:flex items-center gap-1.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedAgentId}
              onValueChange={setSelectedAgentId}
              disabled={isAgentLocked}
            >
              <SelectTrigger className="w-[160px] h-9 text-sm">
                <SelectValue placeholder="Agente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Agentes</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Agency Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 hidden md:flex">
                <Building2 className="h-4 w-4" />
                <span>Braga</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Liberty Braga</DropdownMenuItem>
              <DropdownMenuItem>Liberty Barcelos</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Todas as Agências</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-accent text-accent-foreground">
              3
            </Badge>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 pl-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    JD
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">João Diretor</span>
                  <span className="text-xs text-muted-foreground">Administrador</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>Definições</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Terminar Sessão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
