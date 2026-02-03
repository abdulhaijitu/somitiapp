import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreatePaymentParams {
  member_id: string;
  amount: number;
  period_month: number;
  period_year: number;
  full_name: string;
  email?: string;
  contribution_type_id?: string;
  metadata?: Record<string, unknown>;
}

interface PaymentResult {
  success: boolean;
  payment_id?: string;
  invoice_id?: string;
  payment_url?: string;
  reference?: string;
  error?: string;
}

interface VerifyResult {
  success: boolean;
  status?: string;
  payment_id?: string;
  transaction_id?: string;
  payment_method?: string;
  amount?: string;
  already_verified?: boolean;
  error?: string;
}

export function useOnlinePayment() {
  const [isCreating, setIsCreating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const createPayment = async (params: CreatePaymentParams): Promise<PaymentResult> => {
    setIsCreating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to make payments',
          variant: 'destructive'
        });
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: params
      });

      if (error) {
        console.error('Create payment error:', error);
        toast({
          title: 'Payment Error',
          description: error.message || 'Failed to create payment',
          variant: 'destructive'
        });
        return { success: false, error: error.message };
      }

      if (!data.success) {
        toast({
          title: 'Payment Error',
          description: data.error || 'Failed to create payment',
          variant: 'destructive'
        });
        return { success: false, error: data.error };
      }

      return {
        success: true,
        payment_id: data.payment_id,
        invoice_id: data.invoice_id,
        payment_url: data.payment_url,
        reference: data.reference
      };
    } catch (error) {
      console.error('Create payment exception:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Payment Error',
        description: message,
        variant: 'destructive'
      });
      return { success: false, error: message };
    } finally {
      setIsCreating(false);
    }
  };

  const verifyPayment = async (params: { invoice_id?: string; reference?: string }): Promise<VerifyResult> => {
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: params
      });

      if (error) {
        console.error('Verify payment error:', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        return { success: false, error: data.error };
      }

      return {
        success: true,
        status: data.status,
        payment_id: data.payment_id,
        transaction_id: data.transaction_id,
        payment_method: data.payment_method,
        amount: data.amount,
        already_verified: data.already_verified
      };
    } catch (error) {
      console.error('Verify payment exception:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    } finally {
      setIsVerifying(false);
    }
  };

  const redirectToPayment = (paymentUrl: string) => {
    window.location.href = paymentUrl;
  };

  return {
    createPayment,
    verifyPayment,
    redirectToPayment,
    isCreating,
    isVerifying
  };
}
