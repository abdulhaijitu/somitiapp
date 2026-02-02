import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  RefreshCw,
  FileText,
  Building2,
  UserPlus,
  Power,
  CreditCard,
  Trash2,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: unknown;
  ip_address: string | null;
  created_at: string;
}

export function AuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading audit logs:', error);
        return;
      }

      setLogs(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE_TENANT':
        return <UserPlus className="h-4 w-4 text-success" />;
      case 'SUSPEND_TENANT':
      case 'ACTIVATE_TENANT':
        return <Power className="h-4 w-4 text-warning" />;
      case 'DELETE_TENANT':
        return <Trash2 className="h-4 w-4 text-destructive" />;
      case 'EXTEND_SUBSCRIPTION':
        return <CreditCard className="h-4 w-4 text-info" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionBadge = (action: string) => {
    const actionLabels: Record<string, { label: string; variant: string }> = {
      'CREATE_TENANT': { label: 'Created Tenant', variant: 'success' },
      'SUSPEND_TENANT': { label: 'Suspended Tenant', variant: 'warning' },
      'ACTIVATE_TENANT': { label: 'Activated Tenant', variant: 'success' },
      'DELETE_TENANT': { label: 'Deleted Tenant', variant: 'destructive' },
      'EXTEND_SUBSCRIPTION': { label: 'Extended Subscription', variant: 'info' },
      'UPDATE_SUBSCRIPTION': { label: 'Updated Subscription', variant: 'info' },
    };

    const config = actionLabels[action] || { label: action, variant: 'default' };
    
    const variantClasses: Record<string, string> = {
      success: 'bg-success/10 text-success',
      warning: 'bg-warning/10 text-warning',
      destructive: 'bg-destructive/10 text-destructive',
      info: 'bg-info/10 text-info',
      default: 'bg-muted text-muted-foreground'
    };

    return (
      <Badge className={variantClasses[config.variant]}>
        {config.label}
      </Badge>
    );
  };

  const formatDetails = (details: unknown) => {
    if (!details || typeof details !== 'object') return '-';
    
    const d = details as Record<string, unknown>;
    const parts: string[] = [];
    
    if (d.name) parts.push(`Name: ${d.name}`);
    if (d.tenant_name) parts.push(`Tenant: ${d.tenant_name}`);
    if (d.subdomain) parts.push(`Subdomain: ${d.subdomain}`);
    if (d.previous_status && d.new_status) {
      parts.push(`${d.previous_status} → ${d.new_status}`);
    }
    if (d.months_extended) {
      parts.push(`Extended by ${d.months_extended} month(s)`);
    }
    
    return parts.join(' • ') || JSON.stringify(details);
  };

  const uniqueActions = [...new Set(logs.map(log => log.action))];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details && JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <SkeletonLoader variant="card" count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
          Audit Logs
        </h1>
        <p className="mt-1 text-muted-foreground">
          Track all super admin actions and system changes
        </p>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadAuditLogs}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit logs table */}
      <Card className="border-border overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Recent Activity ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="table-row-hover">
                      <TableCell>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          {getActionIcon(log.action)}
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{log.entity_type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <p className="truncate text-sm text-muted-foreground">
                          {formatDetails(log.details)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">
                            {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
