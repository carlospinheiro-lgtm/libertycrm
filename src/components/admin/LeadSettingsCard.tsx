import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Settings2, Plus, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useLeadSettings, useUpdateLeadSettings, LeadMovePopupMode } from '@/hooks/useAgencySettings';

interface ColumnFieldConfig {
  columnId: string;
  columnName: string;
  fields: ColumnField[];
}

interface ColumnField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'currency';
  required: boolean;
}

interface LeadSettingsCardProps {
  agencyId: string | undefined;
  columns?: { id: string; title: string }[];
}

const defaultFields: ColumnField[] = [
  { id: 'nextActivityDate', label: 'Data da Próxima Atividade', type: 'date', required: true },
  { id: 'nextActivityDescription', label: 'Descrição da Atividade', type: 'textarea', required: false },
];

const availableFieldTypes = [
  { value: 'text', label: 'Texto' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'textarea', label: 'Texto Longo' },
  { value: 'currency', label: 'Valor Monetário' },
];

export function LeadSettingsCard({ agencyId, columns = [] }: LeadSettingsCardProps) {
  const { data: settings, isLoading } = useLeadSettings(agencyId);
  const updateSettings = useUpdateLeadSettings();

  const [popupMode, setPopupMode] = useState<LeadMovePopupMode>('always');
  const [criticalColumns, setCriticalColumns] = useState<string[]>([]);
  const [columnFields, setColumnFields] = useState<ColumnFieldConfig[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<ColumnField['type']>('text');
  const [selectedColumnForField, setSelectedColumnForField] = useState<string>('');

  useEffect(() => {
    if (settings) {
      setPopupMode(settings.popupMode || 'always');
      setCriticalColumns(settings.criticalColumns || []);
      setColumnFields((settings as any).columnFields || []);
    }
  }, [settings]);

  useEffect(() => {
    // Initialize column fields for all columns if not set
    if (columns.length > 0 && columnFields.length === 0) {
      setColumnFields(columns.map(col => ({
        columnId: col.id,
        columnName: col.title,
        fields: [...defaultFields],
      })));
    }
  }, [columns, columnFields.length]);

  const handleSave = async () => {
    if (!agencyId) {
      toast.error('Selecione uma agência');
      return;
    }

    try {
      await updateSettings.mutateAsync({
        agencyId,
        settingKey: 'lead_move_popup',
        settingValue: {
          popupMode,
          criticalColumns,
          columnFields,
        },
      });
      toast.success('Configurações guardadas');
    } catch (error) {
      toast.error('Erro ao guardar configurações');
    }
  };

  const toggleCriticalColumn = (columnId: string) => {
    setCriticalColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const addFieldToColumn = (columnId: string) => {
    if (!newFieldLabel.trim()) {
      toast.error('Insira um nome para o campo');
      return;
    }

    setColumnFields(prev => prev.map(config => {
      if (config.columnId === columnId) {
        return {
          ...config,
          fields: [
            ...config.fields,
            {
              id: `custom_${Date.now()}`,
              label: newFieldLabel,
              type: newFieldType,
              required: false,
            },
          ],
        };
      }
      return config;
    }));

    setNewFieldLabel('');
    setNewFieldType('text');
    setSelectedColumnForField('');
  };

  const removeFieldFromColumn = (columnId: string, fieldId: string) => {
    // Don't allow removing default fields
    if (fieldId === 'nextActivityDate' || fieldId === 'nextActivityDescription') {
      toast.error('Não é possível remover campos padrão');
      return;
    }

    setColumnFields(prev => prev.map(config => {
      if (config.columnId === columnId) {
        return {
          ...config,
          fields: config.fields.filter(f => f.id !== fieldId),
        };
      }
      return config;
    }));
  };

  const toggleFieldRequired = (columnId: string, fieldId: string) => {
    setColumnFields(prev => prev.map(config => {
      if (config.columnId === columnId) {
        return {
          ...config,
          fields: config.fields.map(f =>
            f.id === fieldId ? { ...f, required: !f.required } : f
          ),
        };
      }
      return config;
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">A carregar...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Configurações de Leads</CardTitle>
        </div>
        <CardDescription>
          Configure o comportamento ao mover leads entre colunas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Popup Mode */}
        <div className="space-y-3">
          <Label>Mostrar popup ao mover lead</Label>
          <Select value={popupMode} onValueChange={(v: LeadMovePopupMode) => setPopupMode(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="always">Sempre</SelectItem>
              <SelectItem value="critical">Apenas colunas críticas</SelectItem>
              <SelectItem value="never">Nunca</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Critical Columns Selection */}
        {popupMode === 'critical' && columns.length > 0 && (
          <div className="space-y-3">
            <Label>Colunas críticas (requerem popup)</Label>
            <div className="flex flex-wrap gap-2">
              {columns.map(col => (
                <Badge
                  key={col.id}
                  variant={criticalColumns.includes(col.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleCriticalColumn(col.id)}
                >
                  {col.title}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Column-specific Fields */}
        <div className="space-y-3">
          <Label>Campos por coluna</Label>
          <p className="text-sm text-muted-foreground">
            Configure os campos que aparecem no popup para cada coluna de destino
          </p>

          <Accordion type="single" collapsible className="w-full">
            {columnFields.map(config => (
              <AccordionItem key={config.columnId} value={config.columnId}>
                <AccordionTrigger className="text-sm">
                  {config.columnName}
                  <Badge variant="secondary" className="ml-2">
                    {config.fields.length} campos
                  </Badge>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  {/* Existing Fields */}
                  <div className="space-y-2">
                    {config.fields.map(field => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{field.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {availableFieldTypes.find(t => t.value === field.type)?.label}
                          </Badge>
                          {field.required && (
                            <Badge variant="secondary" className="text-xs">
                              Obrigatório
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={field.required}
                            onCheckedChange={() => toggleFieldRequired(config.columnId, field.id)}
                            disabled={field.id === 'nextActivityDate'}
                          />
                          {!['nextActivityDate', 'nextActivityDescription'].includes(field.id) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => removeFieldFromColumn(config.columnId, field.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Field */}
                  <div className="flex items-end gap-2 pt-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Nome do campo"
                        value={selectedColumnForField === config.columnId ? newFieldLabel : ''}
                        onChange={(e) => {
                          setSelectedColumnForField(config.columnId);
                          setNewFieldLabel(e.target.value);
                        }}
                        onFocus={() => setSelectedColumnForField(config.columnId)}
                      />
                    </div>
                    <Select
                      value={selectedColumnForField === config.columnId ? newFieldType : 'text'}
                      onValueChange={(v: ColumnField['type']) => {
                        setSelectedColumnForField(config.columnId);
                        setNewFieldType(v);
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFieldTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => addFieldToColumn(config.columnId)}
                      disabled={selectedColumnForField !== config.columnId || !newFieldLabel.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <Separator />

        <Button onClick={handleSave} disabled={updateSettings.isPending} className="w-full gap-2">
          <Save className="h-4 w-4" />
          {updateSettings.isPending ? 'A guardar...' : 'Guardar Configurações'}
        </Button>
      </CardContent>
    </Card>
  );
}
