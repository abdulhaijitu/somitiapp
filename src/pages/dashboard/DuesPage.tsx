import { useState, useEffect, useMemo } from 'react';
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
  Clock
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
  const { tenant } = useTenant();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [dues, setDues] = useState<Due[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (tenant?.id) {
      loadDues();
    }
  }, [tenant?.id, selectedMonth]);

  const loadDues = async () => {
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
        .eq('due_month', selectedMonth)
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
  };

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

  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = format(date, 'yyyy-MM-dd');
      const month = months[date.getMonth()];
      options.push({
        value,
        label: `${language === 'bn' ? month.labelBn : month.label} ${date.getFullYear()}`
      });
    }
    return options.reverse();
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

  const selectedMonthDate = new Date(selectedMonth);

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
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={loadDues}>
            <RefreshCw className="h-4 w-4" />
            {language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {language === 'bn' ? 'এক্সপোর্ট' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              {language === 'bn' ? 'মোট বকেয়া' : 'Total Due'}
            </div>
            <div className="mt-1 text-2xl font-bold">
              ৳{stats.totalAmount.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {stats.total} {language === 'bn' ? 'সদস্য' : 'members'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {language === 'bn' ? 'বাকি' : 'Unpaid'}
            </div>
            <div className="mt-1 text-2xl font-bold text-destructive">
              {stats.unpaid}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              ৳{(stats.totalAmount - stats.paidAmount).toLocaleString()} {language === 'bn' ? 'বাকি' : 'remaining'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-warning">
              <Clock className="h-4 w-4" />
              {language === 'bn' ? 'আংশিক' : 'Partial'}
            </div>
            <div className="mt-1 text-2xl font-bold text-warning">
              {stats.partial}
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/20 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle className="h-4 w-4" />
              {language === 'bn' ? 'পরিশোধিত' : 'Paid'}
            </div>
            <div className="mt-1 text-2xl font-bold text-success">
              {stats.paid}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              ৳{stats.paidAmount.toLocaleString()} {language === 'bn' ? 'আদায়' : 'collected'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
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

              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getMonthOptions().map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={language === 'bn' ? 'সব স্ট্যাটাস' : 'All Status'} />
                </SelectTrigger>
                <SelectContent>
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
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'bn' ? 'সদস্য' : 'Member'}</TableHead>
                  <TableHead>{language === 'bn' ? 'মাস' : 'Month'}</TableHead>
                  <TableHead className="text-right">{language === 'bn' ? 'পরিমাণ' : 'Amount'}</TableHead>
                  <TableHead className="text-right">{language === 'bn' ? 'পরিশোধিত' : 'Paid'}</TableHead>
                  <TableHead className="text-right">{language === 'bn' ? 'বাকি' : 'Remaining'}</TableHead>
                  <TableHead>{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</TableHead>
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

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
    </div>
  );
}
