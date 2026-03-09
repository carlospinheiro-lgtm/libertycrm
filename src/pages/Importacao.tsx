import { useState, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ─── helpers ──────────────────────────────────────────────────────────────────

function normalizeKey(key: string): string {
  return key
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');
}

function parseXlsx(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'binary', raw: false });
        const ws = wb.Sheets[wb.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' }));
      } catch {
        reject(new Error('Erro ao processar ficheiro'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler ficheiro'));
    reader.readAsBinaryString(file);
  });
}

function get(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const val = row[normalizeKey(k)];
    if (val) return val.trim();
  }
  return '';
}

function parseDate(raw: string): string | null {
  if (!raw) return null;
  const cleaned = raw.trim();
  if (!cleaned) return null;
  // Try ISO-like first
  const iso = new Date(cleaned);
  if (!isNaN(iso.getTime())) return iso.toISOString().split('T')[0];
  // dd/mm/yyyy
  const parts = cleaned.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const dt = new Date(Number(y), Number(m) - 1, Number(d));
    if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
  }
  return null;
}

function parseNum(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[€\s.]/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

// ─── UploadZone ───────────────────────────────────────────────────────────────

interface UploadZoneProps {
  onFile: (file: File) => void;
  file: File | null;
  onClear: () => void;
  accept?: string;
}

function UploadZone({ onFile, file, onClear, accept = '.xlsx,.xls,.csv' }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
        <FileSpreadsheet className="h-5 w-5 text-primary flex-shrink-0" />
        <span className="text-sm font-medium truncate flex-1">{file.name}</span>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors',
        dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
      )}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <Upload className="h-8 w-8 text-muted-foreground" />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">Arraste o ficheiro ou clique para selecionar</p>
        <p className="text-xs text-muted-foreground mt-1">XLSX, XLS ou CSV</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
    </div>
  );
}

// ─── PreviewTable ──────────────────────────────────────────────────────────────

function PreviewTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) return null;
  const cols = Object.keys(rows[0]);
  const preview = rows.slice(0, 5);

  return (
    <div className="rounded-lg border overflow-auto max-h-64">
      <Table>
        <TableHeader>
          <TableRow>
            {cols.map((c) => (
              <TableHead key={c} className="whitespace-nowrap text-xs py-2 px-3">{c}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {preview.map((row, i) => (
            <TableRow key={i}>
              {cols.map((c) => (
                <TableCell key={c} className="text-xs py-1.5 px-3 whitespace-nowrap max-w-40 truncate">
                  {String(row[c] ?? '')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── STATUS badge ─────────────────────────────────────────────────────────────

function StatusBadge({ ok, count, label }: { ok?: boolean; count?: number; label?: string }) {
  if (ok === undefined && count === undefined) return null;
  return (
    <Badge variant={ok ? 'default' : 'secondary'} className="gap-1">
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      {label ?? (count !== undefined ? `${count} registos` : '')}
    </Badge>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: PROCESSOS
// ═══════════════════════════════════════════════════════════════════════════════

const LIBERTY_AGENCIES = ['liberty', 'liberty ii'];

function isLiberty(name: string) {
  return LIBERTY_AGENCIES.includes(name.toLowerCase().trim());
}

function mapDealStatus(raw: string): number {
  const n = raw.toLowerCase().trim();
  if (n === 'receb. em falta' || n === 'recebimento em falta') return 1;
  if (n === 'concluído' || n === 'concluido') return 3;
  return 0;
}

interface ProcessRow {
  pv_number: string;
  maxwork_id: string;
  address: string;
  municipality: string;
  parish: string;
  sale_value: number | null;
  cpcv_date: string | null;
  deed_date: string | null;
  deal_status: number;
  // Lado Angariação
  agent_angariation: string;
  honorarios_angariacao: number | null;
  agency_buyer: string;
  // Lado Venda
  agent_buyer: string;
  honorarios_venda: number | null;
  agency_angariation: string;
  is_internal: boolean;
}

function parseProcessRows(rawRows: Record<string, unknown>[]): ProcessRow[] {
  return rawRows.map((rawRow) => {
    const row: Record<string, string> = {};
    Object.entries(rawRow).forEach(([k, v]) => { row[normalizeKey(k)] = String(v ?? '').trim(); });

    const agAng = get(row, 'Agência Angariadora', 'Agencia Angariadora', 'agency_angariation');
    const agBuy = get(row, 'Agência Comprador', 'Agencia Comprador', 'agency_buyer');
    const internal = isLiberty(agAng) && isLiberty(agBuy);

    return {
      pv_number: get(row, 'Título', 'Titulo', 'pv_number', 'titulo'),
      maxwork_id: get(row, 'Imóvel', 'Imovel', 'maxwork_id', 'imovel'),
      address: get(row, 'Morada Imóvel', 'Morada Imovel', 'address', 'morada_imovel', 'morada'),
      municipality: get(row, 'Concelho', 'municipality', 'concelho'),
      parish: get(row, 'Freguesia', 'parish', 'freguesia'),
      sale_value: parseNum(get(row, 'Preço Venda', 'Preco Venda', 'sale_value', 'preco_venda')),
      cpcv_date: parseDate(get(row, 'Data CPCV', 'cpcv_date', 'data_cpcv')),
      deed_date: parseDate(get(row, 'Data Escritura', 'deed_date', 'data_escritura')),
      deal_status: mapDealStatus(get(row, 'Estado', 'estado', 'status')),
      agent_angariation: get(row, 'Agente Angariador', 'agent_angariation', 'agente_angariador'),
      honorarios_angariacao: parseNum(get(row, 'Honorários Pendentes Angariação', 'Honorarios Pendentes Angariacao', 'honorarios_angariacao', 'honorarios_pendentes_angariacao')),
      agency_buyer: agBuy,
      agent_buyer: get(row, 'Agente Comprador', 'agent_buyer', 'agente_comprador'),
      honorarios_venda: parseNum(get(row, 'Honorários Pendentes Comprador', 'Honorarios Pendentes Comprador', 'honorarios_venda', 'honorarios_pendentes_comprador')),
      agency_angariation: agAng,
      is_internal: internal,
    };
  });
}

type DuplicateAction = 'update' | 'skip' | null;

function TabProcessos({ agencyId }: { agencyId: string }) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [parsed, setParsed] = useState<ProcessRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duplicateAction, setDuplicateAction] = useState<DuplicateAction>(null);
  const [showDupDialog, setShowDupDialog] = useState(false);
  const [dupCount, setDupCount] = useState(0);
  const [importLimit, setImportLimit] = useState<number | null>(null);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setLoading(true);
    try {
      const rows = await parseXlsx(f);
      setRawRows(rows);
      setParsed(parseProcessRows(rows));
    } catch {
      toast({ title: 'Erro ao processar ficheiro', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const doImport = useCallback(async (action: DuplicateAction, limit?: number | null) => {
    setImporting(true);
    setProgress(0);
    let imported = 0;
    
    const rowsToImport = limit ? parsed.slice(0, limit) : parsed;
    const total = rowsToImport.length * 2; // 2 registos por linha

    // Verificar duplicados existentes
    const pvNumbers = [...new Set(rowsToImport.map(p => p.pv_number).filter(Boolean))];
    const { data: existingDeals } = await supabase
      .from('deals')
      .select('pv_number, deal_type, id')
      .eq('agency_id', agencyId)
      .in('pv_number', pvNumbers);

    const existingMap = new Map<string, string>();
    existingDeals?.forEach(d => {
      existingMap.set(`${d.pv_number}|${d.deal_type}`, d.id);
    });

    for (const row of rowsToImport) {
      const baseFields = {
        agency_id: agencyId,
        pv_number: row.pv_number || null,
        maxwork_id: row.maxwork_id || null,
        address: row.address || null,
        municipality: row.municipality || null,
        parish: row.parish || null,
        sale_value: row.sale_value,
        cpcv_date: row.cpcv_date,
        deed_date: row.deed_date,
        deal_status: row.deal_status,
        partner_agency: null as string | null,
      };

      const sides = [
        {
          deal_type: 'AngariaçãoVenda',
          consultant_name: row.agent_angariation || null,
          commission_store: row.honorarios_angariacao,
          partner_agency: row.is_internal ? null : row.agency_buyer || null,
        },
        {
          deal_type: 'Venda',
          consultant_name: row.agent_buyer || null,
          commission_store: row.honorarios_venda,
          partner_agency: row.is_internal ? null : row.agency_angariation || null,
        },
      ];

      for (const side of sides) {
        const key = `${row.pv_number}|${side.deal_type}`;
        const existingId = existingMap.get(key);

        if (existingId) {
          if (action === 'update') {
            await supabase.from('deals').update({ ...baseFields, ...side }).eq('id', existingId);
          }
          // skip: do nothing
        } else {
          await supabase.from('deals').insert({ ...baseFields, ...side });
        }

        imported++;
        setProgress(Math.round((imported / total) * 100));
      }
    }

    setImporting(false);
    toast({ title: `✅ ${rowsToImport.length} processos importados (${total} registos)` });
  }, [agencyId, parsed, toast]);

  const handleImport = useCallback(async (limit?: number) => {
    if (!parsed.length || !agencyId) return;

    setImportLimit(limit || null);
    const rowsToImport = limit ? parsed.slice(0, limit) : parsed;

    // Check for duplicates first
    const pvNumbers = [...new Set(rowsToImport.map(p => p.pv_number).filter(Boolean))];
    const { data: existing } = await supabase
      .from('deals')
      .select('pv_number, deal_type')
      .eq('agency_id', agencyId)
      .in('pv_number', pvNumbers);

    const existingKeys = new Set(existing?.map(d => `${d.pv_number}|${d.deal_type}`) ?? []);
    const dups = rowsToImport.reduce((count, row) => {
      return count
        + (existingKeys.has(`${row.pv_number}|AngariaçãoVenda`) ? 1 : 0)
        + (existingKeys.has(`${row.pv_number}|Venda`) ? 1 : 0);
    }, 0);

    if (dups > 0) {
      setDupCount(dups);
      setShowDupDialog(true);
    } else {
      await doImport(null, limit);
    }
  }, [parsed, agencyId, doImport]);

  const handleDupDecision = useCallback(async (action: DuplicateAction) => {
    setShowDupDialog(false);
    await doImport(action, importLimit);
  }, [doImport, importLimit]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Importar SaleProcesses.xls</CardTitle>
          <CardDescription>
            Cada linha gera 2 registos no CRM Processual: um para Angariação e outro para Venda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UploadZone
            file={file}
            onFile={handleFile}
            onClear={() => { setFile(null); setRawRows([]); setParsed([]); }}
          />

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> A processar ficheiro…
            </div>
          )}

          {rawRows.length > 0 && !loading && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{rawRows.length} linhas encontradas</span>
                <StatusBadge count={parsed.length * 2} label={`${parsed.length * 2} registos a criar`} />
              </div>
              <p className="text-xs font-medium text-foreground">Pré-visualização (5 primeiras linhas)</p>
              <PreviewTable rows={rawRows} />
            </div>
          )}

          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>A importar…</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {parsed.length > 0 && !importing && (
            <Button className="w-full" onClick={handleImport} disabled={importing}>
              <Upload className="h-4 w-4 mr-2" />
              Importar {parsed.length} processos ({parsed.length * 2} registos)
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Column mapping reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Mapeamento de colunas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs">
            {[
              ['Título', 'pv_number'],
              ['Imóvel', 'maxwork_id'],
              ['Morada Imóvel', 'address'],
              ['Concelho', 'municipality'],
              ['Freguesia', 'parish'],
              ['Preço Venda', 'sale_value'],
              ['Data CPCV', 'cpcv_date'],
              ['Data Escritura', 'deed_date'],
              ['Estado', 'deal_status (0/1/3)'],
              ['Agente Angariador', 'consultant_name (Angariação)'],
              ['Agente Comprador', 'consultant_name (Venda)'],
              ['Honorários Pendentes Angariação', 'commission_store (Angariação)'],
              ['Honorários Pendentes Comprador', 'commission_store (Venda)'],
            ].map(([from, to]) => (
              <div key={from} className="flex gap-2 items-baseline">
                <span className="text-muted-foreground truncate">{from}</span>
                <span className="text-foreground/40 flex-shrink-0">→</span>
                <span className="font-mono text-primary truncate">{to}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDupDialog} onOpenChange={setShowDupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicados encontrados</AlertDialogTitle>
            <AlertDialogDescription>
              Foram encontrados <strong>{dupCount} registos duplicados</strong> (mesmo PV + tipo de negócio).
              O que pretende fazer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDupDialog(false)}>Cancelar</AlertDialogCancel>
            <Button variant="outline" onClick={() => handleDupDecision('skip')}>
              Ignorar duplicados
            </Button>
            <AlertDialogAction onClick={() => handleDupDecision('update')}>
              Atualizar existentes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: CONSULTORES
// ═══════════════════════════════════════════════════════════════════════════════

interface ConsultorImportRow {
  name: string;
  nif: string;
  entry_date: string | null;
  tier: string | null;
  commission_system: string | null;
  has_company: boolean;
  commission_pct: number | null;
  accumulated_12m: number | null;
}

function parseConsultorRows(rawRows: Record<string, unknown>[]): ConsultorImportRow[] {
  return rawRows.map((rawRow) => {
    const row: Record<string, string> = {};
    Object.entries(rawRow).forEach(([k, v]) => { row[normalizeKey(k)] = String(v ?? '').trim(); });

    const empresaRaw = get(row, 'Empresa', 'empresa', 'has_company');
    const hasCompany = ['sim', 'yes', 'true', '1', 's'].includes(empresaRaw.toLowerCase());
    
    const tier = get(row, 'Escalão', 'escalo', 'tier') || null;
    const validTier = tier && ['A', 'B', 'C'].includes(tier.toUpperCase()) ? tier.toUpperCase() : null;
    
    const sys = get(row, 'Tipo de Sistema', 'tipo_de_sistema', 'commission_system') || null;
    const validSys = sys && ['Alternativo', 'Fixo'].includes(sys) ? sys : 
                     sys === 'Alternativo' || sys?.toLowerCase() === 'alternativo' ? 'Alternativo' : 
                     sys === 'Fixo' || sys?.toLowerCase() === 'fixo' ? 'Fixo' : null;

    return {
      name: get(row, 'Utilizador', 'utilizador', 'name', 'nome'),
      nif: get(row, 'Agente NIF', 'agente_nif', 'nif'),
      entry_date: parseDate(get(row, 'Data de Adesão', 'data_de_adesao', 'data_adesao', 'entry_date')),
      tier: validTier,
      commission_system: validSys,
      has_company: hasCompany,
      commission_pct: parseNum(get(row, 'Honorários %', 'honorarios_%', 'honorarios', 'commission_pct')),
      accumulated_12m: parseNum(get(row, 'Faturação Último Ano', 'faturacao_ultimo_ano', 'accumulated_12m', 'faturacao')),
    };
  }).filter(r => r.name);
}

function TabConsultores({ agencyId }: { agencyId: string }) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [parsed, setParsed] = useState<ConsultorImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setLoading(true);
    try {
      const rows = await parseXlsx(f);
      setRawRows(rows);
      setParsed(parseConsultorRows(rows));
    } catch {
      toast({ title: 'Erro ao processar ficheiro', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleImport = useCallback(async () => {
    if (!parsed.length || !agencyId) return;
    setImporting(true);
    setProgress(0);

    // Buscar consultores existentes por NIF
    const nifs = parsed.map(r => r.nif).filter(Boolean);
    const { data: existing } = await supabase
      .from('consultants')
      .select('id, nif')
      .eq('agency_id', agencyId)
      .in('nif', nifs);

    const nifToId = new Map(existing?.map(e => [e.nif, e.id]) ?? []);
    let created = 0, updated = 0;

    for (let i = 0; i < parsed.length; i++) {
      const row = parsed[i];
      const existingId = row.nif ? nifToId.get(row.nif) : undefined;
      const payload = {
        name: row.name,
        nif: row.nif || null,
        entry_date: row.entry_date,
        tier: row.tier,
        commission_system: row.commission_system,
        has_company: row.has_company,
        commission_pct: row.commission_pct,
        accumulated_12m: row.accumulated_12m ?? 0,
        agency_id: agencyId,
        is_active: true,
      };

      if (existingId) {
        await supabase.from('consultants').update(payload).eq('id', existingId);
        updated++;
      } else {
        await supabase.from('consultants').insert(payload);
        created++;
      }

      setProgress(Math.round(((i + 1) / parsed.length) * 100));
    }

    setImporting(false);
    toast({ title: `✅ ${created} consultores criados, ${updated} atualizados` });
  }, [agencyId, parsed, toast]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Importar CommissionSystem.xlsx</CardTitle>
          <CardDescription>
            Consultores são identificados por NIF. Se já existir, o registo é atualizado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UploadZone
            file={file}
            onFile={handleFile}
            onClear={() => { setFile(null); setRawRows([]); setParsed([]); }}
          />

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> A processar ficheiro…
            </div>
          )}

          {rawRows.length > 0 && !loading && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{rawRows.length} linhas encontradas</span>
                <StatusBadge count={parsed.length} label={`${parsed.length} consultores válidos`} />
              </div>
              <p className="text-xs font-medium text-foreground">Pré-visualização (5 primeiras linhas)</p>
              <PreviewTable rows={rawRows} />
            </div>
          )}

          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>A importar…</span><span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {parsed.length > 0 && !importing && (
            <Button className="w-full" onClick={handleImport}>
              <Upload className="h-4 w-4 mr-2" />
              Importar {parsed.length} consultores
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Mapeamento de colunas</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs">
            {[
              ['Utilizador', 'name'],
              ['Agente NIF', 'nif'],
              ['Data de Adesão', 'entry_date'],
              ['Escalão', 'tier (A/B/C)'],
              ['Tipo de Sistema', 'commission_system'],
              ['Empresa (Sim/Não)', 'has_company'],
              ['Honorários %', 'commission_pct'],
              ['Faturação Último Ano', 'accumulated_12m'],
            ].map(([from, to]) => (
              <div key={from} className="flex gap-2 items-baseline">
                <span className="text-muted-foreground truncate">{from}</span>
                <span className="text-foreground/40 flex-shrink-0">→</span>
                <span className="font-mono text-primary truncate">{to}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: EQUIPAS
// ═══════════════════════════════════════════════════════════════════════════════

interface TeamImportRow {
  nif: string;
  nome_equipa: string;
  is_leader: boolean;
  nome_proprio: string;
}

function parseTeamRows(rawRows: Record<string, unknown>[]): TeamImportRow[] {
  return rawRows.map((rawRow) => {
    const row: Record<string, string> = {};
    Object.entries(rawRow).forEach(([k, v]) => { row[normalizeKey(k)] = String(v ?? '').trim(); });

    const leaderRaw = get(row, 'Chefe de Equipa?', 'chefe_de_equipa', 'chefe_de_equipa?', 'is_leader', 'lider', 'chefe');
    const isLeader = ['sim', 'yes', 'true', '1', 's'].includes(leaderRaw.toLowerCase());

    return {
      nif: get(row, 'NIF', 'nif', 'agente_nif'),
      nome_equipa: get(row, 'Nome da Equipa', 'nome_da_equipa', 'equipa', 'team', 'nome_equipa'),
      is_leader: isLeader,
      nome_proprio: get(row, 'Utilizador', 'utilizador', 'nome', 'name'),
    };
  }).filter(r => r.nif);
}

function TabEquipas({ agencyId }: { agencyId: string }) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [parsed, setParsed] = useState<TeamImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setLoading(true);
    try {
      const rows = await parseXlsx(f);
      setRawRows(rows);
      setParsed(parseTeamRows(rows));
    } catch {
      toast({ title: 'Erro ao processar ficheiro', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleImport = useCallback(async () => {
    if (!parsed.length || !agencyId) return;
    setImporting(true);
    setProgress(0);

    // Build leader map: teamName → leader name
    const leaderMap = new Map<string, string>();
    parsed.forEach(r => {
      if (r.is_leader && r.nome_equipa) {
        leaderMap.set(r.nome_equipa.toLowerCase(), r.nome_proprio);
      }
    });

    // Get consultant ids by NIF
    const nifs = parsed.map(r => r.nif).filter(Boolean);
    const { data: consultants } = await supabase
      .from('consultants')
      .select('id, nif')
      .eq('agency_id', agencyId)
      .in('nif', nifs);

    const nifToId = new Map(consultants?.map(c => [c.nif, c.id]) ?? []);
    let updated = 0;

    for (let i = 0; i < parsed.length; i++) {
      const row = parsed[i];
      const consultantId = row.nif ? nifToId.get(row.nif) : undefined;
      if (!consultantId) { setProgress(Math.round(((i + 1) / parsed.length) * 100)); continue; }

      const team_leader = row.is_leader
        ? row.nome_proprio
        : (leaderMap.get(row.nome_equipa.toLowerCase()) ?? null);

      await supabase
        .from('consultants')
        .update({ team: row.nome_equipa || null, team_leader })
        .eq('id', consultantId);

      updated++;
      setProgress(Math.round(((i + 1) / parsed.length) * 100));
    }

    setImporting(false);
    toast({ title: `✅ Equipas atualizadas em ${updated} consultores` });
  }, [agencyId, parsed, toast]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Importar Teams.xlsx</CardTitle>
          <CardDescription>
            Atualiza os campos Equipa e Líder de Equipa nos consultores, identificados por NIF.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UploadZone
            file={file}
            onFile={handleFile}
            onClear={() => { setFile(null); setRawRows([]); setParsed([]); }}
          />

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> A processar ficheiro…
            </div>
          )}

          {rawRows.length > 0 && !loading && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{rawRows.length} linhas encontradas</span>
                <StatusBadge count={parsed.length} label={`${parsed.length} registos válidos`} />
              </div>
              <p className="text-xs font-medium text-foreground">Pré-visualização (5 primeiras linhas)</p>
              <PreviewTable rows={rawRows} />
            </div>
          )}

          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>A importar…</span><span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {parsed.length > 0 && !importing && (
            <Button className="w-full" onClick={handleImport}>
              <Upload className="h-4 w-4 mr-2" />
              Importar equipas ({parsed.length} registos)
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Mapeamento de colunas</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs">
            {[
              ['NIF', 'identifica o consultor'],
              ['Nome da Equipa', 'team'],
              ['Chefe de Equipa? (Sim/Não)', 'team_leader (lógica automática)'],
              ['Utilizador', 'team_leader (quando não é chefe)'],
            ].map(([from, to]) => (
              <div key={from} className="flex gap-2 items-baseline">
                <span className="text-muted-foreground truncate">{from}</span>
                <span className="text-foreground/40 flex-shrink-0">→</span>
                <span className="font-mono text-primary truncate">{to}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function Importacao() {
  const { currentUser } = useAuth();
  const agencyId = currentUser?.agencyId ?? '';

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading text-foreground">Importação Maxwork</h1>
            <p className="text-sm text-muted-foreground">Importa dados dos ficheiros de exportação do Maxwork</p>
          </div>
        </div>

        {!agencyId ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              Sem agência associada. Por favor contacte o administrador.
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="processos" className="space-y-6">
            <TabsList className="h-10">
              <TabsTrigger value="processos">Processos</TabsTrigger>
              <TabsTrigger value="consultores">Consultores</TabsTrigger>
              <TabsTrigger value="equipas">Equipas</TabsTrigger>
            </TabsList>

            <TabsContent value="processos">
              <TabProcessos agencyId={agencyId} />
            </TabsContent>
            <TabsContent value="consultores">
              <TabConsultores agencyId={agencyId} />
            </TabsContent>
            <TabsContent value="equipas">
              <TabEquipas agencyId={agencyId} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
