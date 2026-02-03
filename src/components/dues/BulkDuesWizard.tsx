import { useState, useEffect } from 'react';
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
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  Users,
  Calendar,
  Wallet,
  ClipboardList
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth } from 'date-fns';

interface BulkDuesWizardProps {
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
  joined_at: string | null;
}

type SelectionMode = 'all_active' | 'selected';

const STEPS = [
  { id: 1, title: 'Select Category', titleBn: 'ক্যাটাগরি নির্বাচন' },
  { id: 2, title: 'Select Members', titleBn: 'সদস্য নির্বাচন' },
  { id: 3, title: 'Period & Amount', titleBn: 'মেয়াদ ও পরিমাণ' },
  { id: 4, title: 'Review & Confirm', titleBn: 'পর্যালোচনা ও নিশ্চিত' },
];

export function BulkDuesWizard({ open, onOpenChange, onSuccess }: BulkDuesWizardProps) {
  const { language } = useLanguage();
  const { tenant } = useTenant();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Category
  const [contributionTypes, setContributionTypes] = useState<ContributionType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ContributionType | null>(null);

  // Step 2: Members
  const [members, setMembers] = useState<Member[]>([]);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('all_active');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [memberSearch, setMemberSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  // Step 3: Period & Amount
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1); // 1-12
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Compute dueMonth from year and month
  const dueMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;

  // Step 4: Confirmation
  const [confirmed, setConfirmed] = useState(false);

  // Result tracking
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    failed: number;
  } | null>(null);

  useEffect(() => {
    if (open && tenant?.id) {
      loadContributionTypes();
      loadMembers();
    }
  }, [open, tenant?.id]);

  useEffect(() => {
    if (selectedCategory) {
      if (selectedCategory.is_fixed_amount && selectedCategory.default_amount) {
        setAmount(selectedCategory.default_amount);
      }
    }
  }, [selectedCategory]);

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
        .select('id, name, name_bn, member_number, status, joined_at')
        .eq('tenant_id', tenant.id)
        .order('name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const filteredMembers = members.filter(m => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (memberSearch) {
      const search = memberSearch.toLowerCase();
      return (
        m.name.toLowerCase().includes(search) ||
        m.name_bn?.toLowerCase().includes(search) ||
        m.member_number?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const activeMembers = members.filter(m => m.status === 'active');
  const targetMemberCount = selectionMode === 'all_active' 
    ? activeMembers.length 
    : selectedMemberIds.size;

  const totalDueAmount = targetMemberCount * amount;

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    // 5 years back and 1 year forward
    for (let y = currentYear - 5; y <= currentYear + 1; y++) {
      years.push(y);
    }
    return years;
  };

  const getMonthOptions = () => {
    return [
      { value: 1, label: language === 'bn' ? 'জানুয়ারি' : 'January' },
      { value: 2, label: language === 'bn' ? 'ফেব্রুয়ারি' : 'February' },
      { value: 3, label: language === 'bn' ? 'মার্চ' : 'March' },
      { value: 4, label: language === 'bn' ? 'এপ্রিল' : 'April' },
      { value: 5, label: language === 'bn' ? 'মে' : 'May' },
      { value: 6, label: language === 'bn' ? 'জুন' : 'June' },
      { value: 7, label: language === 'bn' ? 'জুলাই' : 'July' },
      { value: 8, label: language === 'bn' ? 'আগস্ট' : 'August' },
      { value: 9, label: language === 'bn' ? 'সেপ্টেম্বর' : 'September' },
      { value: 10, label: language === 'bn' ? 'অক্টোবর' : 'October' },
      { value: 11, label: language === 'bn' ? 'নভেম্বর' : 'November' },
      { value: 12, label: language === 'bn' ? 'ডিসেম্বর' : 'December' },
    ];
  };

  const isBackdated = new Date(dueMonth) < startOfMonth(new Date());

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
        return targetMemberCount > 0;
      case 3:
        return amount > 0 && dueMonth;
      case 4:
        return confirmed;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!tenant?.id || !selectedCategory || !canProceed()) return;

    setSubmitting(true);
    setResult(null);

    try {
      const memberIds = selectionMode === 'all_active' 
        ? 'all_active' 
        : Array.from(selectedMemberIds);

      const { data, error } = await supabase.functions.invoke('create-bulk-dues', {
        body: {
          contribution_type_id: selectedCategory.id,
          due_month: dueMonth,
          amount,
          member_ids: memberIds,
          notes: notes.trim() || undefined
        }
      });

      if (error) throw error;

      if (data.success) {
        setResult({
          created: data.created,
          skipped: data.skipped,
          failed: data.failed
        });

        toast({
          title: language === 'bn' ? 'সফল' : 'Success',
          description: data.message
        });

        // Move to success state
        setCurrentStep(5);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error creating bulk dues:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: error instanceof Error ? error.message : 'Failed to create dues',
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
    setSelectionMode('all_active');
    setSelectedMemberIds(new Set());
    setAmount(0);
    setNotes('');
    setConfirmed(false);
    setResult(null);
    onOpenChange(false);
  };

  const toggleMember = (memberId: string) => {
    const newSet = new Set(selectedMemberIds);
    if (newSet.has(memberId)) {
      newSet.delete(memberId);
    } else {
      newSet.add(memberId);
    }
    setSelectedMemberIds(newSet);
  };

  const selectAllFiltered = () => {
    const newSet = new Set(selectedMemberIds);
    filteredMembers.forEach(m => newSet.add(m.id));
    setSelectedMemberIds(newSet);
  };

  const deselectAll = () => {
    setSelectedMemberIds(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            {language === 'bn' ? 'বাল্ক বকেয়া তৈরি' : 'Create Bulk Dues'}
          </DialogTitle>
          <DialogDescription>
            {language === 'bn' 
              ? 'একাধিক সদস্যের জন্য একসাথে বকেয়া তৈরি করুন'
              : 'Create dues for multiple members at once'}
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

          {/* Step 2: Select Members */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant={selectionMode === 'all_active' ? 'default' : 'outline'}
                  onClick={() => setSelectionMode('all_active')}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  {language === 'bn' ? 'সব সক্রিয় সদস্য' : 'All Active Members'}
                  <Badge variant="secondary">{activeMembers.length}</Badge>
                </Button>
                <Button
                  variant={selectionMode === 'selected' ? 'default' : 'outline'}
                  onClick={() => setSelectionMode('selected')}
                  className="gap-2"
                >
                  {language === 'bn' ? 'নির্বাচিত সদস্য' : 'Select Members'}
                  {selectedMemberIds.size > 0 && (
                    <Badge variant="secondary">{selectedMemberIds.size}</Badge>
                  )}
                </Button>
              </div>

              {selectionMode === 'selected' && (
                <>
                  <div className="flex gap-2">
                    <Input
                      placeholder={language === 'bn' ? 'সদস্য খুঁজুন...' : 'Search members...'}
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === 'bn' ? 'সব' : 'All'}</SelectItem>
                        <SelectItem value="active">{language === 'bn' ? 'সক্রিয়' : 'Active'}</SelectItem>
                        <SelectItem value="inactive">{language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllFiltered}>
                      {language === 'bn' ? 'সব নির্বাচন' : 'Select All'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAll}>
                      {language === 'bn' ? 'সব বাতিল' : 'Deselect All'}
                    </Button>
                  </div>

                  <ScrollArea className="h-[300px] border rounded-lg p-2">
                    <div className="space-y-1">
                      {filteredMembers.map(member => (
                        <div
                          key={member.id}
                          onClick={() => toggleMember(member.id)}
                          className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                            selectedMemberIds.has(member.id)
                              ? 'bg-primary/10'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <Checkbox
                            checked={selectedMemberIds.has(member.id)}
                            onCheckedChange={() => toggleMember(member.id)}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {language === 'bn' && member.name_bn ? member.name_bn : member.name}
                            </p>
                            {member.member_number && (
                              <p className="text-xs text-muted-foreground">#{member.member_number}</p>
                            )}
                          </div>
                          <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {member.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}

              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  {language === 'bn'
                    ? `${targetMemberCount} সদস্যের জন্য বকেয়া তৈরি হবে`
                    : `Dues will be created for ${targetMemberCount} members`}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 3: Period & Amount */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'বকেয়া মাস' : 'Due Period'}</Label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1">
                      {language === 'bn' ? 'বছর' : 'Year'}
                    </Label>
                    <Select 
                      value={selectedYear.toString()} 
                      onValueChange={(v) => setSelectedYear(parseInt(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getYearOptions().map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1">
                      {language === 'bn' ? 'মাস' : 'Month'}
                    </Label>
                    <Select 
                      value={selectedMonth.toString()} 
                      onValueChange={(v) => setSelectedMonth(parseInt(v))}
                    >
                      <SelectTrigger>
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getMonthOptions().map(opt => (
                          <SelectItem key={opt.value} value={opt.value.toString()}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {isBackdated && (
                  <Alert variant="default" className="border-warning/50 bg-warning/10">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <AlertDescription className="text-warning">
                      {language === 'bn'
                        ? 'আপনি পুরনো তারিখের বকেয়া তৈরি করছেন'
                        : 'You are creating backdated dues'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label>{language === 'bn' ? 'পরিমাণ (প্রতি সদস্য)' : 'Amount (per member)'}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">৳</span>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    disabled={selectedCategory?.is_fixed_amount}
                    className="pl-8"
                    min={0}
                  />
                </div>
                {selectedCategory?.is_fixed_amount && (
                  <p className="text-xs text-muted-foreground">
                    {language === 'bn'
                      ? 'নির্ধারিত ক্যাটাগরির জন্য পরিমাণ পরিবর্তনযোগ্য নয়'
                      : 'Amount is fixed for this category'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{language === 'bn' ? 'নোট (ঐচ্ছিক)' : 'Notes (optional)'}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={language === 'bn' ? 'যেকোনো অতিরিক্ত তথ্য...' : 'Any additional notes...'}
                  rows={3}
                />
              </div>
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
                    <span className="text-muted-foreground">{language === 'bn' ? 'মাস' : 'Month'}</span>
                    <span className="font-medium">{format(new Date(dueMonth), 'MMMM yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === 'bn' ? 'প্রতি সদস্য' : 'Per Member'}</span>
                    <span className="font-medium">৳{amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === 'bn' ? 'সদস্য সংখ্যা' : 'Members'}</span>
                    <span className="font-medium">{targetMemberCount}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold">{language === 'bn' ? 'মোট বকেয়া' : 'Total Dues'}</span>
                    <span className="font-bold text-lg text-primary">
                      ৳{totalDueAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {isBackdated && (
                <Alert variant="default" className="border-warning/50 bg-warning/10">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-warning">
                    {language === 'bn'
                      ? 'সতর্কতা: আপনি পুরনো তারিখের বকেয়া তৈরি করছেন'
                      : 'Warning: You are creating backdated dues'}
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {language === 'bn'
                    ? 'যে সদস্যদের ইতিমধ্যে এই মাসের এই ক্যাটাগরির বকেয়া আছে তাদের জন্য ডুপ্লিকেট তৈরি হবে না।'
                    : 'Duplicates will be skipped for members who already have dues for this category and month.'}
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
                    ? 'আমি বুঝতে পারছি যে এটি একাধিক সদস্যের জন্য বকেয়া তৈরি করবে।'
                    : 'I understand this will create dues for multiple members.'}
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
                  {language === 'bn' ? 'বাল্ক বকেয়া তৈরি সম্পন্ন' : 'Bulk Dues Created'}
                </h3>
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
                {language === 'bn' ? 'বকেয়া তৈরি করুন' : 'Create Dues'}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
