import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Wallet,
  Calendar,
  Users,
  ClipboardList,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface BulkPaymentWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ContributionType {
  id: string;
  name: string;
  name_bn: string | null;
  category_type: string;
  is_fixed_amount: boolean;
  default_amount: number | null;
  is_active: boolean;
}

interface Member {
  id: string;
  name: string;
  name_bn: string | null;
  member_number: string | null;
  status: string;
}

interface MemberDueStatus {
  member_id: string;
  has_unpaid: boolean;
  unpaid_amount: number;
}

interface PaymentEntry {
  member_id: string;
  member_name: string;
  member_name_bn: string | null;
  member_number: string | null;
  amount: number;
  selected: boolean;
  due_status: 'paid' | 'unpaid' | 'partial' | 'none';
  unpaid_amount: number;
}

const STEPS = [
  { id: 1, title: 'Select Category', titleBn: 'ক্যাটাগরি নির্বাচন' },
  { id: 2, title: 'Payment Details', titleBn: 'পেমেন্ট বিবরণ' },
  { id: 3, title: 'Enter Payments', titleBn: 'পেমেন্ট এন্ট্রি' },
  { id: 4, title: 'Review & Confirm', titleBn: 'পর্যালোচনা ও নিশ্চিত' },
];

const PAYMENT_METHODS = [
  { value: 'offline', label: 'Cash', labelBn: 'নগদ' },
  { value: 'bkash', label: 'bKash', labelBn: 'বিকাশ' },
  { value: 'nagad', label: 'Nagad', labelBn: 'নগদ' },
  { value: 'rocket', label: 'Rocket', labelBn: 'রকেট' },
  { value: 'card', label: 'Bank/Card', labelBn: 'ব্যাংক/কার্ড' },
  { value: 'other', label: 'Other', labelBn: 'অন্যান্য' },
];

