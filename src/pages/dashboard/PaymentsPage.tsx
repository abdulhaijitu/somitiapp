import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  Calendar,
  Download,
  RefreshCw,
  ExternalLink,
  Eye,
  AlertCircle,
  CreditCard,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useOnlinePayment } from '@/hooks/useOnlinePayment';
import { CreatePaymentDialog } from '@/components/payments/CreatePaymentDialog';
import { PaymentStatusBadge } from '@/components/payments/PaymentStatusBadge';
import { PaymentMethodBadge } from '@/components/payments/PaymentMethodBadge';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';
import { EmptyState } from '@/components/common/EmptyState';
import { format, isAfter, startOfMonth, subMonths } from 'date-fns';

interface Payment {
  id: string;
  tenant_id: string;
  member_id: string;
  amount: number;
  fee: number | null;
  charged_amount: number | null;
  payment_type: string;
  payment_method: string;
  status: string;
  invoice_id: string | null;
  transaction_id: string | null;
  reference: string | null;
  payment_date: string | null;
  period_month: number | null;
  period_year: number | null;
  created_at: string;
  members: {
    id: string;
    name: string;
    name_bn: string | null;
  } | null;
}

interface Member {
  id: string;
  name: string;
  name_bn: string | null;
  email: string | null;
}

const PAGE_SIZE = 20;

