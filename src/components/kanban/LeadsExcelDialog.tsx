import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload, FileSpreadsheet, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { parseFile } from '@/lib/excel-parser';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { Lead, Column } from './KanbanBoard';

interface LeadsExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: Lead[];
  columns: Column[];
  agencyId?: string;
  leadType: string;
}

type DuplicateAction = 'update' | 'ignore' | 'create';

interface ImportRow {
  client_name: string;
  email: string;
  phone: string;
  source: string;
  column_id: string;
  temperature: string;
  notes: string;
}

interface ClassifiedRow {
  row: ImportRow;
  index: number;
  status: 'new' | 'duplicate' | 'invalid';
  error?: string;
  existingLead?: Lead;
  matchField?: string;
  action?: DuplicateAction;
}

const COLUMN_MAP: Record<string, string> = {
  nome_cliente: 'client_name',
  nome: 'client_name',
  client_name: 'client_name',
  name: 'client_name',
  email: 'email',
  e_mail: 'email',
  telefone: 'phone',
  phone: 'phone',
  telemovel: 'phone',
  origem: 'source',
  source: 'source',
  coluna: 'column_id',
  column: 'column_id',
  fase: 'column_id',
  temperatura: 'temperature',
  temperature: 'temperature',
  notas: 'notes',
  notes: 'notes',
  observacoes: 'notes',
};

function normalizeKey(key: string): string {
  return key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '_');
}

function cleanPhone(phone: string | undefined | null): string {
  return (phone || '').replace(/\s+/g, '').trim();
}