export function BulkPaymentWizard({ open, onOpenChange, onSuccess }: BulkPaymentWizardProps) {
  const { language } = useLanguage();
  const { tenant } = useTenant();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Category
  const [contributionTypes, setContributionTypes] = useState<ContributionType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ContributionType | null>(null);

  // Step 2: Payment Details
  const [paymentDate, setPaymentDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState<string>('offline');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  // Step 3: Member Payments
  const [members, setMembers] = useState<Member[]>([]);
  const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Step 4: Confirmation
  const [confirmed, setConfirmed] = useState(false);

  // Result tracking
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    failed: number;
    total_amount: number;
  } | null>(null);

  useEffect(() => {
    if (open && tenant?.id) {
      loadContributionTypes();
      loadMembers();
    }
  }, [open, tenant?.id]);

  useEffect(() => {
    if (selectedCategory && members.length > 0) {
      initializePaymentEntries();
    }
  }, [selectedCategory, members]);

  const loadContributionTypes = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contribution_types')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setContributionTypes(data || []);
    } catch (error) {
      console.error('Error loading contribution types:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    if (!tenant?.id) return;
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, name, name_bn, member_number, status')
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const initializePaymentEntries = async () => {
    if (!tenant?.id || !selectedCategory) return;

    // Get due status for all members
    const { data: dues } = await supabase
      .from('dues')
      .select('member_id, amount, paid_amount, status')
      .eq('tenant_id', tenant.id)
      .eq('contribution_type_id', selectedCategory.id)
      .neq('status', 'paid');

    const dueMap = new Map<string, MemberDueStatus>();
    for (const due of (dues || [])) {
      const existing = dueMap.get(due.member_id);
      const unpaid = Number(due.amount) - Number(due.paid_amount);
      if (existing) {
        existing.unpaid_amount += unpaid;
      } else {
        dueMap.set(due.member_id, {
          member_id: due.member_id,
          has_unpaid: true,
          unpaid_amount: unpaid
        });
      }
    }

    const entries: PaymentEntry[] = members.map(member => {
      const dueStatus = dueMap.get(member.id);
      const defaultAmount = selectedCategory.is_fixed_amount && selectedCategory.default_amount
        ? selectedCategory.default_amount
        : (dueStatus?.unpaid_amount || 0);

      return {
        member_id: member.id,
        member_name: member.name,
        member_name_bn: member.name_bn,
        member_number: member.member_number,
        amount: defaultAmount,
        selected: false,
        due_status: dueStatus ? (dueStatus.unpaid_amount > 0 ? 'unpaid' : 'paid') : 'none',
        unpaid_amount: dueStatus?.unpaid_amount || 0
      };
    });

    setPaymentEntries(entries);
  };

  const filteredEntries = useMemo(() => {
    if (!searchQuery) return paymentEntries;
    const query = searchQuery.toLowerCase();
    return paymentEntries.filter(entry =>
      entry.member_name.toLowerCase().includes(query) ||
      entry.member_name_bn?.toLowerCase().includes(query) ||
      entry.member_number?.toLowerCase().includes(query)
    );
  }, [paymentEntries, searchQuery]);

  const selectedEntries = paymentEntries.filter(e => e.selected && e.amount > 0);
  const totalAmount = selectedEntries.reduce((sum, e) => sum + e.amount, 0);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedCategory !== null;
      case 2:
        return paymentDate && paymentMethod;
      case 3:
        return selectedEntries.length > 0;
      case 4:
        return confirmed;
      default:
        return false;
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setPaymentEntries(prev => prev.map(entry =>
      entry.member_id === memberId
        ? { ...entry, selected: !entry.selected }
        : entry
    ));
  };

  const updateMemberAmount = (memberId: string, amount: number) => {
    setPaymentEntries(prev => prev.map(entry =>
      entry.member_id === memberId
        ? { ...entry, amount: Math.max(0, amount) }
        : entry
    ));
  };

  const selectAll = () => {
    setPaymentEntries(prev => prev.map(entry => ({
      ...entry,
      selected: entry.amount > 0
    })));
  };

  const deselectAll = () => {
    setPaymentEntries(prev => prev.map(entry => ({
      ...entry,
      selected: false
    })));
  };

  const handleSubmit = async () => {
    if (!tenant?.id || !selectedCategory || !canProceed()) return;

    setSubmitting(true);
    setResult(null);

    try {
      const payments = selectedEntries.map(entry => ({
        member_id: entry.member_id,
        amount: entry.amount
      }));

      const { data, error } = await supabase.functions.invoke('create-bulk-payments', {
        body: {
          contribution_type_id: selectedCategory.id,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
          payments
        }
      });

      if (error) throw error;

      if (data.success) {
        setResult({
          created: data.created,
          skipped: data.skipped,
          failed: data.failed,
          total_amount: data.total_amount
        });

        toast({
          title: language === 'bn' ? 'সফল' : 'Success',
          description: data.message
        });

        setCurrentStep(5);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error creating bulk payments:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error instanceof Error ? error.message : 'Failed to create payments',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (result?.created && result.created > 0) {
      onSuccess();
    }
    // Reset state
    setCurrentStep(1);
    setSelectedCategory(null);
    setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
    setPaymentMethod('offline');
    setReference('');
    setNotes('');
    setPaymentEntries([]);
    setSearchQuery('');
    setConfirmed(false);
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            {language === 'bn' ? 'বাল্ক পেমেন্ট এন্ট্রি' : 'Bulk Payment Entry'}
          </DialogTitle>
          <DialogDescription>
            {language === 'bn' 
              ? 'একাধিক সদস্যের পেমেন্ট একসাথে রেকর্ড করুন'
              : 'Record payments for multiple members at once'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        {currentStep <= 4 && (
          <div className="flex items-center justify-between px-2 py-4 border-b">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${
                  currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep > step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : currentStep === step.id 
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {currentStep > step.id ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                  </div>
                  <span className="hidden sm:inline text-sm">
                    {language === 'bn' ? step.titleBn : step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-8 sm:w-12 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-auto py-4">
          {/* Step 1: Select Category */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Label>{language === 'bn' ? 'পেমেন্ট ক্যাটাগরি' : 'Payment Category'}</Label>
              <div className="grid gap-3">
                {contributionTypes.map(ct => (
                  <div
                    key={ct.id}
                    onClick={() => setSelectedCategory(ct)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedCategory?.id === ct.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {language === 'bn' && ct.name_bn ? ct.name_bn : ct.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {ct.is_fixed_amount 
                              ? (language === 'bn' ? 'নির্ধারিত' : 'Fixed')
                              : (language === 'bn' ? 'পরিবর্তনযোগ্য' : 'Flexible')}
                          </Badge>
                          {ct.default_amount && (
                            <span className="text-sm text-muted-foreground">
                              ৳{ct.default_amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedCategory?.id === ct.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Payment Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'পেমেন্টের তারিখ' : 'Payment Date'}</Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'পেমেন্ট পদ্ধতি' : 'Payment Method'}</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map(method => (
                        <SelectItem key={method.value} value={method.value}>
                          {language === 'bn' ? method.labelBn : method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{language === 'bn' ? 'রেফারেন্স (ঐচ্ছিক)' : 'Reference (optional)'}</Label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={language === 'bn' ? 'রেফারেন্স নম্বর...' : 'Reference number...'}
                />
              </div>

              <div className="space-y-2">
                <Label>{language === 'bn' ? 'নোট (ঐচ্ছিক)' : 'Notes (optional)'}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={language === 'bn' ? 'যেকোনো অতিরিক্ত তথ্য...' : 'Any additional notes...'}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 3: Enter Payments */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={language === 'bn' ? 'সদস্য খুঁজুন...' : 'Search members...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {language === 'bn' ? 'সব নির্বাচন' : 'Select All'}
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  {language === 'bn' ? 'সব বাতিল' : 'Deselect All'}
                </Button>
              </div>

              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  {language === 'bn'
                    ? `${selectedEntries.length} সদস্য নির্বাচিত • মোট: ৳${totalAmount.toLocaleString()}`
                    : `${selectedEntries.length} members selected • Total: ৳${totalAmount.toLocaleString()}`}
                </AlertDescription>
              </Alert>

              <ScrollArea className="h-[350px] border rounded-lg">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>{language === 'bn' ? 'সদস্য' : 'Member'}</TableHead>
                      <TableHead>{language === 'bn' ? 'বকেয়া স্ট্যাটাস' : 'Due Status'}</TableHead>
                      <TableHead className="text-right w-[150px]">
                        {language === 'bn' ? 'পরিমাণ' : 'Amount'}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map(entry => (
                      <TableRow 
                        key={entry.member_id}
                        className={entry.selected ? 'bg-primary/5' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={entry.selected}
                            onCheckedChange={() => toggleMemberSelection(entry.member_id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {language === 'bn' && entry.member_name_bn 
                                ? entry.member_name_bn 
                                : entry.member_name}
                            </p>
                            {entry.member_number && (
                              <p className="text-xs text-muted-foreground">#{entry.member_number}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {entry.due_status === 'unpaid' && (
                            <Badge variant="destructive" className="text-xs">
                              {language === 'bn' ? 'বকেয়া' : 'Unpaid'}: ৳{entry.unpaid_amount.toLocaleString()}
                            </Badge>
                          )}
                          {entry.due_status === 'partial' && (
                            <Badge variant="secondary" className="text-xs">
                              {language === 'bn' ? 'আংশিক' : 'Partial'}
                            </Badge>
                          )}
                          {entry.due_status === 'paid' && (
                            <Badge variant="outline" className="text-xs text-success border-success">
                              {language === 'bn' ? 'পরিশোধিত' : 'Paid'}
                            </Badge>
                          )}
                          {entry.due_status === 'none' && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">৳</span>
                            <Input
                              type="number"
                              value={entry.amount || ''}
                              onChange={(e) => updateMemberAmount(entry.member_id, Number(e.target.value))}
                              className="pl-8 w-full text-right"
                              disabled={selectedCategory?.is_fixed_amount}
                              min={0}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {/* Step 4: Review & Confirm */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="rounded-lg border p-4 space-y-4">
                <h3 className="font-semibold">{language === 'bn' ? 'সারসংক্ষেপ' : 'Summary'}</h3>
                
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === 'bn' ? 'ক্যাটাগরি' : 'Category'}</span>
                    <span className="font-medium">
                      {language === 'bn' && selectedCategory?.name_bn 
                        ? selectedCategory.name_bn 
                        : selectedCategory?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === 'bn' ? 'তারিখ' : 'Date'}</span>
                    <span className="font-medium">{format(new Date(paymentDate), 'dd MMM yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === 'bn' ? 'পদ্ধতি' : 'Method'}</span>
                    <span className="font-medium">
                      {PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === 'bn' ? 'সদস্য সংখ্যা' : 'Members'}</span>
                    <span className="font-medium">{selectedEntries.length}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold">{language === 'bn' ? 'মোট পরিমাণ' : 'Total Amount'}</span>
                    <span className="font-bold text-lg text-primary">
                      ৳{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected Members Preview */}
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-3">{language === 'bn' ? 'নির্বাচিত সদস্য' : 'Selected Members'}</h4>
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {selectedEntries.map(entry => (
                      <div key={entry.member_id} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                        <span>
                          {language === 'bn' && entry.member_name_bn 
                            ? entry.member_name_bn 
                            : entry.member_name}
                        </span>
                        <span className="font-medium">৳{entry.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {language === 'bn'
                    ? 'পেমেন্টগুলো সংশ্লিষ্ট বকেয়ার সাথে স্বয়ংক্রিয়ভাবে সমন্বয় হবে। অতিরিক্ত পরিমাণ অ্যাডভান্স ব্যালেন্সে যোগ হবে।'
                    : 'Payments will be automatically reconciled with linked dues. Excess amounts will be added to advance balance.'}
                </AlertDescription>
              </Alert>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Checkbox
                  id="confirm"
                  checked={confirmed}
                  onCheckedChange={(checked) => setConfirmed(checked === true)}
                />
                <label htmlFor="confirm" className="text-sm cursor-pointer">
                  {language === 'bn'
                    ? 'আমি নিশ্চিত করছি যে এই পেমেন্টগুলো সঠিকভাবে সংগ্রহ করা হয়েছে।'
                    : 'I confirm these payments were collected correctly.'}
                </label>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {currentStep === 5 && result && (
            <div className="text-center py-8 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold">
                  {language === 'bn' ? 'বাল্ক পেমেন্ট সম্পন্ন' : 'Bulk Payments Recorded'}
                </h3>
                <p className="text-muted-foreground mt-1">
                  {language === 'bn' 
                    ? `মোট ৳${result.total_amount.toLocaleString()} সফলভাবে রেকর্ড হয়েছে`
                    : `Total ৳${result.total_amount.toLocaleString()} recorded successfully`}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-2xl font-bold text-success">{result.created}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'bn' ? 'তৈরি' : 'Created'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-2xl font-bold text-warning">{result.skipped}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'bn' ? 'বাদ' : 'Skipped'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-2xl font-bold text-destructive">{result.failed}</p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'bn' ? 'ব্যর্থ' : 'Failed'}
                  </p>
                </div>
              </div>

              <Button onClick={handleClose}>
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </Button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {currentStep <= 4 && (
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? handleClose : handleBack}
              disabled={submitting}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {currentStep === 1 
                ? (language === 'bn' ? 'বাতিল' : 'Cancel')
                : (language === 'bn' ? 'পিছনে' : 'Back')}
            </Button>

            {currentStep < 4 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                {language === 'bn' ? 'পরবর্তী' : 'Next'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={!canProceed() || submitting}
                className="gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {language === 'bn' ? 'পেমেন্ট রেকর্ড করুন' : 'Record Payments'}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
