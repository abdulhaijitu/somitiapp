import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileBarChart, 
  Download, 
  Calendar, 
  Users,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { DateRangeFilter } from '@/components/common/DateRangeFilter';
import { EmptyState } from '@/components/common/EmptyState';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';

interface ReportData {
  summary: {
    total_amount: number;
    total_count: number;
    by_method: Record<string, { count: number; amount: number }>;
    by_type: Record<string, { count: number; amount: number }>;
    by_month: Record<string, { count: number; amount: number }>;
  };
  payments: Array<{
    id: string;
    date: string;
    member_name: string;
    member_name_bn?: string;
    amount: number;
    method: string;
    type: string;
    period: string | null;
  }>;
}

interface Member {
  id: string;
  name: string;
  name_bn: string | null;
}

// Mock tenant_id
const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000000';

export function ReportsPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reportType, setReportType] = useState<'monthly' | 'yearly' | 'member'>('monthly');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState<Date | undefined>(endOfMonth(new Date()));
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [members, setMembers] = useState<Member[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    // Set default date range based on report type
    if (reportType === 'monthly') {
      setDateFrom(startOfMonth(new Date()));
      setDateTo(endOfMonth(new Date()));
    } else if (reportType === 'yearly') {
      setDateFrom(startOfYear(new Date()));
      setDateTo(new Date());
    }
  }, [reportType]);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, name, name_bn')
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

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: {
          report_type: reportType,
          tenant_id: MOCK_TENANT_ID,
          start_date: dateFrom?.toISOString(),
          end_date: dateTo?.toISOString(),
          member_id: selectedMember !== 'all' ? selectedMember : undefined,
          format: 'json'
        }
      });

      if (error) {
        console.error('Error generating report:', error);
        toast({
          title: 'Error',
          description: 'Failed to generate report',
          variant: 'destructive'
        });
        return;
      }

      if (!data.success) {
        toast({
          title: 'Error',
          description: data.error || 'Failed to generate report',
          variant: 'destructive'
        });
        return;
      }

      setReportData(data);
      toast({
        title: 'Report Generated',
        description: `Found ${data.summary.total_count} payments totaling ৳${data.summary.total_amount.toLocaleString()}`
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (exportFormat: 'csv' | 'pdf') => {
    setExporting(true);
    try {
      if (exportFormat === 'csv') {
        const { data, error } = await supabase.functions.invoke('generate-report', {
          body: {
            report_type: reportType,
            tenant_id: MOCK_TENANT_ID,
            start_date: dateFrom?.toISOString(),
            end_date: dateTo?.toISOString(),
            member_id: selectedMember !== 'all' ? selectedMember : undefined,
            format: 'csv'
          }
        });

        if (error) {
          throw error;
        }

        // Create download link
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Export Complete',
          description: 'CSV file downloaded successfully'
        });
      } else {
        // For PDF, we'd generate client-side for now
        toast({
          title: 'PDF Export',
          description: 'PDF export coming soon. Use CSV for now.',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export report',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDateRangeChange = (from: Date | undefined, to: Date | undefined) => {
    setDateFrom(from);
    setDateTo(to);
  };

  const sortedMonthlyData = useMemo(() => {
    if (!reportData?.summary.by_month) return [];
    return Object.entries(reportData.summary.by_month)
      .sort((a, b) => b[0].localeCompare(a[0]));
  }, [reportData]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            {t('nav.reports')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Generate and download financial reports
          </p>
        </div>
        {reportData && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 bg-gradient-primary hover:opacity-90" disabled={exporting}>
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export Report
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportReport('csv')} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Export as Excel (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportReport('pdf')} className="gap-2">
                <FileText className="h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Report Type Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card 
          className={`border-border hover:shadow-md transition-all cursor-pointer ${reportType === 'monthly' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setReportType('monthly')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Monthly Report</p>
                <p className="text-sm text-muted-foreground">Current month summary</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`border-border hover:shadow-md transition-all cursor-pointer ${reportType === 'yearly' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setReportType('yearly')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Yearly Report</p>
                <p className="text-sm text-muted-foreground">Annual financial summary</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`border-border hover:shadow-md transition-all cursor-pointer ${reportType === 'member' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setReportType('member')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
                <Users className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Member Report</p>
                <p className="text-sm text-muted-foreground">Per-member payment history</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Report Filters</CardTitle>
          <CardDescription>Configure your report parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Date Range</label>
              <DateRangeFilter
                from={dateFrom}
                to={dateTo}
                onRangeChange={handleDateRangeChange}
              />
            </div>

            {reportType === 'member' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Member</label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {language === 'bn' && member.name_bn ? member.name_bn : member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button onClick={generateReport} disabled={loading} className="gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {loading ? (
        <Card className="border-border">
          <CardContent className="py-8">
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
              <Skeleton className="h-64" />
            </div>
          </CardContent>
        </Card>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Total Amount</div>
                <div className="mt-1 text-2xl font-bold text-foreground">
                  ৳ {reportData.summary.total_amount.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Total Payments</div>
                <div className="mt-1 text-2xl font-bold text-primary">
                  {reportData.summary.total_count}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Online Payments</div>
                <div className="mt-1 text-2xl font-bold text-info">
                  ৳ {(reportData.summary.by_type['online']?.amount || 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">Offline Payments</div>
                <div className="mt-1 text-2xl font-bold text-muted-foreground">
                  ৳ {(reportData.summary.by_type['offline']?.amount || 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Tabs */}
          <Card className="border-border">
            <Tabs defaultValue="breakdown">
              <CardHeader className="pb-3">
                <TabsList>
                  <TabsTrigger value="breakdown">Monthly Breakdown</TabsTrigger>
                  <TabsTrigger value="methods">By Method</TabsTrigger>
                  <TabsTrigger value="transactions">All Transactions</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="breakdown" className="mt-0">
                  {sortedMonthlyData.length === 0 ? (
                    <EmptyState
                      icon={<Calendar className="h-8 w-8" />}
                      title="No monthly data"
                      description="No payment data found for the selected period"
                    />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead className="text-right">Payments</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedMonthlyData.map(([month, data]) => (
                          <TableRow key={month}>
                            <TableCell className="font-medium">{month}</TableCell>
                            <TableCell className="text-right">{data.count}</TableCell>
                            <TableCell className="text-right font-medium">
                              ৳ {data.amount.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="methods" className="mt-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Method</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(reportData.summary.by_method).map(([method, data]) => (
                        <TableRow key={method}>
                          <TableCell className="font-medium capitalize">{method}</TableCell>
                          <TableCell className="text-right">{data.count}</TableCell>
                          <TableCell className="text-right font-medium">
                            ৳ {data.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="transactions" className="mt-0">
                  {reportData.payments.length === 0 ? (
                    <EmptyState
                      icon={<FileBarChart className="h-8 w-8" />}
                      title="No transactions"
                      description="No payment transactions found for the selected period"
                    />
                  ) : (
                    <div className="max-h-[400px] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-card">
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Member</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell className="text-muted-foreground">
                                {format(new Date(payment.date), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell className={language === 'bn' && payment.member_name_bn ? 'font-bengali' : ''}>
                                {language === 'bn' && payment.member_name_bn 
                                  ? payment.member_name_bn 
                                  : payment.member_name}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {payment.period || '-'}
                              </TableCell>
                              <TableCell className="capitalize">{payment.method}</TableCell>
                              <TableCell className="text-right font-medium">
                                ৳ {payment.amount.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      ) : (
        <Card className="border-border">
          <CardContent className="py-12">
            <EmptyState
              icon={<FileBarChart className="h-8 w-8" />}
              title="Generate a Report"
              description="Select a report type, configure filters, and click Generate Report to view financial data"
              actionLabel="Generate Monthly Report"
              onAction={generateReport}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