export function LeadsExcelDialog({ open, onOpenChange, leads, columns, agencyId, leadType }: LeadsExcelDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('export');
  const [importing, setImporting] = useState(false);
  const [classifiedRows, setClassifiedRows] = useState<ClassifiedRow[]>([]);
  const [fileLoaded, setFileLoaded] = useState(false);
  const [fileName, setFileName] = useState('');
  const [committing, setCommitting] = useState(false);

  // Export
  const handleExport = () => {
    const exportData = leads.map((lead) => ({
      'Nome Cliente': lead.clientName,
      'Email': lead.email,
      'Telefone': lead.phone,
      'Origem': lead.source,
      'Coluna': columns.find(c => c.id === lead.columnId)?.title || lead.columnId,
      'Temperatura': lead.temperature || '',
      'Notas': lead.notes || '',
      'Data Entrada': lead.entryDate,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `leads_vendedores_${today}.xlsx`);
    toast.success('Ficheiro exportado com sucesso');
  };

  // Import - parse file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setFileName(file.name);

    try {
      const rawRows = await parseFile<Record<string, unknown>>(file);

      const parsed: ClassifiedRow[] = rawRows.map((raw, index) => {
        const normalized: Record<string, string> = {};
        Object.entries(raw).forEach(([key, value]) => {
          const nk = normalizeKey(key);
          const mapped = COLUMN_MAP[nk];
          if (mapped) normalized[mapped] = String(value || '').trim();
        });

        const row: ImportRow = {
          client_name: normalized.client_name || '',
          email: normalized.email || '',
          phone: normalized.phone || '',
          source: normalized.source || '',
          column_id: normalized.column_id || 'new',
          temperature: normalized.temperature || 'warm',
          notes: normalized.notes || '',
        };

        // Resolve column_id from title
        if (row.column_id && !columns.some(c => c.id === row.column_id)) {
          const match = columns.find(c => c.title.toLowerCase() === row.column_id.toLowerCase());
          row.column_id = match?.id || columns[0]?.id || 'new';
        }

        // Validate
        if (!row.client_name) {
          return { row, index, status: 'invalid' as const, error: 'Nome do cliente em falta' };
        }

        // Duplicate detection
        const phoneClean = cleanPhone(row.phone);
        let existingLead: Lead | undefined;
        let matchField: string | undefined;

        if (phoneClean) {
          existingLead = leads.find(l => cleanPhone(l.phone) === phoneClean);
          if (existingLead) matchField = 'telefone';
        }

        if (!existingLead && row.email) {
          existingLead = leads.find(l => l.email?.toLowerCase() === row.email.toLowerCase());
          if (existingLead) matchField = 'email';
        }

        if (!existingLead && row.client_name && phoneClean) {
          existingLead = leads.find(l =>
            l.clientName.toLowerCase() === row.client_name.toLowerCase() &&
            cleanPhone(l.phone) === phoneClean
          );
          if (existingLead) matchField = 'nome + telefone';
        }

        if (existingLead) {
          return { row, index, status: 'duplicate' as const, existingLead, matchField };
        }

        return { row, index, status: 'new' as const };
      });

      setClassifiedRows(parsed);
      setFileLoaded(true);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar ficheiro');
    } finally {
      setImporting(false);
    }
  };

  const stats = useMemo(() => {
    const total = classifiedRows.length;
    const valid = classifiedRows.filter(r => r.status !== 'invalid').length;
    const invalid = classifiedRows.filter(r => r.status === 'invalid').length;
    const newRows = classifiedRows.filter(r => r.status === 'new').length;
    const duplicates = classifiedRows.filter(r => r.status === 'duplicate').length;
    return { total, valid, invalid, newRows, duplicates };
  }, [classifiedRows]);

  const duplicateRows = classifiedRows.filter(r => r.status === 'duplicate');
  const allDuplicatesDecided = duplicateRows.every(r => r.action);
  const canConfirm = fileLoaded && stats.invalid === 0 && (duplicateRows.length === 0 || allDuplicatesDecided);

  const setDuplicateAction = (index: number, action: DuplicateAction) => {
    setClassifiedRows(prev => prev.map(r => r.index === index ? { ...r, action } : r));
  };

  const applyToAll = (action: DuplicateAction) => {
    setClassifiedRows(prev => prev.map(r => r.status === 'duplicate' ? { ...r, action } : r));
  };

  // Commit import
  const handleCommit = async () => {
    if (!agencyId || !user) return;
    setCommitting(true);

    const batchId = crypto.randomUUID();
    let created = 0, updated = 0, ignored = 0, errors = 0;

    try {
      for (const item of classifiedRows) {
        if (item.status === 'invalid') continue;

        const meta = {
          import_batch_id: batchId,
          imported_at: new Date().toISOString(),
          import_source: 'excel',
          import_file_name: fileName,
          imported_by_user_id: user.id,
        };

        if (item.status === 'new') {
          const { error } = await supabase.from('leads').insert({
            client_name: item.row.client_name,
            email: item.row.email || null,
            phone: item.row.phone || null,
            source: item.row.source || null,
            column_id: item.row.column_id,
            temperature: item.row.temperature || 'warm',
            notes: item.row.notes || null,
            agency_id: agencyId,
            user_id: user.id,
            lead_type: leadType,
            ...meta,
          });
          if (error) { errors++; } else { created++; }
        } else if (item.status === 'duplicate') {
          if (item.action === 'ignore') { ignored++; continue; }
          if (item.action === 'create') {
            const { error } = await supabase.from('leads').insert({
              client_name: item.row.client_name,
              email: item.row.email || null,
              phone: item.row.phone || null,
              source: item.row.source || null,
              column_id: item.row.column_id,
              temperature: item.row.temperature || 'warm',
              notes: item.row.notes || null,
              agency_id: agencyId,
              user_id: user.id,
              lead_type: leadType,
              ...meta,
            });
            if (error) { errors++; } else { created++; }
          } else if (item.action === 'update' && item.existingLead) {
            const { error } = await supabase.from('leads').update({
              client_name: item.row.client_name,
              email: item.row.email || null,
              phone: item.row.phone || null,
              source: item.row.source || null,
              temperature: item.row.temperature || undefined,
              notes: item.row.notes || null,
              ...meta,
            }).eq('id', item.existingLead.id);
            if (error) { errors++; } else { updated++; }
          }
        }
      }

      // Log to import_jobs
      await supabase.from('import_jobs').insert({
        agency_id: agencyId,
        created_by_user_id: user.id,
        type: 'leads',
        file_name: fileName,
        status: 'completed',
        completed_at: new Date().toISOString(),
        summary_json: { created, updated, ignored, errors, total: classifiedRows.length },
      });

      queryClient.invalidateQueries({ queryKey: ['leads', leadType] });
      toast.success(`Importação concluída: ${created} criadas, ${updated} atualizadas, ${ignored} ignoradas`);
      
      // Reset
      setClassifiedRows([]);
      setFileLoaded(false);
      setFileName('');
      onOpenChange(false);
    } catch (err: any) {
      toast.error('Erro na importação: ' + err.message);
    } finally {
      setCommitting(false);
    }
  };

  const handleReset = () => {
    setClassifiedRows([]);
    setFileLoaded(false);
    setFileName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel — Leads Vendedores
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Exportar</TabsTrigger>
            <TabsTrigger value="import">Importar</TabsTrigger>
          </TabsList>

          {/* EXPORT TAB */}
          <TabsContent value="export" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Descarrega todas as leads vendedores num ficheiro Excel.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{leads.length} leads</Badge>
              <span>serão exportadas</span>
            </div>
            <Button onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Descarregar Excel
            </Button>
          </TabsContent>

          {/* IMPORT TAB */}
          <TabsContent value="import" className="space-y-4">
            {!fileLoaded ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Carrega um ficheiro .xlsx ou .csv com leads para importar.
                </p>
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  disabled={importing}
                />
                {importing && <p className="text-sm text-muted-foreground">A processar ficheiro...</p>}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Stats */}
                <div className="flex flex-wrap gap-3">
                  <Badge variant="outline">{stats.total} total</Badge>
                  <Badge className="bg-green-100 text-green-800">{stats.newRows} novas</Badge>
                  <Badge className="bg-yellow-100 text-yellow-800">{stats.duplicates} duplicadas</Badge>
                  {stats.invalid > 0 && (
                    <Badge className="bg-red-100 text-red-800">{stats.invalid} inválidas</Badge>
                  )}
                </div>

                {/* Invalid rows */}
                {stats.invalid > 0 && (
                  <div className="border border-destructive/50 rounded-md p-3 space-y-1">
                    <p className="text-sm font-medium text-destructive flex items-center gap-1">
                      <XCircle className="h-4 w-4" /> Linhas inválidas
                    </p>
                    {classifiedRows.filter(r => r.status === 'invalid').map(r => (
                      <p key={r.index} className="text-xs text-muted-foreground">
                        Linha {r.index + 2}: {r.error}
                      </p>
                    ))}
                  </div>
                )}

                {/* Duplicates */}
                {duplicateRows.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        Duplicados encontrados ({duplicateRows.length})
                      </p>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => applyToAll('update')}>
                          Atualizar todos
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => applyToAll('ignore')}>
                          Ignorar todos
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => applyToAll('create')}>
                          Criar todos
                        </Button>
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Linha</TableHead>
                            <TableHead>Nome (Excel)</TableHead>
                            <TableHead>Nome (Atual)</TableHead>
                            <TableHead>Match</TableHead>
                            <TableHead>Ação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {duplicateRows.map((item) => (
                            <TableRow key={item.index}>
                              <TableCell>{item.index + 2}</TableCell>
                              <TableCell className="text-xs">{item.row.client_name}</TableCell>
                              <TableCell className="text-xs">{item.existingLead?.clientName}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{item.matchField}</Badge>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={item.action || ''}
                                  onValueChange={(v) => setDuplicateAction(item.index, v as DuplicateAction)}
                                >
                                  <SelectTrigger className="w-[130px] h-8">
                                    <SelectValue placeholder="Decidir..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="update">Atualizar</SelectItem>
                                    <SelectItem value="ignore">Ignorar</SelectItem>
                                    <SelectItem value="create">Criar Novo</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* New leads preview */}
                {stats.newRows > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Novas leads ({stats.newRows})
                    </p>
                    <div className="max-h-40 overflow-y-auto border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Origem</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {classifiedRows.filter(r => r.status === 'new').map(r => (
                            <TableRow key={r.index}>
                              <TableCell className="text-xs">{r.row.client_name}</TableCell>
                              <TableCell className="text-xs">{r.row.email}</TableCell>
                              <TableCell className="text-xs">{r.row.phone}</TableCell>
                              <TableCell className="text-xs">{r.row.source}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" onClick={handleReset}>
                    Novo Ficheiro
                  </Button>
                  {canConfirm && (
                    <Button onClick={handleCommit} disabled={committing} className="gap-2">
                      <Upload className="h-4 w-4" />
                      {committing ? 'A importar...' : 'Confirmar Importação'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
