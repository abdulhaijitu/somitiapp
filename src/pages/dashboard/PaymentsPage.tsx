import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  Calendar,
  Filter,
  Download
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

// Mock payment data
const payments = [
  { 
    id: '1', 
    member: 'আব্দুল করিম',
    memberEn: 'Abdul Karim',
    amount: 1000, 
    date: '2024-01-15',
    method: 'offline',
    status: 'paid',
    reference: 'PAY-001'
  },
  { 
    id: '2', 
    member: 'ফাতেমা বেগম',
    memberEn: 'Fatema Begum',
    amount: 1000, 
    date: '2024-01-14',
    method: 'online',
    status: 'paid',
    reference: 'PAY-002'
  },
  { 
    id: '3', 
    member: 'মোহাম্মদ আলী',
    memberEn: 'Mohammad Ali',
    amount: 500, 
    date: '2024-01-13',
    method: 'offline',
    status: 'partial',
    reference: 'PAY-003'
  },
  { 
    id: '4', 
    member: 'নূরজাহান খাতুন',
    memberEn: 'Nurjahan Khatun',
    amount: 1000, 
    date: '2024-01-12',
    method: 'offline',
    status: 'paid',
    reference: 'PAY-004'
  },
  { 
    id: '5', 
    member: 'রহিম উদ্দিন',
    memberEn: 'Rahim Uddin',
    amount: 0, 
    date: '2024-01-11',
    method: '-',
    status: 'pending',
    reference: '-'
  },
];

export function PaymentsPage() {
  const { t, language } = useLanguage();

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
          <Button className="gap-2 bg-gradient-primary hover:opacity-90">
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
            <div className="mt-1 text-2xl font-bold text-foreground">৳ 1,45,000</div>
            <div className="mt-1 text-xs text-success">+12% from last month</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Collected</div>
            <div className="mt-1 text-2xl font-bold text-foreground">৳ 4,52,000</div>
            <div className="mt-1 text-xs text-muted-foreground">This year</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Outstanding</div>
            <div className="mt-1 text-2xl font-bold text-destructive">৳ 23,500</div>
            <div className="mt-1 text-xs text-muted-foreground">15 members</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and table */}
      <Card className="border-border">
        <Tabs defaultValue="all" className="w-full">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="paid">{t('payments.paid')}</TabsTrigger>
                <TabsTrigger value="pending">{t('payments.pending')}</TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder={t('common.search')} className="w-64 pl-9" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <TabsContent value="all" className="m-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Reference</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>{t('payments.date')}</TableHead>
                      <TableHead>{t('payments.method')}</TableHead>
                      <TableHead className="text-right">{t('payments.amount')}</TableHead>
                      <TableHead>{t('members.status')}</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id} className="table-row-hover">
                        <TableCell className="font-mono text-sm">
                          {payment.reference}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium font-bengali">
                            {language === 'bn' ? payment.member : payment.memberEn}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {payment.date}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            payment.method === 'online'
                              ? 'bg-info/10 text-info'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {payment.method === 'online' ? t('payments.online') : payment.method === 'offline' ? t('payments.offline') : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ৳ {payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              payment.status === 'paid'
                                ? 'bg-success/10 text-success'
                                : payment.status === 'partial'
                                ? 'bg-warning/10 text-warning'
                                : 'bg-destructive/10 text-destructive'
                            }`}
                          >
                            {payment.status === 'paid' 
                              ? t('payments.paid') 
                              : payment.status === 'partial' 
                              ? 'Partial' 
                              : t('payments.pending')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>{t('common.edit')}</DropdownMenuItem>
                              <DropdownMenuItem>Print Receipt</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="paid" className="m-0">
              <div className="p-8 text-center text-muted-foreground">
                Showing only paid transactions
              </div>
            </TabsContent>
            <TabsContent value="pending" className="m-0">
              <div className="p-8 text-center text-muted-foreground">
                Showing only pending transactions
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