export function PaymentsPage() {
  const { t, language } = useLanguage();
  const { tenant } = useTenant();
  const { toast } = useToast();
  const { createPayment, verifyPayment, redirectToPayment, isCreating, isVerifying } = useOnlinePayment();
  
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const [stats, setStats] = useState({
    thisMonth: 0,
    totalCollected: 0,
    outstanding: 0,
    pendingCount: 0,
    overdueCount: 0
  });

  useEffect(() => {
    loadPayments();
    loadMembers();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('payments')
        .select('*, members(id, name, name_bn)')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error loading payments:', error);
        return;
      }

      setPayments(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (paymentsData: Payment[]) => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));

    const thisMonthPayments = paymentsData.filter(p => {
      const date = new Date(p.payment_date || p.created_at);
      return date >= thisMonthStart && p.status === 'paid';
    });
    
    const totalPaid = paymentsData
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const pendingPayments = paymentsData.filter(p => p.status === 'pending');

    const overduePayments = pendingPayments.filter(p => {
      if (p.period_month && p.period_year) {
        const periodDate = new Date(p.period_year, p.period_month - 1, 1);
        return isAfter(lastMonthStart, periodDate);
      }
      return isAfter(lastMonthStart, new Date(p.created_at));
    });

    setStats({
      thisMonth: thisMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0),
      totalCollected: totalPaid,
      outstanding: pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0),
      pendingCount: pendingPayments.length,
      overdueCount: overduePayments.length
    });
  };

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, name, name_bn, email')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Error loading members:', error);
        return;
      }

      setMembers(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCreateOfflinePayment = async (data: {
    member_id: string;
    amount: number;
    period_month: number;
    period_year: number;
    notes?: string;
    contribution_type_id: string;
  }) => {
    if (!tenant?.id) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'টেন্যান্ট পাওয়া যায়নি' : 'No active tenant found',
        variant: 'destructive'
      });
      return;
    }

    try {
      const reference = `OFF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      const { error } = await supabase
        .from('payments')
        .insert({
          tenant_id: tenant.id,
          member_id: data.member_id,
          amount: data.amount,
          payment_type: 'offline',
          payment_method: 'offline',
          status: 'paid',
          reference,
          period_month: data.period_month,
          period_year: data.period_year,
          payment_date: new Date().toISOString(),
          notes: data.notes,
          contribution_type_id: data.contribution_type_id
        });

      if (error) {
        toast({
          title: language === 'bn' ? 'ত্রুটি' : 'Error',
          description: language === 'bn' ? 'পেমেন্ট রেকর্ড করতে সমস্যা হয়েছে' : 'Failed to record payment',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: language === 'bn' ? 'সফল' : 'Success',
        description: language === 'bn' ? 'অফলাইন পেমেন্ট সফলভাবে রেকর্ড হয়েছে' : 'Offline payment recorded successfully'
      });

      setIsCreateOpen(false);
      loadPayments();

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'একটি অপ্রত্যাশিত ত্রুটি হয়েছে' : 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };

  const handleCreateOnlinePayment = async (data: {
    member_id: string;
    amount: number;
    period_month: number;
    period_year: number;
    full_name: string;
    email?: string;
    contribution_type_id: string;
  }) => {
    const result = await createPayment({
      member_id: data.member_id,
      amount: data.amount,
      period_month: data.period_month,
      period_year: data.period_year,
      full_name: data.full_name,
      email: data.email,
      contribution_type_id: data.contribution_type_id
    });

    if (result.success && result.payment_url) {
      setIsCreateOpen(false);
      redirectToPayment(result.payment_url);
    }
  };

  const handleVerifyPayment = async (payment: Payment) => {
    if (!payment.invoice_id) {
      toast({
        title: 'Cannot Verify',
        description: 'This payment does not have an invoice ID',
        variant: 'destructive'
      });
      return;
    }

    const result = await verifyPayment({ invoice_id: payment.invoice_id });
    
    if (result.success) {
      toast({
        title: 'Verification Complete',
        description: `Payment status: ${result.status}`
      });
      loadPayments();
    } else {
      toast({
        title: 'Verification Failed',
        description: result.error || 'Could not verify payment',
        variant: 'destructive'
      });
    }
  };

  const handleRetryPayment = async (payment: Payment) => {
    if (!payment.members) {
      toast({
        title: 'Cannot Retry',
        description: 'Missing payment information',
        variant: 'destructive'
      });
      return;
    }

    const result = await createPayment({
      member_id: payment.member_id,
      amount: Number(payment.amount),
      period_month: payment.period_month || new Date().getMonth() + 1,
      period_year: payment.period_year || new Date().getFullYear(),
      full_name: payment.members.name
    });

    if (result.success && result.payment_url) {
      redirectToPayment(result.payment_url);
    }
  };

  const isOverdue = (payment: Payment) => {
    if (payment.status !== 'pending') return false;
    const lastMonth = startOfMonth(subMonths(new Date(), 1));
    
    if (payment.period_month && payment.period_year) {
      const periodDate = new Date(payment.period_year, payment.period_month - 1, 1);
      return isAfter(lastMonth, periodDate);
    }
    return isAfter(lastMonth, new Date(payment.created_at));
  };

  const filteredAndSortedPayments = useMemo(() => {
    let result = [...payments];

    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter(p => p.payment_type === typeFilter);
    }

    if (dateFrom) {
      result = result.filter(p => {
        const date = new Date(p.payment_date || p.created_at);
        return date >= dateFrom;
      });
    }
    if (dateTo) {
      result = result.filter(p => {
        const date = new Date(p.payment_date || p.created_at);
        return date <= dateTo;
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.members?.name.toLowerCase().includes(query) ||
        p.members?.name_bn?.toLowerCase().includes(query) ||
        p.reference?.toLowerCase().includes(query) ||
        p.invoice_id?.toLowerCase().includes(query) ||
        p.transaction_id?.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        comparison = new Date(a.payment_date || a.created_at).getTime() - new Date(b.payment_date || b.created_at).getTime();
      } else if (sortBy === 'amount') {
        comparison = Number(a.amount) - Number(b.amount);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [payments, statusFilter, typeFilter, dateFrom, dateTo, searchQuery, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedPayments.length / PAGE_SIZE);
  const paginatedPayments = filteredAndSortedPayments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const toggleSort = (column: 'date' | 'amount') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleDateRangeChange = (from: Date | undefined, to: Date | undefined) => {
    setDateFrom(from);
    setDateTo(to);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            {t('payments.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track and manage all payments
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {t('common.export')}
          </Button>
          <Button 
            className="gap-2 bg-gradient-primary hover:opacity-90"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t('payments.addPayment')}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">This Month</div>
            <div className="mt-1 text-2xl font-bold text-foreground">
              ৳ {stats.thisMonth.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Collected</div>
            <div className="mt-1 text-2xl font-bold text-success">
              ৳ {stats.totalCollected.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Outstanding</div>
            <div className="mt-1 text-2xl font-bold text-warning">
              ৳ {stats.outstanding.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{stats.pendingCount} pending</div>
          </CardContent>
        </Card>
        <Card className="border-border border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              Overdue
            </div>
            <div className="mt-1 text-2xl font-bold text-destructive">
              {stats.overdueCount}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">payments past due</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters bar */}
      <Card className="border-border">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <DateRangeFilter
              from={dateFrom}
              to={dateTo}
              onRangeChange={handleDateRangeChange}
            />
            
            <Select value={typeFilter} onValueChange={(v) => {
              setTypeFilter(v as 'all' | 'online' | 'offline');
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Payment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="online">Online only</SelectItem>
                <SelectItem value="offline">Offline only</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder={t('common.search')} 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <Button variant="outline" size="icon" onClick={loadPayments}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs and table */}
      <Card className="border-border overflow-hidden">
        <Tabs defaultValue="all" className="w-full" onValueChange={(v) => {
          setStatusFilter(v);
          setCurrentPage(1);
        }}>
          <CardHeader className="pb-3">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="paid">{t('payments.paid')}</TabsTrigger>
              <TabsTrigger value="pending">{t('payments.pending')}</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <div className="p-0">
            {paginatedPayments.length === 0 ? (
              <EmptyState
                icon={<CreditCard className="h-8 w-8" />}
                title="No payments found"
                description={searchQuery || dateFrom || dateTo ? "Try adjusting your filters" : "Start by recording your first payment"}
                actionLabel={!searchQuery && !dateFrom && !dateTo ? "Add Payment" : undefined}
                onAction={!searchQuery && !dateFrom && !dateTo ? () => setIsCreateOpen(true) : undefined}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Reference</TableHead>
                        <TableHead>Member</TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1 -ml-3 h-8"
                            onClick={() => toggleSort('date')}
                          >
                            {t('payments.date')}
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>{t('payments.method')}</TableHead>
                        <TableHead className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1 h-8"
                            onClick={() => toggleSort('amount')}
                          >
                            {t('payments.amount')}
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPayments.map((payment) => {
                        const overdue = isOverdue(payment);
                        return (
                          <TableRow 
                            key={payment.id} 
                            className={`table-row-hover ${overdue ? 'bg-destructive/5' : ''}`}
                          >
                            <TableCell className="font-mono text-sm">
                              <div className="flex items-center gap-2">
                                {overdue && (
                                  <AlertCircle className="h-4 w-4 text-destructive" />
                                )}
                                {payment.reference || payment.invoice_id?.substring(0, 12) || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`font-medium ${language === 'bn' && payment.members?.name_bn ? 'font-bengali' : ''}`}>
                                {language === 'bn' && payment.members?.name_bn 
                                  ? payment.members.name_bn 
                                  : payment.members?.name || '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {payment.payment_date 
                                  ? format(new Date(payment.payment_date), 'MMM d, yyyy')
                                  : format(new Date(payment.created_at), 'MMM d, yyyy')}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {payment.period_month && payment.period_year
                                ? `${payment.period_month}/${payment.period_year}`
                                : '-'}
                            </TableCell>
                            <TableCell>
                              <PaymentMethodBadge 
                                method={payment.payment_method} 
                                type={payment.payment_type} 
                              />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ৳ {Number(payment.amount).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <PaymentStatusBadge status={payment.status} />
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="gap-2">
                                    <Eye className="h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  {payment.payment_type === 'online' && payment.status === 'pending' && (
                                    <DropdownMenuItem 
                                      className="gap-2"
                                      onClick={() => handleVerifyPayment(payment)}
                                      disabled={isVerifying}
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                      Verify Payment
                                    </DropdownMenuItem>
                                  )}
                                  {payment.status === 'failed' && (
                                    <DropdownMenuItem 
                                      className="gap-2"
                                      onClick={() => handleRetryPayment(payment)}
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                      Retry Payment
                                    </DropdownMenuItem>
                                  )}
                                  {payment.payment_type === 'online' && payment.invoice_id && payment.status === 'pending' && (
                                    <DropdownMenuItem className="gap-2">
                                      <ExternalLink className="h-4 w-4" />
                                      Copy Payment Link
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, filteredAndSortedPayments.length)} of {filteredAndSortedPayments.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => p - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </Tabs>
      </Card>

      {/* Create Payment Dialog */}
      <CreatePaymentDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        members={members}
        onCreateOfflinePayment={handleCreateOfflinePayment}
        onCreateOnlinePayment={handleCreateOnlinePayment}
        isSubmitting={isCreating}
      />
    </div>
  );
}
