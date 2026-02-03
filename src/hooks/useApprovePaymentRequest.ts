import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface ApprovePaymentResult {
  success: boolean;
  payment_url?: string;
  error?: string;
}

export function useApprovePaymentRequest() {
  const [isApproving, setIsApproving] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();

  const approvePayment = async (paymentId: string): Promise<ApprovePaymentResult> => {
    setIsApproving(true);
    
    try {
      const response = await supabase.functions.invoke('approve-payment-request', {
        body: { payment_id: paymentId }
      });

      if (response.error) {
        const errorMsg = response.error.message || 'Failed to approve payment';
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
          description: result.error || 'Approval failed',
          variant: 'destructive'
        });
        return { success: false, error: result.error };
      }

      toast({
        title: language === 'bn' ? 'সফল' : 'Success',
        description: language === 'bn' 
          ? 'পেমেন্ট অনুমোদিত হয়েছে এবং লিংক তৈরি হয়েছে'
          : 'Payment approved and link generated'
      });

      return {
        success: true,
        payment_url: result.payment_url
      };

    } catch (error) {
      console.error('Error approving payment:', error);
      const errorMsg = language === 'bn' ? 'একটি ত্রুটি হয়েছে' : 'An error occurred';
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: errorMsg,
        variant: 'destructive'
      });
      return { success: false, error: errorMsg };
    } finally {
      setIsApproving(false);
    }
  };

  const rejectPayment = async (paymentId: string, reason?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'cancelled',
          metadata: {
            rejected: true,
            rejected_at: new Date().toISOString(),
            rejection_reason: reason
          }
        })
        .eq('id', paymentId);

      if (error) {
        toast({
          title: language === 'bn' ? 'ত্রুটি' : 'Error',
          description: language === 'bn' ? 'রিজেক্ট করতে সমস্যা হয়েছে' : 'Failed to reject payment',
          variant: 'destructive'
        });
        return false;
      }

      toast({
        title: language === 'bn' ? 'সফল' : 'Success',
        description: language === 'bn' ? 'পেমেন্ট রিকোয়েস্ট বাতিল করা হয়েছে' : 'Payment request rejected'
      });

      return true;
    } catch (error) {
      console.error('Error rejecting payment:', error);
      return false;
    }
  };

  return {
    approvePayment,
    rejectPayment,
    isApproving
  };
}
