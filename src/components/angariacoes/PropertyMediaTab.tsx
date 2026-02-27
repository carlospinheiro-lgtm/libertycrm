import { DbPropertyPortal } from '@/hooks/usePropertyPortals';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, Image, Video } from 'lucide-react';
import { DbProperty } from '@/hooks/useProperties';

interface PropertyMediaTabProps {
  property: DbProperty;
  portals: DbPropertyPortal[];
  onTogglePortal: (id: string, published: boolean) => void;
}

export function PropertyMediaTab({ property, portals, onTogglePortal }: PropertyMediaTabProps) {
  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Image className="h-4 w-4" /> Media
        </h3>
        <div className="space-y-2 text-sm">
          <div>
            <Label className="text-xs text-muted-foreground">Vídeo URL</Label>
            <p className="font-medium">{property.video_url || '—'}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Tour Virtual URL</Label>
            <p className="font-medium">{property.virtual_tour_url || '—'}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Globe className="h-4 w-4" /> Portais
        </h3>
        {portals.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Sem portais configurados</p>
        ) : (
          <div className="space-y-3">
            {portals.map(portal => (
              <div key={portal.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{portal.portal_name}</p>
                  {portal.portal_url && (
                    <a href={portal.portal_url} target="_blank" rel="noopener" className="text-xs text-primary underline">
                      {portal.portal_url}
                    </a>
                  )}
                </div>
                <Switch
                  checked={portal.is_published}
                  onCheckedChange={checked => onTogglePortal(portal.id, checked)}
                />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
