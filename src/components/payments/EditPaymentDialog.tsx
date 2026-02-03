import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface Payment {
  id: string;
  member_id: string;
  amount: number;
  payment_method: string;
  status: string;
  period_month: number | null;
  period_year: number | null;
  notes?: string | null;
  reference?: string | null;
  members?: {
    name: string;
    name_bn: string | null;
  } | null;
}

interface EditPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
  onSave: (data: {
    id: string;
    amount: number;
    status: string;
    period_month: number | null;
    period_year: number | null;
    notes: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

const currentYear = new Date().getFullYear();

const months = [
  { value: 1, label: 'January', labelBn: 'জানুয়ারি' },
  { value: 2, label: 'February', labelBn: 'ফেব্রুয়ারি' },
  { value: 3, label: 'March', labelBn: 'মার্চ' },
  { value: 4, label: 'April', labelBn: 'এপ্রিল' },
  { value: 5, label: 'May', labelBn: 'মে' },
  { value: 6, label: 'June', labelBn: 'জুন' },
  { value: 7, label: 'July', labelBn: 'জুলাই' },
  { value: 8, label: 'August', labelBn: 'আগস্ট' },
  { value: 9, label: 'September', labelBn: 'সেপ্টেম্বর' },
  { value: 10, label: 'October', labelBn: 'অক্টোবর' },
  { value: 11, label: 'November', labelBn: 'নভেম্বর' },
  { value: 12, label: 'December', labelBn: 'ডিসেম্বর' },
];

const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

const statusOptions = [
  { value: 'pending', label: 'Pending', labelBn: 'অপেক্ষমাণ' },
  { value: 'paid', label: 'Paid', labelBn: 'পরিশোধিত' },
  { value: 'failed', label: 'Failed', labelBn: 'ব্যর্থ' },
  { value: 'cancelled', label: 'Cancelled', labelBn: 'বাতিল' },
  { value: 'refunded', label: 'Refunded', labelBn: 'ফেরত' },
];

export function EditPaymentDialog({
  open,
  onOpenChange,
  payment,
  onSave,
  isSubmitting
}: EditPaymentDialogProps) {
  const { language } = useLanguage();
  
  const [amount, setAmount] = useState<number>(0);
  const [status, setStatus] = useState<string>('pending');
  const [periodMonth, setPeriodMonth] = useState<number | null>(null);
  const [periodYear, setPeriodYear] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (payment) {
      setAmount(Number(payment.amount));
      setStatus(payment.status);
      setPeriodMonth(payment.period_month);
      setPeriodYear(payment.period_year);
      setNotes(payment.notes || '');
    }
  }, [payment]);

  const handleSubmit = async () => {
    if (!payment) return;
    
    await onSave({
      id: payment.id,
      amount,
      status,
      period_month: periodMonth,
      period_year: periodYear,
      notes
    });
  };

  const memberName = payment?.members 
    ? (language === 'bn' && payment.members.name_bn ? payment.members.name_bn : payment.members.name)
    : '-';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {language === 'bn' ? 'পেমেন্ট সম্পাদনা' : 'Edit Payment'}
          </DialogTitle>
          <DialogDescription>
            {language === 'bn' 
              ? `${memberName}-এর পেমেন্ট তথ্য আপডেট করুন`
              : `Update payment details for ${memberName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reference (read-only) */}
          {payment?.reference && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                {language === 'bn' ? 'রেফারেন্স' : 'Reference'}
              </Label>
              <div className="text-sm font-mono bg-muted px-3 py-2 rounded-md">
                {payment.reference}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <Label>{language === 'bn' ? 'স্ট্যাটাস' : 'Status'} *</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {language === 'bn' ? opt.labelBn : opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>{language === 'bn' ? 'পরিমাণ' : 'Amount'} *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">৳</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="pl-8"
                min={0}
              />
            </div>
          </div>

          {/* Period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === 'bn' ? 'মাস' : 'Month'}</Label>
              <Select 
                value={periodMonth?.toString() || ''} 
                onValueChange={(v) => setPeriodMonth(v ? Number(v) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'bn' ? 'মাস বাছুন' : 'Select month'} />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {language === 'bn' ? month.labelBn : month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{language === 'bn' ? 'বছর' : 'Year'}</Label>
              <Select 
                value={periodYear?.toString() || ''} 
                onValueChange={(v) => setPeriodYear(v ? Number(v) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'bn' ? 'বছর বাছুন' : 'Select year'} />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{language === 'bn' ? 'নোট' : 'Notes'}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === 'bn' ? 'পেমেন্ট সংক্রান্ত নোট...' : 'Payment notes...'}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {language === 'bn' ? 'বাতিল' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!amount || isSubmitting}
            className="bg-gradient-primary hover:opacity-90 gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
