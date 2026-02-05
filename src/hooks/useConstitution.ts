import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

interface Constitution {
  id: string;
  tenant_id: string;
  content: string;
  content_bn: string | null;
  updated_at: string;
  updated_by: string | null;
  created_at: string;
}

export function useConstitution() {
  const { tenant } = useTenant();
  const [constitution, setConstitution] = useState<Constitution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchConstitution = useCallback(async () => {
    if (!tenant?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('constitutions')
        .select('*')
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching constitution:', error);
        toast.error('Failed to load constitution');
      } else {
        setConstitution(data);
      }
    } catch (error) {
      console.error('Error fetching constitution:', error);
      toast.error('Failed to load constitution');
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.id]);

  useEffect(() => {
    fetchConstitution();
  }, [fetchConstitution]);

  const updateConstitution = async (content: string, content_bn?: string) => {
    if (!tenant?.id) {
      toast.error('No tenant context available');
      return false;
    }

    try {
      setIsSaving(true);
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error('You must be logged in to update the constitution');
        return false;
      }

      const response = await supabase.functions.invoke('update-constitution', {
        body: { content, content_bn },
      });

      if (response.error) {
        console.error('Error updating constitution:', response.error);
        toast.error(response.error.message || 'Failed to update constitution');
        return false;
      }

      if (response.data?.constitution) {
        setConstitution(response.data.constitution);
        toast.success('Constitution updated successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error updating constitution:', error);
      toast.error('Failed to update constitution');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    constitution,
    isLoading,
    isSaving,
    updateConstitution,
    refetch: fetchConstitution,
  };
}
