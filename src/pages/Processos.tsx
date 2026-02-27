import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, FileText, CreditCard, Home, Calendar } from 'lucide-react';

const processColumns = [
  { id: 'accepted', title: 'Proposta Aceite', count: 3 },
  { id: 'docs', title: 'Documentação', count: 2 },
  { id: 'analysis', title: 'Análise Processual', count: 4 },
  { id: 'credit-pre', title: 'Crédito Pré-Aprovado', count: 2 },
  { id: 'credit-final', title: 'Aprovação Final', count: 1 },
  { id: 'cpcv', title: 'CPCV Assinado', count: 2 },
  { id: 'deed-scheduled', title: 'Escritura Marcada', count: 1 },
  { id: 'completed', title: 'Escritura Realizada', count: 5 },
];

const sampleProcesses = [
  {
    id: 'PROC-2024-089',
    type: 'credit_intermediation',
    buyer: 'Manuel Silva',
    seller: 'Paulo Teixeira',
    property: 'T3 Braga Centro',
    agency: 'Braga',
    buyerAgent: 'Pedro Costa',
    sellerAgent: 'Sofia Almeida',
    cpcvDate: '15/12/2024',
    status: 'cpcv',
  },
  {
    id: 'PROC-2024-088',
    type: 'with_credit',
    buyer: 'Bruno Pereira',
    seller: 'Helena Pinto',
    property: 'Moradia V4 Barcelos',
    agency: 'Barcelos',
    buyerAgent: 'Ana Lopes',
    sellerAgent: 'Ricardo Santos',
    cpcvDate: '20/12/2024',
    status: 'credit-pre',
  },
  {
    id: 'PROC-2024-087',
    type: 'no_credit',
    buyer: 'Rita Sousa',
    seller: 'Carla Nunes',
    property: 'T2 Gualtar',
    agency: 'Braga',
    buyerAgent: 'Pedro Costa',
    sellerAgent: 'Pedro Costa',
    cpcvDate: '10/12/2024',
    status: 'deed-scheduled',
  },
];

const typeLabels = {
  no_credit: { label: 'Sem Crédito', color: 'bg-muted text-foreground' },
  with_credit: { label: 'Com Crédito', color: 'bg-info/10 text-info' },
  credit_intermediation: { label: 'Intermediação Crédito', color: 'bg-warning/10 text-warning' },
};

export default function Processos() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading">CRM Processual & Crédito</h1>
            <p className="text-muted-foreground">
              Acompanhamento de processos de compra e venda
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Processo
          </Button>
        </div>

        {/* Process Pipeline Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {processColumns.map((col) => (
            <Card key={col.id} className="text-center">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-primary">{col.count}</p>
                <p className="text-xs text-muted-foreground truncate">{col.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active Processes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading">Processos em Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sampleProcesses.map((process) => (
                <div
                  key={process.id}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{process.id}</p>
                      <Badge
                        className={typeLabels[process.type as keyof typeof typeLabels].color}
                      >
                        {typeLabels[process.type as keyof typeof typeLabels].label}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Comprador</p>
                      <p className="font-medium">{process.buyer}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Vendedor</p>
                      <p className="font-medium">{process.seller}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Imóvel</p>
                      <p className="font-medium flex items-center gap-1">
                        <Home className="h-3 w-3" />
                        {process.property}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">CPCV</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {process.cpcvDate}
                      </p>
                    </div>
                  </div>

                  <Button variant="outline" size="sm">
                    Ver Detalhes
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
