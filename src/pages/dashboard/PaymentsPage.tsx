import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  ExternalLink,
  Eye
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useOnlinePayment } from '@/hooks/useOnlinePayment';
import { CreatePaymentDialog } from '@/components/payments/CreatePaymentDialog';
import { PaymentStatusBadge } from '@/components/payments/PaymentStatusBadge';
import { PaymentMethodBadge } from '@/components/payments/PaymentMethodBadge';
import { format } from 'date-fns';

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
  monthly_amount: number | null;
}

// Mock tenant_id for now - in production this would come from context
const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000000';

export function PaymentsPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { createPayment, verifyPayment, redirectToPayment, isCreating, isVerifying } = useOnlinePayment();
  
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [stats, setStats] = useState({
    thisMonth: 0,
    totalCollected: 0,
    outstanding: 0,
    pendingCount: 0
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
        .limit(100);

      if (error) {
        console.error('Error loading payments:', error);
        // Show mock data if no real data
        return;
      }

      setPayments(data || []);

      // Calculate stats
      const now = new Date();
      const thisMonthPayments = (data || []).filter(p => {
        const date = new Date(p.payment_date || p.created_at);
        return date.getMonth() === now.getMonth() && 
               date.getFullYear() === now.getFullYear() &&
               p.status === 'paid';
      });
      
      const totalPaid = (data || [])
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      
      const pendingPayments = (data || []).filter(p => p.status === 'pending');

      setStats({
        thisMonth: thisMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0),
        totalCollected: totalPaid,
        outstanding: pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0),
        pendingCount: pendingPayments.length
      });

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, name, name_bn, email, monthly_amount')
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
  }) => {
    try {
      const reference = `OFF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      const { error } = await supabase
        .from('payments')
        .insert({
          tenant_id: MOCK_TENANT_ID,
          member_id: data.member_id,
          amount: data.amount,
          payment_type: 'offline',
          payment_method: 'offline',
          status: 'paid',
          reference,
          period_month: data.period_month,
          period_year: data.period_year,
          payment_date: new Date().toISOString(),
          notes: data.notes
        });

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to record payment',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Offline payment recorded successfully'
      });

      setIsCreateOpen(false);
      loadPayments();

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
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
  }) => {
    const result = await createPayment({
      tenant_id: MOCK_TENANT_ID,
      member_id: data.member_id,
      amount: data.amount,
      period_month: data.period_month,
      period_year: data.period_year,
      full_name: data.full_name,
      email: data.email
    });

    if (result.success && result.payment_url) {
      setIsCreateOpen(false);
      // Redirect to payment page
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

  const filteredPayments = payments.filter(payment => {
    const memberName = payment.members?.name?.toLowerCase() || '';
    const memberNameBn = payment.members?.name_bn?.toLowerCase() || '';
    const reference = payment.reference?.toLowerCase() || '';
    
    const matchesSearch = 
      memberName.includes(searchQuery.toLowerCase()) ||
      memberNameBn.includes(searchQuery.toLowerCase()) ||
      reference.includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
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
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">This Month</div>
            <div className="mt-1 text-2xl font-bold text-foreground">
              ৳ {stats.thisMonth.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-success">+12% from last month</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Collected</div>
            <div className="mt-1 text-2xl font-bold text-foreground">
              ৳ {stats.totalCollected.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">This year</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Outstanding</div>
            <div className="mt-1 text-2xl font-bold text-destructive">
              ৳ {stats.outstanding.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{stats.pendingCount} pending</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and table */}
      <Card className="border-border">
        <Tabs defaultValue="all" className="w-full" onValueChange={setStatusFilter}>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="paid">{t('payments.paid')}</TabsTrigger>
                <TabsTrigger value="pending">{t('payments.pending')}</TabsTrigger>
                <TabsTrigger value="failed">Failed</TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder={t('common.search')} 
                    className="w-64 pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" onClick={loadPayments}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <TabsContent value="all" className="m-0">
              <PaymentsTable 
                payments={filteredPayments} 
                language={language}
                onVerify={handleVerifyPayment}
                isVerifying={isVerifying}
                t={t}
              />
            </TabsContent>
            <TabsContent value="paid" className="m-0">
              <PaymentsTable 
                payments={filteredPayments} 
                language={language}
                onVerify={handleVerifyPayment}
                isVerifying={isVerifying}
                t={t}
              />
            </TabsContent>
            <TabsContent value="pending" className="m-0">
              <PaymentsTable 
                payments={filteredPayments} 
                language={language}
                onVerify={handleVerifyPayment}
                isVerifying={isVerifying}
                t={t}
              />
            </TabsContent>
            <TabsContent value="failed" className="m-0">
              <PaymentsTable 
                payments={filteredPayments} 
                language={language}
                onVerify={handleVerifyPayment}
                isVerifying={isVerifying}
                t={t}
              />
            </TabsContent>
          </CardContent>
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

// Separated table component for reuse
function PaymentsTable({ 
  payments, 
  language, 
  onVerify,
  isVerifying,
  t 
}: { 
  payments: Payment[];
  language: string;
  onVerify: (payment: Payment) => void;
  isVerifying: boolean;
  t: (key: string) => string;
}) {
  if (payments.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No payments found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Reference</TableHead>
            <TableHead>Member</TableHead>
            <TableHead>{t('payments.date')}</TableHead>
            <TableHead>{t('payments.method')}</TableHead>
            <TableHead className="text-right">{t('payments.amount')}</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id} className="table-row-hover">
              <TableCell className="font-mono text-sm">
                {payment.reference || payment.invoice_id?.substring(0, 12) || '-'}
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
                      <>
                        <DropdownMenuItem 
                          className="gap-2"
                          onClick={() => onVerify(payment)}
                          disabled={isVerifying}
                        >
                          <RefreshCw className="h-4 w-4" />
                          Verify Payment
                        </DropdownMenuItem>
                        {payment.invoice_id && (
                          <DropdownMenuItem className="gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Resend Link
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
