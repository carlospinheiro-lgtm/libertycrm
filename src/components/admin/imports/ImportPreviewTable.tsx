import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCcw, XCircle } from 'lucide-react';
import { ImportPreviewUser, ImportPreviewTeam } from '@/types/import';

interface ImportPreviewTableProps {
  type: 'users' | 'teams';
  data: ImportPreviewUser[] | ImportPreviewTeam[];
}

export function ImportPreviewTable({ type, data }: ImportPreviewTableProps) {
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
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Criar
          </Badge>
        );
      case 'update':
        return (
          <Badge variant="secondary" className="gap-1">
            <RefreshCcw className="h-3 w-3" />
            Atualizar
          </Badge>
        );
      case 'deactivate':
        return (
          <Badge variant="warning" className="gap-1">
            <XCircle className="h-3 w-3" />
            Desativar
          </Badge>
        );
      default:
        return <Badge variant="outline">Ignorar</Badge>;
    }
  };

  if (type === 'users') {
    const users = data as ImportPreviewUser[];
    return (
      <div className="border rounded-lg max-h-96 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Equipa</TableHead>
              <TableHead>Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user, i) => (
              <TableRow key={i} className={user.error ? 'bg-destructive/10' : undefined}>
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
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  const teams = data as ImportPreviewTeam[];
  return (
    <div className="border rounded-lg max-h-96 overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 bg-background">
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Líder</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team, i) => (
            <TableRow key={i} className={team.error ? 'bg-destructive/10' : undefined}>
              <TableCell className="font-mono text-xs">{team.external_id}</TableCell>
              <TableCell className="font-medium">{team.name}</TableCell>
              <TableCell className="text-muted-foreground">{team.leader || '-'}</TableCell>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
