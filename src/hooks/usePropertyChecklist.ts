import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChecklistItem {
  id: string;
  property_id: string;
  stage: string;
  item_key: string;
  label: string;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  is_optional: boolean;
  order_index: number;
}

export const DEFAULT_CHECKLISTS: Record<string, { key: string; label: string; optional?: boolean }[]> = {
  documentos: [
    { key: 'caderneta_predial', label: 'Caderneta Predial' },
    { key: 'certidao_teor', label: 'Certidão de Teor / Registo Predial' },
    { key: 'licenca_utilizacao', label: 'Licença de Utilização' },
    { key: 'certificado_energetico', label: 'Certificado Energético' },
    { key: 'docs_identificacao', label: 'Documentos de identificação do proprietário' },
    { key: 'comprovativo_divida', label: 'Comprovativo de não dívida (Finanças + Condomínio)' },
    { key: 'planta_imovel', label: 'Planta do imóvel', optional: true },
  ],
  avaliacao: [
    { key: 'visita_avaliacao', label: 'Visita de avaliação realizada' },
    { key: 'relatorio_avaliacao', label: 'Relatório de avaliação preenchido (valor de mercado)' },
    { key: 'valor_acordado', label: 'Valor de venda acordado com o proprietário' },
    { key: 'condicoes_especiais', label: 'Condições especiais registadas' },
  ],
  publicacao: [
    { key: 'sessao_fotos', label: 'Sessão fotográfica realizada' },
    { key: 'fotos_editadas', label: 'Fotos selecionadas e editadas (mínimo 10)' },
    { key: 'video_tour', label: 'Vídeo / tour virtual', optional: true },
    { key: 'descricao_imovel', label: 'Descrição do imóvel redigida (PT + EN opcional)' },
    { key: 'pub_idealista', label: 'Publicado no Idealista' },
    { key: 'pub_imovirtual', label: 'Publicado no Imovirtual' },
    { key: 'pub_website', label: 'Publicado no Website da agência' },
    { key: 'partilha_redes', label: 'Partilhado nas redes sociais' },
  ],
  visitas: [
    { key: 'primeira_visita', label: 'Primeira visita realizada' },
    { key: 'feedback_visita', label: 'Feedback da visita registado' },
    { key: 'relatorio_proprietario', label: 'Relatório de visitas enviado ao proprietário' },
    { key: 'ajuste_preco', label: 'Ajuste de preço discutido (se >60 dias sem proposta)' },
  ],
  negociacao: [
    { key: 'proposta_recebida', label: 'Proposta recebida' },
    { key: 'proposta_apresentada', label: 'Proposta apresentada ao proprietário' },
    { key: 'contra_proposta', label: 'Contra-proposta (se aplicável)' },
    { key: 'acordo_valor', label: 'Acordo de valor alcançado' },
    { key: 'envio_gestao', label: 'Processo enviado para Gestão Processual' },
  ],
};

export function usePropertyChecklist(propertyId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['property-checklist', propertyId];

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('property_checklist_items')
        .select('*')
        .eq('property_id', propertyId)
        .order('order_index');
      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: !!user && !!propertyId,
  });

  const toggleItem = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase
        .from('property_checklist_items')
        .update({
          is_completed,
          completed_at: is_completed ? new Date().toISOString() : null,
          completed_by: is_completed ? user!.id : null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return { items, isLoading, toggleItem };
}
