import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Ban } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WaiveDueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  due: {
    id: string;
    amount: number;
    paid_amount: number;
    member_name: string;
    due_month: string;
  } | null;
  onSuccess: () => void;
}

export function WaiveDueDialog({ open, onOpenChange, due, onSuccess }: WaiveDueDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const remainingAmount = due ? Number(due.amount) - Number(due.paid_amount) : 0;

  const handleSubmit = async () => {
    if (!due || reason.trim().length < 5) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' 
          ? 'কারণ লিখুন (কমপক্ষে ৫ অক্ষর)'
          : 'Please provide a reason (at least 5 characters)',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('waive-due', {
        body: {
          due_id: due.id,
          reason: reason.trim()
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: language === 'bn' ? 'সফল' : 'Success',
          description: language === 'bn'
            ? `৳${remainingAmount.toLocaleString()} মওকুফ করা হয়েছে`
            : `৳${remainingAmount.toLocaleString()} has been waived`
        });
        setReason('');
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error waiving due:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error instanceof Error ? error.message : 'Failed to waive due',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-warning" />
            {language === 'bn' ? 'বকেয়া মওকুফ করুন' : 'Waive Due'}
          </DialogTitle>
          <DialogDescription>
            {language === 'bn'
              ? 'এই বকেয়া মওকুফ করলে এটি পরিশোধিত হিসেবে চিহ্নিত হবে'
              : 'Waiving this due will mark it as paid'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {due && (
            <div className="p-4 rounded-lg border bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{language === 'bn' ? 'সদস্য' : 'Member'}</span>
                <span className="font-medium">{due.member_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{language === 'bn' ? 'মোট বকেয়া' : 'Total Due'}</span>
                <span>৳{Number(due.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{language === 'bn' ? 'পরিশোধিত' : 'Paid'}</span>
                <span className="text-success">৳{Number(due.paid_amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="font-medium">{language === 'bn' ? 'মওকুফ পরিমাণ' : 'Waive Amount'}</span>
                <span className="font-bold text-warning">৳{remainingAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          <Alert variant="default" className="border-warning/50 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning">
              {language === 'bn'
                ? 'এই ক্রিয়া পূর্বাবস্থায় ফেরানো যাবে না। নিশ্চিত হয়ে এগিয়ে যান।'
                : 'This action cannot be undone. Please proceed with caution.'}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>{language === 'bn' ? 'মওকুফের কারণ' : 'Reason for Waiver'} *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={language === 'bn' 
                ? 'মওকুফের কারণ লিখুন (বাধ্যতামূলক)...'
                : 'Enter reason for waiving (required)...'}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {language === 'bn' ? 'কমপক্ষে ৫ অক্ষর প্রয়োজন' : 'Minimum 5 characters required'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {language === 'bn' ? 'বাতিল' : 'Cancel'}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleSubmit} 
            disabled={submitting || reason.trim().length < 5}
            className="gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {language === 'bn' ? 'মওকুফ করুন' : 'Waive Due'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
