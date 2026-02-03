import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useQuery } from '@tanstack/react-query';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { 
  MessageSquare, 
  Users, 
  History, 
  Package,
  ShoppingCart
} from 'lucide-react';
import { formatPrice } from '@/lib/plans';

interface AddonConfig {
  id: string;
  addon_type: string;
  name: string;
  name_bn: string | null;
  description: string | null;
  description_bn: string | null;
  quantity: number;
  unit: string;
  price: number;
  validity_days: number | null;
  is_active: boolean;
  sort_order: number;
}

interface AddOnPurchaseCardProps {
  onPurchaseRequest?: (addon: AddonConfig) => void;
}

export function AddOnPurchaseCard({ onPurchaseRequest }: AddOnPurchaseCardProps) {
  const { language } = useLanguage();
  const { tenant } = useTenant();

  const { data: addons, isLoading } = useQuery({
    queryKey: ['addon-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('addon_configs')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as unknown as AddonConfig[];
    }
  });

  const { data: purchasedAddons } = useQuery({
    queryKey: ['tenant-addons', tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_addons')
        .select('*, addon_configs(*)')
        .eq('tenant_id', tenant!.id)
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
    enabled: !!tenant?.id
  });

  const getAddonIcon = (type: string) => {
    switch (type) {
      case 'sms_bundle': return <MessageSquare className="h-5 w-5" />;
      case 'member_pack': return <Users className="h-5 w-5" />;
      case 'report_history': return <History className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const getAddonTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; bn: string }> = {
      sms_bundle: { en: 'SMS Bundle', bn: 'SMS বান্ডেল' },
      member_pack: { en: 'Member Pack', bn: 'সদস্য প্যাক' },
      report_history: { en: 'Report History', bn: 'রিপোর্ট হিস্ট্রি' },
      custom_module: { en: 'Module', bn: 'মডিউল' }
    };
    return language === 'bn' ? labels[type]?.bn : labels[type]?.en;
  };

  if (isLoading) {
    return <SkeletonLoader variant="card" />;
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          {language === 'bn' ? 'অ্যাড-অন কিনুন' : 'Purchase Add-Ons'}
        </CardTitle>
        <CardDescription>
          {language === 'bn' 
            ? 'আপনার প্ল্যানে অতিরিক্ত ফিচার যোগ করুন'
            : 'Extend your plan with additional features'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {addons?.map((addon) => {
            const name = language === 'bn' && addon.name_bn ? addon.name_bn : addon.name;
            const description = language === 'bn' && addon.description_bn 
              ? addon.description_bn 
              : addon.description;

            return (
              <div 
                key={addon.id}
                className="rounded-lg border border-border p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {getAddonIcon(addon.addon_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium truncate">{name}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {getAddonTypeLabel(addon.addon_type)}
                      </Badge>
                      {addon.validity_days && (
                        <Badge variant="outline" className="text-xs">
                          {addon.validity_days} {language === 'bn' ? 'দিন' : 'days'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(addon.price)}
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onPurchaseRequest?.(addon)}
                    className="gap-1"
                  >
                    {language === 'bn' ? 'কিনুন' : 'Buy'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Add-ons */}
        {purchasedAddons && purchasedAddons.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="text-sm font-medium mb-3">
              {language === 'bn' ? 'সক্রিয় অ্যাড-অন' : 'Active Add-Ons'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {purchasedAddons.map((pa: any) => (
                <Badge key={pa.id} variant="secondary">
                  {language === 'bn' && pa.addon_configs?.name_bn 
                    ? pa.addon_configs.name_bn 
                    : pa.addon_configs?.name}
                  {' '}
                  ({pa.quantity_purchased - pa.quantity_used} {language === 'bn' ? 'বাকি' : 'remaining'})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
