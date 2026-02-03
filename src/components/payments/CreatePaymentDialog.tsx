import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Wallet, Loader2, AlertCircle } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  name_bn?: string | null;
  email?: string | null;
}

interface ContributionType {
  id: string;
  name: string;
  name_bn: string | null;
  category_type: string;
  is_fixed_amount: boolean;
  default_amount: number;
  is_active: boolean;
}

interface Due {
  id: string;
  member_id: string;
  amount: number;
  paid_amount: number;
  due_month: string;
  status: 'unpaid' | 'partial' | 'paid';
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
    contribution_type_id: string;
    due_id?: string;
  }) => void;
  onCreateOnlinePayment: (data: {
    member_id: string;
    amount: number;
    period_month: number;
    period_year: number;
    full_name: string;
    email?: string;
    contribution_type_id: string;
    due_id?: string;
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
  const { tenant } = useTenant();
  
  const [paymentType, setPaymentType] = useState<'offline' | 'online'>('offline');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [periodMonth, setPeriodMonth] = useState<number>(currentMonth);
  const [periodYear, setPeriodYear] = useState<number>(currentYear);
  const [notes, setNotes] = useState<string>('');
  const [contributionTypes, setContributionTypes] = useState<ContributionType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [memberDues, setMemberDues] = useState<Due[]>([]);
  const [selectedDueId, setSelectedDueId] = useState<string>('');

  const selectedMember = members.find(m => m.id === selectedMemberId);
  const selectedCategory = contributionTypes.find(c => c.id === selectedCategoryId);

  // Load contribution types when dialog opens
  useEffect(() => {
    if (open && tenant?.id) {
      loadContributionTypes();
    }
  }, [open, tenant?.id]);

  // Load member dues when member is selected and category is monthly
  useEffect(() => {
    if (selectedMemberId && selectedCategory?.category_type === 'monthly' && tenant?.id) {
      loadMemberDues();
    } else {
      setMemberDues([]);
      setSelectedDueId('');
    }
  }, [selectedMemberId, selectedCategoryId, tenant?.id]);

  const loadContributionTypes = async () => {
    if (!tenant?.id) return;
    
    setLoadingTypes(true);
    try {
      const { data, error } = await supabase
        .from('contribution_types')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      
      // Type assertion for the data since types haven't been regenerated yet
      setContributionTypes((data || []) as unknown as ContributionType[]);
      
      // Auto-select monthly contribution if available
      const monthlyType = (data || []).find((t: any) => t.category_type === 'monthly');
      if (monthlyType) {
        setSelectedCategoryId(monthlyType.id);
        setAmount(Number(monthlyType.default_amount) || 0);
      }
    } catch (error) {
      console.error('Error loading contribution types:', error);
    } finally {
      setLoadingTypes(false);
    }
  };

  const loadMemberDues = async () => {
    if (!tenant?.id || !selectedMemberId) return;
    
    try {
      const { data, error } = await supabase
        .from('dues')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('member_id', selectedMemberId)
        .in('status', ['unpaid', 'partial'])
        .order('due_month', { ascending: false })
        .limit(12);

      if (error) throw error;
      setMemberDues((data || []) as unknown as Due[]);
    } catch (error) {
      console.error('Error loading member dues:', error);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    const category = contributionTypes.find(c => c.id === categoryId);
    if (category) {
      if (category.is_fixed_amount) {
        setAmount(Number(category.default_amount) || 0);
      } else if (category.default_amount) {
        setAmount(Number(category.default_amount));
      }
    }
  };

  const handleDueSelect = (dueId: string) => {
    setSelectedDueId(dueId);
    const due = memberDues.find(d => d.id === dueId);
    if (due) {
      const remainingAmount = due.amount - due.paid_amount;
      setAmount(remainingAmount);
      const dueDate = new Date(due.due_month);
      setPeriodMonth(dueDate.getMonth() + 1);
      setPeriodYear(dueDate.getFullYear());
    }
  };

  const handleSubmit = () => {
    if (!selectedMemberId || !amount || !selectedCategoryId) return;

    if (paymentType === 'offline') {
      onCreateOfflinePayment({
        member_id: selectedMemberId,
        amount,
        period_month: periodMonth,
        period_year: periodYear,
        notes,
        contribution_type_id: selectedCategoryId,
        due_id: selectedDueId || undefined
      });
    } else {
      onCreateOnlinePayment({
        member_id: selectedMemberId,
        amount,
        period_month: periodMonth,
        period_year: periodYear,
        full_name: selectedMember?.name || '',
        email: selectedMember?.email || undefined,
        contribution_type_id: selectedCategoryId,
        due_id: selectedDueId || undefined
      });
    }
  };

  const resetForm = () => {
    setSelectedMemberId('');
    setSelectedCategoryId('');
    setSelectedDueId('');
    setAmount(0);
    setPeriodMonth(currentMonth);
    setPeriodYear(currentYear);
    setNotes('');
    setPaymentType('offline');
    setMemberDues([]);
  };

  const getCategoryHint = () => {
    if (!selectedCategory) return null;
    
    switch (selectedCategory.category_type) {
      case 'monthly':
        return language === 'bn' 
          ? 'নিয়মিত মাসিক চাঁদা' 
          : 'Regular monthly contribution';
      case 'fund_raise':
        return language === 'bn'
          ? 'বিশেষ তহবিল সংগ্রহ বা অনুদান'
          : 'Special fund collection or donation';
      case 'other':
        return language === 'bn'
          ? 'অন্যান্য ধরনের পেমেন্ট'
          : 'Other types of payment';
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('payments.addPayment')}</DialogTitle>
          <DialogDescription>
            {language === 'bn' 
              ? 'সদস্যের জন্য নতুন পেমেন্ট রেকর্ড করুন'
              : 'Record a new payment for a member'}
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
            {/* Payment Category - REQUIRED */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                {language === 'bn' ? 'পেমেন্ট ক্যাটাগরি' : 'Payment Category'} *
                <span className="text-destructive">*</span>
              </Label>
              {loadingTypes ? (
                <div className="flex items-center gap-2 h-10 px-3 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
                  </span>
                </div>
              ) : contributionTypes.length === 0 ? (
                <div className="flex items-center gap-2 p-3 border border-warning/30 bg-warning/5 rounded-md">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <span className="text-sm text-warning">
                    {language === 'bn' 
                      ? 'কোনো পেমেন্ট ক্যাটাগরি কনফিগার করা হয়নি। সেটিংসে যান।'
                      : 'No payment categories configured. Go to Settings.'}
                  </span>
                </div>
              ) : (
                <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
                  <SelectTrigger className={!selectedCategoryId ? 'border-destructive/50' : ''}>
                    <SelectValue placeholder={language === 'bn' ? 'ক্যাটাগরি নির্বাচন করুন...' : 'Select category...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {contributionTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <span className={language === 'bn' && type.name_bn ? 'font-bengali' : ''}>
                          {language === 'bn' && type.name_bn ? type.name_bn : type.name}
                        </span>
                        {type.is_fixed_amount && (
                          <span className="text-muted-foreground ml-2">
                            (৳{type.default_amount})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedCategory && (
                <p className="text-xs text-muted-foreground">
                  {getCategoryHint()}
                </p>
              )}
            </div>

            {/* Member Selection */}
            <div className="space-y-2">
              <Label>{language === 'bn' ? 'সদস্য নির্বাচন করুন' : 'Select Member'} *</Label>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'bn' ? 'সদস্য বাছুন...' : 'Choose a member...'} />
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
                  disabled={selectedCategory?.is_fixed_amount}
                />
              </div>
              {selectedCategory?.is_fixed_amount && (
                <p className="text-xs text-muted-foreground">
                  {language === 'bn' 
                    ? 'এই ক্যাটাগরির জন্য পরিমাণ নির্ধারিত'
                    : 'Amount is fixed for this category'}
                </p>
              )}
            </div>

            {/* Outstanding Dues Selection - Show for monthly category */}
            {selectedCategory?.category_type === 'monthly' && memberDues.length > 0 && (
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'বকেয়া নির্বাচন (ঐচ্ছিক)' : 'Select Outstanding Due (Optional)'}</Label>
                <Select value={selectedDueId} onValueChange={handleDueSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'bn' ? 'বকেয়া বাছুন...' : 'Select due...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {memberDues.map((due) => {
                      const dueDate = new Date(due.due_month);
                      const monthName = months.find(m => m.value === dueDate.getMonth() + 1);
                      const remaining = due.amount - due.paid_amount;
                      return (
                        <SelectItem key={due.id} value={due.id}>
                          {language === 'bn' 
                            ? `${monthName?.labelBn} ${dueDate.getFullYear()} - ৳${remaining} বাকি`
                            : `${monthName?.label} ${dueDate.getFullYear()} - ৳${remaining} remaining`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {language === 'bn' 
                    ? 'একটি বকেয়া নির্বাচন করলে পেমেন্ট সেটির সাথে সংযুক্ত হবে'
                    : 'Selecting a due will link this payment to it'}
                </p>
              </div>
            )}

            {/* Period - Show for Monthly Contribution when no due selected */}
            {selectedCategory?.category_type === 'monthly' && !selectedDueId && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'মাস' : 'Month'} *</Label>
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
                  <Label>{language === 'bn' ? 'বছর' : 'Year'} *</Label>
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
            )}

            <TabsContent value="offline" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'নোট (ঐচ্ছিক)' : 'Notes (Optional)'}</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={language === 'bn' ? 'পেমেন্ট নোট...' : 'Payment notes...'}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {language === 'bn'
                  ? 'সদস্যের কাছ থেকে প্রাপ্ত নগদ বা অফলাইন পেমেন্ট রেকর্ড করুন।'
                  : 'Record a cash or offline payment received from the member.'}
              </p>
            </TabsContent>

            <TabsContent value="online" className="mt-0 space-y-2">
              <div className="rounded-lg border border-info/30 bg-info/5 p-3">
                <p className="text-sm text-info">
                  <strong>{language === 'bn' ? 'UddoktaPay দিয়ে অনলাইন পেমেন্ট' : 'Online Payment via UddoktaPay'}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'bn'
                    ? 'সদস্য একটি নিরাপদ পেমেন্ট পেজে রিডাইরেক্ট হবে যেখানে বিকাশ, নগদ, রকেট বা কার্ডে পেমেন্ট করতে পারবে।'
                    : 'The member will be redirected to a secure payment page where they can pay using bKash, Nagad, Rocket, or Card.'}
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedMemberId || !amount || !selectedCategoryId || isSubmitting}
            className="bg-gradient-primary hover:opacity-90 gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {paymentType === 'offline' 
              ? (language === 'bn' ? 'পেমেন্ট রেকর্ড করুন' : 'Record Payment')
              : (language === 'bn' ? 'পেমেন্ট লিংক তৈরি করুন' : 'Create Payment Link')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
