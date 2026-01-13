import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertCircle, CheckCircle, RefreshCcw, XCircle, ChevronDown, ChevronRight, Minus, Users } from 'lucide-react';
import { ImportPreviewUser, ImportPreviewTeam, FieldDiff } from '@/types/import';
import { cn } from '@/lib/utils';

interface ImportPreviewTableProps {
  type: 'users' | 'teams';
  data: ImportPreviewUser[] | ImportPreviewTeam[];
  onConfirmChange?: (index: number, confirmed: boolean) => void;
  showConfirmation?: boolean;
}

export function ImportPreviewTable({ 
  type, 
  data, 
  onConfirmChange,
  showConfirmation = false 
}: ImportPreviewTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const getActionBadge = (action: string, error?: string) => {
    if (error) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Erro
        </Badge>
      );
    }
    switch (action) {
      case 'create':
        return (
          <Badge className="gap-1 bg-emerald-500/20 text-emerald-700 border-emerald-300 hover:bg-emerald-500/30">
            <CheckCircle className="h-3 w-3" />
            Novo
          </Badge>
        );
      case 'update':
        return (
          <Badge className="gap-1 bg-amber-500/20 text-amber-700 border-amber-300 hover:bg-amber-500/30">
            <RefreshCcw className="h-3 w-3" />
            Modificar
          </Badge>
        );
      case 'no_change':
        return (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <Minus className="h-3 w-3" />
            Sem alterações
          </Badge>
        );
      case 'deactivate':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Desativar
          </Badge>
        );
      default:
        return <Badge variant="outline">Ignorar</Badge>;
    }
  };

  const renderDiffs = (diffs: FieldDiff[]) => (
    <div className="bg-muted/50 rounded-md p-3 mt-2 space-y-2">
      <p className="text-xs font-medium text-muted-foreground mb-2">Alterações detetadas:</p>
      {diffs.map((diff, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="font-medium text-muted-foreground w-24">{diff.fieldLabel}:</span>
          <span className="line-through text-destructive/70">{diff.currentValue || '-'}</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-emerald-600 font-medium">{diff.newValue}</span>
        </div>
      ))}
    </div>
  );

  if (type === 'users') {
    const users = data as ImportPreviewUser[];
    return (
      <div className="border rounded-lg max-h-[500px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              {showConfirmation && <TableHead className="w-10"></TableHead>}
              <TableHead className="w-10"></TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Equipa</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, i) => {
              const hasDiffs = user.diffs && user.diffs.length > 0;
              const isExpanded = expandedRows.has(i);
              
              return (
                <Collapsible key={i} open={isExpanded} onOpenChange={() => hasDiffs && toggleRow(i)} asChild>
                  <>
                    <TableRow 
                      className={cn(
                        user.error && 'bg-destructive/10',
                        user.action === 'create' && 'bg-emerald-50/50 dark:bg-emerald-950/20',
                        user.action === 'update' && 'bg-amber-50/50 dark:bg-amber-950/20',
                        user.action === 'no_change' && 'opacity-60'
                      )}
                    >
                      {showConfirmation && (
                        <TableCell>
                          {user.requiresConfirmation && (
                            <Checkbox
                              checked={user.confirmed}
                              onCheckedChange={(checked) => onConfirmChange?.(i, !!checked)}
                            />
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        {hasDiffs && (
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{user.external_id}</TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{user.team || '-'}</TableCell>
                      <TableCell>
                        {getActionBadge(user.action, user.error)}
                        {user.error && (
                          <p className="text-xs text-destructive mt-1">{user.error}</p>
                        )}
                      </TableCell>
                    </TableRow>
                    {hasDiffs && (
                      <CollapsibleContent asChild>
                        <tr>
                          <td colSpan={showConfirmation ? 9 : 8} className="p-0">
                            <div className="px-4 py-2 bg-muted/30">
                              {renderDiffs(user.diffs!)}
                            </div>
                          </td>
                        </tr>
                      </CollapsibleContent>
                    )}
                  </>
                </Collapsible>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }

  const teams = data as ImportPreviewTeam[];
  return (
    <div className="border rounded-lg max-h-[500px] overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            {showConfirmation && <TableHead className="w-10"></TableHead>}
            <TableHead className="w-10"></TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Líder</TableHead>
            <TableHead>Membros</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team, i) => {
            const hasDiffs = team.diffs && team.diffs.length > 0;
            const isExpanded = expandedRows.has(i);
            
            return (
              <Collapsible key={i} open={isExpanded} onOpenChange={() => hasDiffs && toggleRow(i)} asChild>
                <>
                  <TableRow 
                    className={cn(
                      team.error && 'bg-destructive/10',
                      team.action === 'create' && 'bg-emerald-50/50 dark:bg-emerald-950/20',
                      team.action === 'update' && 'bg-amber-50/50 dark:bg-amber-950/20',
                      team.action === 'no_change' && 'opacity-60'
                    )}
                  >
                    {showConfirmation && (
                      <TableCell>
                        {team.requiresConfirmation && (
                          <Checkbox
                            checked={team.confirmed}
                            onCheckedChange={(checked) => onConfirmChange?.(i, !!checked)}
                          />
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {hasDiffs && (
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{team.external_id}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{team.name}</span>
                        {team.nickname && (
                          <span className="ml-1 text-xs text-muted-foreground">({team.nickname})</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {team.teamType || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{team.leader || '-'}</TableCell>
                    <TableCell>
                      {team.membersCount && team.membersCount > 0 ? (
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" />
                          {team.membersCount}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={team.isActive ? 'default' : 'outline'}>
                        {team.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getActionBadge(team.action, team.error)}
                      {team.error && (
                        <p className="text-xs text-destructive mt-1">{team.error}</p>
                      )}
                    </TableCell>
                  </TableRow>
                  {hasDiffs && (
                    <CollapsibleContent asChild>
                      <tr>
                        <td colSpan={showConfirmation ? 10 : 9} className="p-0">
                          <div className="px-4 py-2 bg-muted/30">
                            {renderDiffs(team.diffs!)}
                          </div>
                        </td>
                      </tr>
                    </CollapsibleContent>
                  )}
                </>
              </Collapsible>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
