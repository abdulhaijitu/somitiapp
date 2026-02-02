import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { 
  Search, 
  RefreshCw,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addMonths, differenceInDays } from 'date-fns';

interface Subscription {
  id: string;
  tenant_id: string;
  plan: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  tenants: {
    id: string;
    name: string;
    subdomain: string;
    status: string;
  };
}

export function SubscriptionsManagementPage() {
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isExtendOpen, setIsExtendOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [extensionMonths, setExtensionMonths] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, tenants!inner(id, name, subdomain, status)')
        .neq('tenants.status', 'deleted')
        .order('end_date', { ascending: true });

      if (error) {
        console.error('Error loading subscriptions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load subscriptions',
          variant: 'destructive'
        });
        return;
      }

      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtendSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      setIsSubmitting(true);

      const currentEndDate = new Date(selectedSubscription.end_date);
      const now = new Date();
      const baseDate = currentEndDate > now ? currentEndDate : now;
      const newEndDate = addMonths(baseDate, extensionMonths);

      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          end_date: newEndDate.toISOString(),
          status: 'active'
        })
        .eq('id', selectedSubscription.id);

      if (error) {
        console.error('Error extending subscription:', error);
        toast({
          title: 'Error',
          description: 'Failed to extend subscription',
          variant: 'destructive'
        });
        return;
      }

      // Log the action
      await supabase.from('audit_logs').insert({
        action: 'EXTEND_SUBSCRIPTION',
        entity_type: 'subscription',
        entity_id: selectedSubscription.id,
        details: { 
          tenant_name: selectedSubscription.tenants.name,
          previous_end_date: selectedSubscription.end_date,
          new_end_date: newEndDate.toISOString(),
          months_extended: extensionMonths
        }
      });

      toast({
        title: 'Success',
        description: `Subscription extended by ${extensionMonths} month(s)`
      });

      setIsExtendOpen(false);
      setSelectedSubscription(null);
      setExtensionMonths(1);
      loadSubscriptions();

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (subscription: Subscription) => {
    const now = new Date();
    const endDate = new Date(subscription.end_date);
    const daysRemaining = differenceInDays(endDate, now);

    if (subscription.status === 'expired' || daysRemaining < 0) {
      return (
        <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">
          <XCircle className="mr-1 h-3 w-3" />
          Expired
        </Badge>
      );
    }

    if (daysRemaining <= 7) {
      return (
        <Badge className="bg-warning/10 text-warning hover:bg-warning/20">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Expiring Soon
        </Badge>
      );
    }

    return (
      <Badge className="bg-success/10 text-success hover:bg-success/20">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        Active
      </Badge>
    );
  };

  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(new Date(endDate), new Date());
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Expires today';
    if (days === 1) return '1 day remaining';
    return `${days} days remaining`;
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.tenants.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.tenants.subdomain.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const now = new Date();
    const endDate = new Date(sub.end_date);
    const daysRemaining = differenceInDays(endDate, now);
    
    if (statusFilter === 'active') return matchesSearch && daysRemaining > 7;
    if (statusFilter === 'expiring') return matchesSearch && daysRemaining >= 0 && daysRemaining <= 7;
    if (statusFilter === 'expired') return matchesSearch && daysRemaining < 0;
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
        <SkeletonLoader variant="card" count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
          Subscription Management
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage and extend tenant subscriptions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-success/30 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {subscriptions.filter(s => differenceInDays(new Date(s.end_date), new Date()) > 7).length}
                </p>
                <p className="text-sm text-muted-foreground">Active Subscriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {subscriptions.filter(s => {
                    const days = differenceInDays(new Date(s.end_date), new Date());
                    return days >= 0 && days <= 7;
                  }).length}
                </p>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {subscriptions.filter(s => differenceInDays(new Date(s.end_date), new Date()) < 0).length}
                </p>
                <p className="text-sm text-muted-foreground">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by tenant name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadSubscriptions}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions table */}
      <Card className="border-border overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            All Subscriptions ({filteredSubscriptions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSubscriptions.length === 0 ? (
            <div className="py-12 text-center">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No subscriptions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[250px]">Tenant</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Time Remaining</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id} className="table-row-hover">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                            {subscription.tenants.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {subscription.tenants.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {subscription.tenants.subdomain}.somiti.app
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {subscription.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(subscription)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(subscription.start_date), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(subscription.end_date), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className={
                            differenceInDays(new Date(subscription.end_date), new Date()) < 0
                              ? 'text-destructive'
                              : differenceInDays(new Date(subscription.end_date), new Date()) <= 7
                              ? 'text-warning'
                              : 'text-muted-foreground'
                          }>
                            {getDaysRemaining(subscription.end_date)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setIsExtendOpen(true);
                          }}
                          className="gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          Extend
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extend Subscription Dialog */}
      <Dialog open={isExtendOpen} onOpenChange={setIsExtendOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Extend Subscription</DialogTitle>
            <DialogDescription>
              Extend the subscription for {selectedSubscription?.tenants.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-border p-4 bg-muted/30">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current End Date:</span>
                  <span className="font-medium">
                    {selectedSubscription && format(new Date(selectedSubscription.end_date), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New End Date:</span>
                  <span className="font-medium text-primary">
                    {selectedSubscription && format(
                      addMonths(
                        new Date(selectedSubscription.end_date) > new Date() 
                          ? new Date(selectedSubscription.end_date)
                          : new Date(),
                        extensionMonths
                      ),
                      'MMM d, yyyy'
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Extension Period</Label>
              <Select 
                value={extensionMonths.toString()}
                onValueChange={(value) => setExtensionMonths(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Month</SelectItem>
                  <SelectItem value="3">3 Months</SelectItem>
                  <SelectItem value="6">6 Months</SelectItem>
                  <SelectItem value="12">12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExtendOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExtendSubscription}
              disabled={isSubmitting}
              className="bg-gradient-primary hover:opacity-90"
            >
              {isSubmitting ? 'Extending...' : 'Extend Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
