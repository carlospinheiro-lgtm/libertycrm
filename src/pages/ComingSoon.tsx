import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description?: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8 space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Construction className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold font-heading">{title}</h1>
            <p className="text-muted-foreground">
              {description || 'Este módulo está em desenvolvimento e estará disponível em breve.'}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
