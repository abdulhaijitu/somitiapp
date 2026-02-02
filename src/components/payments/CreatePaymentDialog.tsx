import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Wallet, Loader2 } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  name_bn?: string | null;
  email?: string | null;
  monthly_amount?: number | null;
}

interface CreatePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  onCreateOfflinePayment: (data: {
    member_id: string;
    amount: number;
    period_month: number;
    period_year: number;
    notes?: string;
  }) => void;
  onCreateOnlinePayment: (data: {
    member_id: string;
    amount: number;
    period_month: number;
    period_year: number;
    full_name: string;
    email?: string;
  }) => void;
  isSubmitting: boolean;
}

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

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

export function CreatePaymentDialog({
  open,
  onOpenChange,
  members,
  onCreateOfflinePayment,
  onCreateOnlinePayment,
  isSubmitting
}: CreatePaymentDialogProps) {
  const { t, language } = useLanguage();
  const [paymentType, setPaymentType] = useState<'offline' | 'online'>('offline');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [amount, setAmount] = useState<number>(1000);
  const [periodMonth, setPeriodMonth] = useState<number>(currentMonth);
  const [periodYear, setPeriodYear] = useState<number>(currentYear);
  const [notes, setNotes] = useState<string>('');

  const selectedMember = members.find(m => m.id === selectedMemberId);

  const handleMemberChange = (memberId: string) => {
    setSelectedMemberId(memberId);
    const member = members.find(m => m.id === memberId);
    if (member?.monthly_amount) {
      setAmount(Number(member.monthly_amount));
    }
  };

  const handleSubmit = () => {
    if (!selectedMemberId || !amount) return;

    if (paymentType === 'offline') {
      onCreateOfflinePayment({
        member_id: selectedMemberId,
        amount,
        period_month: periodMonth,
        period_year: periodYear,
        notes
      });
    } else {
      onCreateOnlinePayment({
        member_id: selectedMemberId,
        amount,
        period_month: periodMonth,
        period_year: periodYear,
        full_name: selectedMember?.name || '',
        email: selectedMember?.email || undefined
      });
    }
  };

  const resetForm = () => {
    setSelectedMemberId('');
    setAmount(1000);
    setPeriodMonth(currentMonth);
    setPeriodYear(currentYear);
    setNotes('');
    setPaymentType('offline');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('payments.addPayment')}</DialogTitle>
          <DialogDescription>
            Record a new payment for a member
          </DialogDescription>
        </DialogHeader>

        <Tabs value={paymentType} onValueChange={(v) => setPaymentType(v as 'offline' | 'online')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="offline" className="gap-2">
              <Wallet className="h-4 w-4" />
              {t('payments.offline')}
            </TabsTrigger>
            <TabsTrigger value="online" className="gap-2">
              <CreditCard className="h-4 w-4" />
              {t('payments.online')}
            </TabsTrigger>
          </TabsList>

          <div className="space-y-4 py-4">
            {/* Member Selection */}
            <div className="space-y-2">
              <Label>Select Member *</Label>
              <Select value={selectedMemberId} onValueChange={handleMemberChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a member..." />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <span className={language === 'bn' && member.name_bn ? 'font-bengali' : ''}>
                        {language === 'bn' && member.name_bn ? member.name_bn : member.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>{t('payments.amount')} *</Label>
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
                <Label>Month *</Label>
                <Select value={periodMonth.toString()} onValueChange={(v) => setPeriodMonth(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Label>Year *</Label>
                <Select value={periodYear.toString()} onValueChange={(v) => setPeriodYear(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
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

            <TabsContent value="offline" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment notes..."
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Record a cash or offline payment received from the member.
              </p>
            </TabsContent>

            <TabsContent value="online" className="mt-0 space-y-2">
              <div className="rounded-lg border border-info/30 bg-info/5 p-3">
                <p className="text-sm text-info">
                  <strong>Online Payment via UddoktaPay</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  The member will be redirected to a secure payment page where they can pay using bKash, Nagad, Rocket, or Card.
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedMemberId || !amount || isSubmitting}
            className="bg-gradient-primary hover:opacity-90 gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {paymentType === 'offline' 
              ? 'Record Payment' 
              : 'Create Payment Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
