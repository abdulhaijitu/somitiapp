import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  Phone,
  User,
  Filter,
  ArrowUpDown,
  UserPlus,
  RefreshCw,
  Eye,
  Edit,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { MemberStatusBadge } from '@/components/members/MemberStatusBadge';
import { CreateMemberDialog } from '@/components/members/CreateMemberDialog';
import { EditMemberDialog } from '@/components/members/EditMemberDialog';
import { MemberProfileSheet } from '@/components/members/MemberProfileSheet';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataTableSkeleton } from '@/components/common/DataTableSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { format } from 'date-fns';

interface Member {
  id: string;
  name: string;
  name_bn: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  monthly_amount: number | null;
  member_number: string | null;
  status: string;
  joined_at: string | null;
  created_at: string;
  tenant_id: string;
  total_paid?: number;
  dues?: number;
}

// Mock tenant_id for now
const MOCK_TENANT_ID = '00000000-0000-0000-0000-000000000000';

const PAGE_SIZE = 20;

export function MembersPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'joined_at' | 'dues'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [confirmAction, setConfirmAction] = useState<'activate' | 'deactivate' | 'suspend' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      
      const { data: membersData, error } = await supabase
        .from('members')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading members:', error);
        return;
      }

      // Get payment stats for each member
      const memberIds = (membersData || []).map(m => m.id);
      
      if (memberIds.length > 0) {
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('member_id, amount, status')
          .in('member_id', memberIds);

        const paymentsByMember = (paymentsData || []).reduce((acc, p) => {
          if (!acc[p.member_id]) {
            acc[p.member_id] = { paid: 0, pending: 0 };
          }
          if (p.status === 'paid') {
            acc[p.member_id].paid += Number(p.amount);
          } else if (p.status === 'pending') {
            acc[p.member_id].pending += Number(p.amount);
          }
          return acc;
        }, {} as Record<string, { paid: number; pending: number }>);

        const enrichedMembers = (membersData || []).map(m => ({
          ...m,
          total_paid: paymentsByMember[m.id]?.paid || 0,
          dues: paymentsByMember[m.id]?.pending || 0
        }));

        setMembers(enrichedMembers);
      } else {
        setMembers(membersData || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async (data: {
    name: string;
    name_bn?: string;
    phone?: string;
    email?: string;
    address?: string;
    monthly_amount: number;
  }) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('members')
        .insert({
          tenant_id: MOCK_TENANT_ID,
          name: data.name,
          name_bn: data.name_bn,
          phone: data.phone,
          email: data.email,
          address: data.address,
          monthly_amount: data.monthly_amount,
          status: 'active'
        });

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to create member',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Member created successfully'
      });

      setIsCreateOpen(false);
      loadMembers();
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

  const handleEditMember = async (id: string, data: {
    name: string;
    name_bn?: string;
    phone?: string;
    email?: string;
    address?: string;
    monthly_amount: number;
    status: string;
  }) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('members')
        .update({
          name: data.name,
          name_bn: data.name_bn,
          phone: data.phone,
          email: data.email,
          address: data.address,
          monthly_amount: data.monthly_amount,
          status: data.status
        })
        .eq('id', id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update member',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Member updated successfully'
      });

      setIsEditOpen(false);
      setSelectedMember(null);
      loadMembers();
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
    if (!selectedMember || !confirmAction) return;

    setIsSubmitting(true);
    try {
      const newStatus = confirmAction === 'activate' ? 'active' 
        : confirmAction === 'deactivate' ? 'inactive' 
        : 'suspended';

      const { error } = await supabase
        .from('members')
        .update({ status: newStatus })
        .eq('id', selectedMember.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update member status',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Success',
        description: `Member ${confirmAction}d successfully`
      });

      setIsConfirmOpen(false);
      setSelectedMember(null);
      setConfirmAction(null);
      loadMembers();
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

  const openStatusConfirm = (member: Member, action: 'activate' | 'deactivate' | 'suspend') => {
    setSelectedMember(member);
    setConfirmAction(action);
    setIsConfirmOpen(true);
  };

  const openProfile = (member: Member) => {
    setSelectedMember(member);
    setIsProfileOpen(true);
  };

  const openEdit = (member: Member) => {
    setSelectedMember(member);
    setIsProfileOpen(false);
    setIsEditOpen(true);
  };

  // Filtering and sorting
  const filteredAndSortedMembers = useMemo(() => {
    let result = [...members];

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(m => m.status === statusFilter);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.name.toLowerCase().includes(query) ||
        m.name_bn?.toLowerCase().includes(query) ||
        m.phone?.includes(query) ||
        m.email?.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'joined_at') {
        comparison = new Date(a.joined_at || a.created_at).getTime() - new Date(b.joined_at || b.created_at).getTime();
      } else if (sortBy === 'dues') {
        comparison = (a.dues || 0) - (b.dues || 0);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [members, statusFilter, searchQuery, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedMembers.length / PAGE_SIZE);
  const paginatedMembers = filteredAndSortedMembers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const toggleSort = (column: 'name' | 'joined_at' | 'dues') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const stats = useMemo(() => ({
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    inactive: members.filter(m => m.status === 'inactive').length,
    suspended: members.filter(m => m.status === 'suspended').length,
    totalDues: members.reduce((sum, m) => sum + (m.dues || 0), 0)
  }), [members]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
            {t('members.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage all your somiti members
          </p>
        </div>
        <Button 
          className="gap-2 bg-gradient-primary hover:opacity-90"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          {t('members.addMember')}
        </Button>
      </div>

      {/* Stats summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Members</div>
            <div className="mt-1 text-2xl font-bold text-foreground">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Active</div>
            <div className="mt-1 text-2xl font-bold text-success">{stats.active}</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Inactive</div>
            <div className="mt-1 text-2xl font-bold text-muted-foreground">{stats.inactive}</div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Dues</div>
            <div className="mt-1 text-2xl font-bold text-destructive">৳ {stats.totalDues.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main table card */}
      <Card className="border-border overflow-hidden">
        <Tabs defaultValue="all" className="w-full" onValueChange={(v) => {
          setStatusFilter(v);
          setCurrentPage(1);
        }}>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <TabsList>
                <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
                <TabsTrigger value="inactive">Inactive ({stats.inactive})</TabsTrigger>
                <TabsTrigger value="suspended">Suspended ({stats.suspended})</TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                <div className="relative flex-1 lg:w-64">
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
                <Button variant="outline" size="icon" onClick={loadMembers}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4">
                <DataTableSkeleton columns={7} rows={5} />
              </div>
            ) : paginatedMembers.length === 0 ? (
              <EmptyState 
                icon={UserPlus}
                title="No members found"
                description={searchQuery ? "Try adjusting your search query" : "Start by adding your first member"}
                actionLabel={!searchQuery ? "Add Member" : undefined}
                onAction={!searchQuery ? () => setIsCreateOpen(true) : undefined}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[250px]">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1 -ml-3 h-8"
                            onClick={() => toggleSort('name')}
                          >
                            {t('members.name')}
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>{t('members.mobile')}</TableHead>
                        <TableHead>{t('members.status')}</TableHead>
                        <TableHead>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1 -ml-3 h-8"
                            onClick={() => toggleSort('joined_at')}
                          >
                            Joined
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="text-right">Total Paid</TableHead>
                        <TableHead className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1 h-8"
                            onClick={() => toggleSort('dues')}
                          >
                            Dues
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedMembers.map((member) => (
                        <TableRow 
                          key={member.id} 
                          className="table-row-hover cursor-pointer"
                          onClick={() => openProfile(member)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                                <User className="h-5 w-5" />
                              </div>
                              <div>
                                <p className={`font-medium text-foreground ${language === 'bn' && member.name_bn ? 'font-bengali' : ''}`}>
                                  {language === 'bn' && member.name_bn ? member.name_bn : member.name}
                                </p>
                                {member.email && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                    {member.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {member.phone ? (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                {member.phone}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <MemberStatusBadge status={member.status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(member.joined_at || member.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ৳ {(member.total_paid || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={(member.dues || 0) > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                              ৳ {(member.dues || 0).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openProfile(member)} className="gap-2">
                                  <Eye className="h-4 w-4" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEdit(member)} className="gap-2">
                                  <Edit className="h-4 w-4" />
                                  {t('common.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {member.status === 'active' ? (
                                  <>
                                    <DropdownMenuItem 
                                      onClick={() => openStatusConfirm(member, 'deactivate')}
                                      className="gap-2"
                                    >
                                      <UserX className="h-4 w-4" />
                                      Deactivate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => openStatusConfirm(member, 'suspend')}
                                      className="gap-2 text-destructive focus:text-destructive"
                                    >
                                      <UserX className="h-4 w-4" />
                                      Suspend
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <DropdownMenuItem 
                                    onClick={() => openStatusConfirm(member, 'activate')}
                                    className="gap-2 text-success focus:text-success"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                    Reactivate
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * PAGE_SIZE) + 1} to {Math.min(currentPage * PAGE_SIZE, filteredAndSortedMembers.length)} of {filteredAndSortedMembers.length}
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
          </CardContent>
        </Tabs>
      </Card>

      {/* Dialogs */}
      <CreateMemberDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateMember}
        isSubmitting={isSubmitting}
      />

      <EditMemberDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        member={selectedMember}
        onSubmit={handleEditMember}
        isSubmitting={isSubmitting}
      />

      <MemberProfileSheet
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        member={selectedMember}
        onEdit={() => selectedMember && openEdit(selectedMember)}
      />

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={`${confirmAction === 'activate' ? 'Reactivate' : confirmAction === 'deactivate' ? 'Deactivate' : 'Suspend'} Member`}
        description={`Are you sure you want to ${confirmAction} ${selectedMember?.name}? ${confirmAction === 'suspend' ? 'Suspended members cannot access the system.' : ''}`}
        confirmLabel={confirmAction === 'activate' ? 'Reactivate' : confirmAction === 'deactivate' ? 'Deactivate' : 'Suspend'}
        onConfirm={handleStatusChange}
        isLoading={isSubmitting}
        variant={confirmAction === 'suspend' ? 'destructive' : 'default'}
      />
    </div>
  );
}
