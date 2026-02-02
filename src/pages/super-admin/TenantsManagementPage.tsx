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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  Building2,
  CheckCircle2,
  XCircle,
  Trash2,
  RefreshCw,
  Filter,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addMonths } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

interface Tenant {
  id: string;
  name: string;
  name_bn: string | null;
  subdomain: string;
  default_language: string;
  status: string;
  created_at: string;
  updated_at: string;
  subscriptions: {
    id: string;
    plan: string;
    status: string;
    start_date: string;
    end_date: string;
  } | null;
}

export function TenantsManagementPage() {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [confirmAction, setConfirmAction] = useState<'suspend' | 'activate' | 'delete' | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_bn: '',
    subdomain: '',
    default_language: 'en',
    subscription_months: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadTenants();
    
    // Check if we should open create dialog
    if (searchParams.get('action') === 'create') {
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tenants')
        .select('*, subscriptions(*)')
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tenants:', error);
        toast({
          title: 'Error',
          description: 'Failed to load tenants',
          variant: 'destructive'
        });
        return;
      }

      setTenants(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!formData.name || !formData.subdomain) {
      toast({
        title: 'Validation Error',
        description: 'Name and subdomain are required',
        variant: 'destructive'
      });
      return;
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(formData.subdomain)) {
      toast({
        title: 'Validation Error',
        description: 'Subdomain must contain only lowercase letters, numbers, and hyphens',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: formData.name,
          name_bn: formData.name_bn || null,
          subdomain: formData.subdomain.toLowerCase(),
          default_language: formData.default_language,
          status: 'active'
        })
        .select()
        .single();

      if (tenantError) {
        if (tenantError.code === '23505') {
          toast({
            title: 'Error',
            description: 'This subdomain is already taken',
            variant: 'destructive'
          });
        } else {
          console.error('Error creating tenant:', tenantError);
          toast({
            title: 'Error',
            description: 'Failed to create tenant',
            variant: 'destructive'
          });
        }
        return;
      }

      // Create subscription
      const startDate = new Date();
      const endDate = addMonths(startDate, formData.subscription_months);

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          tenant_id: tenant.id,
          plan: 'standard',
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        });

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
        // Delete the tenant if subscription creation fails
        await supabase.from('tenants').delete().eq('id', tenant.id);
        toast({
          title: 'Error',
          description: 'Failed to create subscription',
          variant: 'destructive'
        });
        return;
      }

      // Log the action
      await supabase.from('audit_logs').insert({
        action: 'CREATE_TENANT',
        entity_type: 'tenant',
        entity_id: tenant.id,
        details: { 
          name: formData.name, 
          subdomain: formData.subdomain,
          subscription_months: formData.subscription_months
        }
      });

      toast({
        title: 'Success',
        description: 'Tenant created successfully'
      });

      setIsCreateOpen(false);
      setFormData({
        name: '',
        name_bn: '',
        subdomain: '',
        default_language: 'en',
        subscription_months: 1
      });
      loadTenants();

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedTenant || !confirmAction) return;

    try {
      setIsSubmitting(true);

      let newStatus: 'active' | 'suspended' | 'deleted';
      let actionName: string;

      switch (confirmAction) {
        case 'suspend':
          newStatus = 'suspended';
          actionName = 'SUSPEND_TENANT';
          break;
        case 'activate':
          newStatus = 'active';
          actionName = 'ACTIVATE_TENANT';
          break;
        case 'delete':
          newStatus = 'deleted';
          actionName = 'DELETE_TENANT';
          break;
        default:
          return;
      }

      const { error } = await supabase
        .from('tenants')
        .update({ 
          status: newStatus,
          deleted_at: confirmAction === 'delete' ? new Date().toISOString() : null
        })
        .eq('id', selectedTenant.id);

      if (error) {
        console.error('Error updating tenant:', error);
        toast({
          title: 'Error',
          description: 'Failed to update tenant status',
          variant: 'destructive'
        });
        return;
      }

      // Log the action
      await supabase.from('audit_logs').insert({
        action: actionName,
        entity_type: 'tenant',
        entity_id: selectedTenant.id,
        details: { 
          name: selectedTenant.name, 
          previous_status: selectedTenant.status,
          new_status: newStatus
        }
      });

      toast({
        title: 'Success',
        description: `Tenant ${confirmAction === 'delete' ? 'deleted' : confirmAction === 'suspend' ? 'suspended' : 'activated'} successfully`
      });

      setIsConfirmOpen(false);
      setSelectedTenant(null);
      setConfirmAction(null);
      loadTenants();

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openConfirmDialog = (tenant: Tenant, action: 'suspend' | 'activate' | 'delete') => {
    setSelectedTenant(tenant);
    setConfirmAction(action);
    setIsConfirmOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success hover:bg-success/20">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.subdomain.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <SkeletonLoader variant="card" count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            Tenant Management
          </h1>
          <p className="mt-1 text-muted-foreground">
            Create and manage all somiti organizations
          </p>
        </div>
        <Button 
          className="gap-2 bg-gradient-primary hover:opacity-90"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Create Tenant
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or subdomain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadTenants}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tenants table */}
      <Card className="border-border overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            All Tenants ({filteredTenants.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTenants.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No tenants found</p>
              <Button 
                className="mt-4 gap-2"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Create First Tenant
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[250px]">Organization</TableHead>
                    <TableHead>Subdomain</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id} className="table-row-hover">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                            {tenant.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{tenant.name}</p>
                            {tenant.name_bn && (
                              <p className="text-xs text-muted-foreground font-bengali">
                                {tenant.name_bn}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-sm">
                          {tenant.subdomain}.somiti.app
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          {tenant.default_language === 'bn' ? 'বাংলা' : 'English'}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                      <TableCell>
                        {tenant.subscriptions ? (
                          <div>
                            <p className="text-sm font-medium">{tenant.subscriptions.plan}</p>
                            <p className="text-xs text-muted-foreground">
                              Expires: {format(new Date(tenant.subscriptions.end_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No subscription</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(tenant.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {tenant.status === 'active' ? (
                              <DropdownMenuItem 
                                onClick={() => openConfirmDialog(tenant, 'suspend')}
                                className="text-warning"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Suspend
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => openConfirmDialog(tenant, 'activate')}
                                className="text-success"
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => openConfirmDialog(tenant, 'delete')}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Tenant Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Tenant</DialogTitle>
            <DialogDescription>
              Set up a new somiti organization with subscription
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  placeholder="ABC Somiti"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_bn">Name (Bangla)</Label>
                <Input
                  id="name_bn"
                  placeholder="এবিসি সমিতি"
                  className="font-bengali"
                  value={formData.name_bn}
                  onChange={(e) => setFormData({ ...formData, name_bn: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="subdomain"
                  placeholder="abc-somiti"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  })}
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">.somiti.app</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Only lowercase letters, numbers, and hyphens allowed
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Default Language</Label>
                <Select 
                  value={formData.default_language}
                  onValueChange={(value) => setFormData({ ...formData, default_language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="bn">বাংলা (Bangla)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Initial Subscription</Label>
                <Select 
                  value={formData.subscription_months.toString()}
                  onValueChange={(value) => setFormData({ ...formData, subscription_months: parseInt(value) })}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTenant}
              disabled={isSubmitting}
              className="bg-gradient-primary hover:opacity-90"
            >
              {isSubmitting ? 'Creating...' : 'Create Tenant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === 'delete' 
                ? 'Delete Tenant?' 
                : confirmAction === 'suspend' 
                ? 'Suspend Tenant?' 
                : 'Activate Tenant?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'delete' && (
                <>
                  This will soft-delete <strong>{selectedTenant?.name}</strong>. 
                  The data will be retained but the tenant will no longer be accessible.
                </>
              )}
              {confirmAction === 'suspend' && (
                <>
                  This will suspend <strong>{selectedTenant?.name}</strong>. 
                  Users will not be able to access their account until reactivated.
                </>
              )}
              {confirmAction === 'activate' && (
                <>
                  This will activate <strong>{selectedTenant?.name}</strong>. 
                  Users will regain access to their account.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              disabled={isSubmitting}
              className={confirmAction === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {isSubmitting ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
