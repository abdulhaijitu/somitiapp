import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface RequestPaymentParams {
  due_id: string;
  amount: number;
}

interface RequestPaymentResult {
  success: boolean;
  payment_id?: string;
  reference?: string;
  error?: string;
}

export function useMemberPaymentRequest() {
  const [isRequesting, setIsRequesting] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();

  const requestPayment = async (params: RequestPaymentParams): Promise<RequestPaymentResult> => {
    setIsRequesting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const error = language === 'bn' ? 'লগইন প্রয়োজন' : 'Authentication required';
        toast({
          title: language === 'bn' ? 'ত্রুটি' : 'Error',
          description: error,
          variant: 'destructive'
        });
        return { success: false, error };
      }

      const response = await supabase.functions.invoke('member-request-payment', {
        body: params
      });

      if (response.error) {
        const errorMsg = response.error.message || 'Failed to request payment';
        toast({
          title: language === 'bn' ? 'ত্রুটি' : 'Error',
          description: errorMsg,
          variant: 'destructive'
        });
        return { success: false, error: errorMsg };
      }

      const result = response.data;
      
      if (!result.success) {
        toast({
          title: language === 'bn' ? 'ত্রুটি' : 'Error',
          description: result.error || 'Request failed',
          variant: 'destructive'
        });
        return { success: false, error: result.error };
      }

      toast({
        title: language === 'bn' ? 'সফল' : 'Success',
        description: language === 'bn' 
          ? 'পেমেন্ট রিকোয়েস্ট পাঠানো হয়েছে। অ্যাডমিন অ্যাপ্রুভ করলে লিংক পাবেন।'
          : 'Payment request submitted. You will receive a link once admin approves.'
      });

      return {
        success: true,
        payment_id: result.payment_id,
        reference: result.reference
      };

    } catch (error) {
      console.error('Error requesting payment:', error);
      const errorMsg = language === 'bn' ? 'একটি ত্রুটি হয়েছে' : 'An error occurred';
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: errorMsg,
        variant: 'destructive'
      });
      return { success: false, error: errorMsg };
    } finally {
      setIsRequesting(false);
    }
  };

  return {
    requestPayment,
    isRequesting
  };
}
