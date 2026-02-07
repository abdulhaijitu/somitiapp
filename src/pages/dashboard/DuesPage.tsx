import { useState, useEffect, useMemo, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Calendar,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  MoreHorizontal,
  Ban
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BulkDuesWizard } from '@/components/dues/BulkDuesWizard';
import { WaiveDueDialog } from '@/components/dues/WaiveDueDialog';
import { PermissionGate } from '@/components/common/PermissionGate';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { DueStatusBadge } from '@/components/dues/DueStatusBadge';
import { format } from 'date-fns';

interface Due {
  id: string;
  tenant_id: string;
  member_id: string;
  contribution_type_id: string;
  amount: number;
  paid_amount: number;
  due_month: string;
  status: 'unpaid' | 'partial' | 'paid';
  generated_at: string;
  created_at: string;
  advance_from_balance?: number;
  members: {
    id: string;
    name: string;
    name_bn: string | null;
    member_number: string | null;
  } | null;
  contribution_types: {
    name: string;
    name_bn: string | null;
  } | null;
}

const PAGE_SIZE = 20;

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

export function DuesPage() {
  const { language } = useLanguage();
  const { tenant, checkPermission } = useTenant();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [loading, setLoading] = useState(true);
  const [dues, setDues] = useState<Due[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bulkWizardOpen, setBulkWizardOpen] = useState(false);
  const [waiveDueOpen, setWaiveDueOpen] = useState(false);
  const [selectedDueForWaiver, setSelectedDueForWaiver] = useState<{
    id: string;
    amount: number;
    paid_amount: number;
    member_name: string;
    due_month: string;
  } | null>(null);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [currentPage, setCurrentPage] = useState(1);

  // Compute dueMonth from year and month
  const dueMonth = format(new Date(selectedYear, selectedMonth - 1, 1), 'yyyy-MM-dd');

  useEffect(() => {
    if (tenant?.id) {
      loadDues();
    }
  }, [tenant?.id, selectedYear, selectedMonth]);

  const loadDues = useCallback(async () => {
    if (!tenant?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dues')
        .select(`
          *,
          members(id, name, name_bn, member_number),
          contribution_types(name, name_bn)
        `)
        .eq('tenant_id', tenant.id)
        .eq('due_month', dueMonth)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDues((data || []) as unknown as Due[]);
    } catch (error) {
      console.error('Error loading dues:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'বকেয়া লোড করতে ব্যর্থ' : 'Failed to load dues',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [tenant?.id, dueMonth, toast, language]);

  const filteredDues = useMemo(() => {
    let result = [...dues];

    if (statusFilter !== 'all') {
      result = result.filter(d => d.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.members?.name.toLowerCase().includes(query) ||
        d.members?.name_bn?.toLowerCase().includes(query) ||
        d.members?.member_number?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [dues, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredDues.length / PAGE_SIZE);
  const paginatedDues = filteredDues.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const stats = useMemo(() => {
    return {
      total: dues.length,
      unpaid: dues.filter(d => d.status === 'unpaid').length,
      partial: dues.filter(d => d.status === 'partial').length,
      paid: dues.filter(d => d.status === 'paid').length,
      totalAmount: dues.reduce((sum, d) => sum + Number(d.amount), 0),
      paidAmount: dues.reduce((sum, d) => sum + Number(d.paid_amount), 0)
    };
  }, [dues]);

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 5; y <= currentYear + 1; y++) {
      years.push(y);
    }
    return years;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const selectedMonthDate = new Date(selectedYear, selectedMonth - 1, 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            {language === 'bn' ? 'মাসিক বকেয়া' : 'Monthly Dues'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {language === 'bn' 
              ? 'সদস্যদের মাসিক বকেয়া ট্র্যাক এবং পরিচালনা করুন'
              : 'Track and manage member monthly dues'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={loadDues}>
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">{language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{language === 'bn' ? 'এক্সপোর্ট' : 'Export'}</span>
          </Button>
          <PermissionGate requiredRole="admin" showAccessDenied={false}>
            <Button size="sm" className="gap-2" onClick={() => setBulkWizardOpen(true)}>
              <Plus className="h-4 w-4" />
              {language === 'bn' ? 'বাল্ক বকেয়া' : 'Bulk Dues'}
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 stagger-children">
        <Card className="border-border">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <TrendingUp className="h-3.5 w-3.5" />
              {language === 'bn' ? 'মোট বকেয়া' : 'Total Due'}
            </div>
            <div className="mt-1.5 text-2xl font-bold">
              ৳{stats.totalAmount.toLocaleString()}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {stats.total} {language === 'bn' ? 'সদস্য' : 'members'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-destructive uppercase tracking-wide">
              <AlertCircle className="h-3.5 w-3.5" />
              {language === 'bn' ? 'বাকি' : 'Unpaid'}
            </div>
            <div className="mt-1.5 text-2xl font-bold text-destructive">
              {stats.unpaid}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              ৳{(stats.totalAmount - stats.paidAmount).toLocaleString()} {language === 'bn' ? 'বাকি' : 'remaining'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-warning uppercase tracking-wide">
              <Clock className="h-3.5 w-3.5" />
              {language === 'bn' ? 'আংশিক' : 'Partial'}
            </div>
            <div className="mt-1.5 text-2xl font-bold text-warning">
              {stats.partial}
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/20 bg-success/5">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-success uppercase tracking-wide">
              <CheckCircle className="h-3.5 w-3.5" />
              {language === 'bn' ? 'পরিশোধিত' : 'Paid'}
            </div>
            <div className="mt-1.5 text-2xl font-bold text-success">
              {stats.paid}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              ৳{stats.paidAmount.toLocaleString()} {language === 'bn' ? 'আদায়' : 'collected'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3">
            {/* Search */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={language === 'bn' ? 'সদস্য খুঁজুন...' : 'Search member...'}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>

            {/* Filter row */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-row sm:gap-4">
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-full sm:w-[120px]">
                  <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                  <SelectValue placeholder={language === 'bn' ? 'বছর' : 'Year'} />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {getYearOptions().map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder={language === 'bn' ? 'মাস' : 'Month'} />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {months.map(m => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {language === 'bn' ? m.labelBn : m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder={language === 'bn' ? 'সব স্ট্যাটাস' : 'All Status'} />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="all">{language === 'bn' ? 'সব' : 'All'}</SelectItem>
                  <SelectItem value="unpaid">{language === 'bn' ? 'বাকি' : 'Unpaid'}</SelectItem>
                  <SelectItem value="partial">{language === 'bn' ? 'আংশিক' : 'Partial'}</SelectItem>
                  <SelectItem value="paid">{language === 'bn' ? 'পরিশোধিত' : 'Paid'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dues table */}
      {dues.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">
              {language === 'bn' ? 'কোনো বকেয়া নেই' : 'No Dues Found'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {language === 'bn'
                ? 'এই মাসে কোনো বকেয়া তৈরি হয়নি। Settings থেকে স্বয়ংক্রিয় বকেয়া সক্রিয় করুন।'
                : 'No dues generated for this month. Enable auto due generation in Settings.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border">
          <CardContent className={isMobile ? "p-3" : "p-0"}>
            {/* Mobile Card View */}
            {isMobile ? (
              <div className="space-y-3">
                {paginatedDues.map((due) => {
                  const dueDate = new Date(due.due_month);
                  const monthName = months[dueDate.getMonth()];
                  const remaining = Number(due.amount) - Number(due.paid_amount);
                  
                  return (
                    <div key={due.id} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {language === 'bn' && due.members?.name_bn 
                              ? due.members.name_bn 
                              : due.members?.name}
                          </p>
                          {due.members?.member_number && (
                            <p className="text-xs text-muted-foreground">#{due.members.member_number}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <DueStatusBadge status={due.status} />
                          {due.status !== 'paid' && checkPermission('admin') && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDueForWaiver({
                                      id: due.id,
                                      amount: due.amount,
                                      paid_amount: due.paid_amount,
                                      member_name: language === 'bn' && due.members?.name_bn 
                                        ? due.members.name_bn 
                                        : due.members?.name || '',
                                      due_month: due.due_month
                                    });
                                    setWaiveDueOpen(true);
                                  }}
                                  className="gap-2 text-warning"
                                >
                                  <Ban className="h-4 w-4" />
                                  {language === 'bn' ? 'মওকুফ করুন' : 'Waive Due'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">{language === 'bn' ? 'পরিমাণ' : 'Amount'}</span>
                          <p className="font-semibold">৳{Number(due.amount).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{language === 'bn' ? 'পরিশোধিত' : 'Paid'}</span>
                          <p className="font-semibold text-success">৳{Number(due.paid_amount).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{language === 'bn' ? 'বাকি' : 'Due'}</span>
                          <p className="font-semibold text-destructive">
                            {remaining > 0 ? `৳${remaining.toLocaleString()}` : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Desktop Table View */
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'bn' ? 'সদস্য' : 'Member'}</TableHead>
                    <TableHead>{language === 'bn' ? 'মাস' : 'Month'}</TableHead>
                    <TableHead className="text-right">{language === 'bn' ? 'পরিমাণ' : 'Amount'}</TableHead>
                    <TableHead className="text-right">{language === 'bn' ? 'পরিশোধিত' : 'Paid'}</TableHead>
                    <TableHead className="text-right">{language === 'bn' ? 'বাকি' : 'Remaining'}</TableHead>
                    <TableHead>{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDues.map((due) => {
                    const dueDate = new Date(due.due_month);
                    const monthName = months[dueDate.getMonth()];
                    const remaining = Number(due.amount) - Number(due.paid_amount);
                    
                    return (
                      <TableRow key={due.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {language === 'bn' && due.members?.name_bn 
                                ? due.members.name_bn 
                                : due.members?.name}
                            </p>
                            {due.members?.member_number && (
                              <p className="text-xs text-muted-foreground">
                                #{due.members.member_number}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {language === 'bn' ? monthName.labelBn : monthName.label} {dueDate.getFullYear()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ৳{Number(due.amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-success">
                          ৳{Number(due.paid_amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {remaining > 0 ? `৳${remaining.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell>
                          <DueStatusBadge status={due.status} />
                        </TableCell>
                        <TableCell>
                          {due.status !== 'paid' && checkPermission('admin') && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDueForWaiver({
                                      id: due.id,
                                      amount: due.amount,
                                      paid_amount: due.paid_amount,
                                      member_name: language === 'bn' && due.members?.name_bn 
                                        ? due.members.name_bn 
                                        : due.members?.name || '',
                                      due_month: due.due_month
                                    });
                                    setWaiveDueOpen(true);
                                  }}
                                  className="gap-2 text-warning"
                                >
                                  <Ban className="h-4 w-4" />
                                  {language === 'bn' ? 'মওকুফ করুন' : 'Waive Due'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <div className="text-sm text-muted-foreground">
                  {language === 'bn' 
                    ? `${filteredDues.length} টির মধ্যে ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, filteredDues.length)} দেখানো হচ্ছে`
                    : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, filteredDues.length)} of ${filteredDues.length}`}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bulk Dues Wizard */}
      <BulkDuesWizard
        open={bulkWizardOpen}
        onOpenChange={setBulkWizardOpen}
        onSuccess={loadDues}
      />

      {/* Waive Due Dialog */}
      <WaiveDueDialog
        open={waiveDueOpen}
        onOpenChange={setWaiveDueOpen}
        due={selectedDueForWaiver}
        onSuccess={loadDues}
      />
    </div>
  );
}
