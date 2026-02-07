import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface TenantData {
  id: string;
  name: string;
  name_bn: string | null;
  address: string | null;
  subdomain: string;
}

interface UpdateTenantData {
  name: string;
  name_bn: string;
  address: string;
}

export function useTenantSettings() {
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();

  const fetchTenant = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleError || !roleData?.tenant_id) {
        console.error('Failed to get user role:', roleError);
        return;
      }

      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name, name_bn, address, subdomain')
        .eq('id', roleData.tenant_id)
        .single();

      if (tenantError) {
        console.error('Failed to fetch tenant:', tenantError);
        toast({
          title: language === 'bn' ? 'ত্রুটি' : 'Error',
          description: language === 'bn' 
            ? 'প্রতিষ্ঠানের তথ্য লোড করতে ব্যর্থ' 
            : 'Failed to load organization information',
          variant: 'destructive',
        });
      } else {
        setTenant(tenantData);
      }
    } catch (error) {
      console.error('Unexpected error fetching tenant:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' 
          ? 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে' 
          : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, language]);

  // Initial fetch
  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  // Update tenant settings via edge function
  const updateTenantSettings = async (data: UpdateTenantData): Promise<boolean> => {
    setIsSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: language === 'bn' ? 'ত্রুটি' : 'Error',
          description: language === 'bn' 
            ? 'সেশন মেয়াদ উত্তীর্ণ। পুনরায় লগইন করুন।' 
            : 'Session expired. Please login again.',
          variant: 'destructive',
        });
        return false;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-tenant-settings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            name: data.name,
            name_bn: data.name_bn,
            address: data.address,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error('Update failed:', result);
        
        let errorMessage = result.error || 'Failed to update organization information';
        
        if (result.code === 'SUBSCRIPTION_EXPIRED') {
          errorMessage = language === 'bn' 
            ? 'সাবস্ক্রিপশন মেয়াদ উত্তীর্ণ। সেটিংস আপডেট অক্ষম।' 
            : 'Subscription expired. Settings update is disabled.';
        } else if (result.code === 'VALIDATION_ERROR') {
          errorMessage = language === 'bn' 
            ? 'যাচাইকরণ ব্যর্থ: ' + result.details 
            : 'Validation failed: ' + result.details;
        } else if (result.code === 'FORBIDDEN') {
          errorMessage = language === 'bn' 
            ? 'আপনার এই অপারেশনের অনুমতি নেই' 
            : 'You do not have permission for this operation';
        }
        
        toast({
          title: language === 'bn' ? 'ত্রুটি' : 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        return false;
      }

      // Update local state with new data
      if (result.data) {
        setTenant(prev => prev ? { ...prev, ...result.data } : null);
      }

      toast({
        title: language === 'bn' ? 'সফল' : 'Success',
        description: language === 'bn' 
          ? 'প্রতিষ্ঠানের তথ্য সফলভাবে আপডেট হয়েছে' 
          : 'Organization information updated successfully',
      });
      
      return true;
    } catch (error) {
      console.error('Unexpected error updating tenant:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' 
          ? 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে' 
          : 'An unexpected error occurred',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    tenant,
    isLoading,
    isSaving,
    updateTenantSettings,
    refetchTenant: fetchTenant,
  };
}
