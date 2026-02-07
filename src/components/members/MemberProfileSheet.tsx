import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  Loader2
} from 'lucide-react';
import { MemberStatusBadge } from './MemberStatusBadge';
import { PaymentStatusBadge } from '@/components/payments/PaymentStatusBadge';
import { PaymentMethodBadge } from '@/components/payments/PaymentMethodBadge';
import { format } from 'date-fns';
import { useAdvanceBalance } from '@/hooks/useAdvanceBalance';
import { MemberFinancialSummary } from './MemberFinancialSummary';
import { EditPaymentDialog } from '@/components/payments/EditPaymentDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';

interface Member {
  id: string;
  name: string;
  name_bn?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  monthly_amount?: number | null;
  member_number?: string | null;
  status: string;
  joined_at?: string | null;
  created_at: string;
  tenant_id?: string;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  payment_type: string;
  payment_date: string | null;
  period_month: number | null;
  period_year: number | null;
  created_at: string;
  notes?: string | null;
  reference?: string | null;
  due_id?: string | null;
  member_id: string;
  members?: { name: string; name_bn: string | null } | null;
}

interface MemberProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  onEdit: () => void;
  onCreatePayment?: (memberId: string) => void;
  onPaymentChanged?: () => void;
}

export function MemberProfileSheet({
  open,
  onOpenChange,
  member,
  onEdit,
  onCreatePayment,
  onPaymentChanged
}: MemberProfileSheetProps) {
  const { t, language } = useLanguage();
  const { tenant } = useTenant();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalPaid: 0, totalDue: 0, paymentCount: 0 });
  
  // Edit/Delete state
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get advance balance for this member
  const { advanceBalance } = useAdvanceBalance(
    member?.id || null,
    member?.tenant_id || tenant?.id || null
  );

  useEffect(() => {
    if (member && open) {
      loadPayments();
    }
  }, [member, open]);

  const loadPayments = async () => {
    if (!member) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', member.id)
        .order('period_year', { ascending: true })
        .order('period_month', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error loading payments:', error);
        return;
      }

      setPayments(data || []);

      const paid = (data || [])
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      
      const pending = (data || [])
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      setStats({
        totalPaid: paid,
        totalDue: pending,
        paymentCount: (data || []).filter(p => p.status === 'paid').length
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment({
      ...payment,
      members: member ? { name: member.name, name_bn: member.name_bn || null } : null
    });
    setIsEditOpen(true);
  };

  const handleSavePayment = async (data: {
    id: string;
    amount: number;
    status: string;
    period_month: number | null;
    period_year: number | null;
    notes: string;
  }) => {
    if (!tenant?.id) return;
    setIsUpdating(true);
    try {
      const updateData: Record<string, any> = {
        amount: data.amount,
        status: data.status,
        period_month: data.period_month,
        period_year: data.period_year,
        notes: data.notes || null,
        updated_at: new Date().toISOString()
      };

      if (data.status === 'paid' && editingPayment?.status !== 'paid') {
        updateData.payment_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', data.id)
        .eq('tenant_id', tenant.id);

      if (error) {
        toast({
          title: language === 'bn' ? 'ত্রুটি' : 'Error',
          description: language === 'bn' ? 'পেমেন্ট আপডেট করতে সমস্যা হয়েছে' : 'Failed to update payment',
          variant: 'destructive'
        });
        return;
      }

      // Recalculate due status if linked
      if (editingPayment?.due_id) {
        await recalculateDueStatus(editingPayment.due_id);
      }

      toast({
        title: language === 'bn' ? 'সফল' : 'Success',
        description: language === 'bn' ? 'পেমেন্ট আপডেট হয়েছে' : 'Payment updated'
      });

      setIsEditOpen(false);
      setEditingPayment(null);
      loadPayments();
      onPaymentChanged?.();
    } catch (error) {
      console.error('Error updating payment:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!deletingPayment || !tenant?.id) return;
    setIsDeleting(true);
    try {
      // We can't actually DELETE due to RLS, so cancel/mark as cancelled
      const { error } = await supabase
        .from('payments')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', deletingPayment.id)
        .eq('tenant_id', tenant.id);

      if (error) {
        toast({
          title: language === 'bn' ? 'ত্রুটি' : 'Error',
          description: language === 'bn' ? 'পেমেন্ট বাতিল করতে সমস্যা হয়েছে' : 'Failed to cancel payment',
          variant: 'destructive'
        });
        return;
      }

      if (deletingPayment.due_id) {
        await recalculateDueStatus(deletingPayment.due_id);
      }

      toast({
        title: language === 'bn' ? 'সফল' : 'Success',
        description: language === 'bn' ? 'পেমেন্ট বাতিল হয়েছে' : 'Payment cancelled'
      });

      setDeletingPayment(null);
      loadPayments();
      onPaymentChanged?.();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const recalculateDueStatus = async (dueId: string) => {
    try {
      const { data: due } = await supabase
        .from('dues')
        .select('id, amount')
        .eq('id', dueId)
        .single();

      if (!due) return;

      const { data: linkedPayments } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('due_id', dueId)
        .eq('status', 'paid');

      const totalPaid = (linkedPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);
      
      let newStatus: 'unpaid' | 'partial' | 'paid';
      if (totalPaid >= Number(due.amount)) newStatus = 'paid';
      else if (totalPaid > 0) newStatus = 'partial';
      else newStatus = 'unpaid';

      await supabase
        .from('dues')
        .update({ paid_amount: totalPaid, status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', dueId);
    } catch (error) {
      console.error('Error recalculating due:', error);
    }
  };

  if (!member) return null;

  const displayName = language === 'bn' && member.name_bn ? member.name_bn : member.name;
  const tenantId = member.tenant_id || tenant?.id || null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <SheetTitle className={language === 'bn' && member.name_bn ? 'font-bengali' : ''}>
                  {displayName}
                </SheetTitle>
                <SheetDescription className="flex items-center gap-2 mt-1">
                  <MemberStatusBadge status={member.status} />
                  {member.member_number && (
                    <span className="text-xs font-mono">#{member.member_number}</span>
                  )}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <Tabs defaultValue="info" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Profile</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4 space-y-6">
              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {language === 'bn' ? 'যোগাযোগ তথ্য' : 'Contact Information'}
                </h3>
                
                {member.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{member.phone}</span>
                  </div>
                )}
                
                {member.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{member.email}</span>
                  </div>
                )}
                
                {member.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{member.address}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {language === 'bn' ? 'যোগদান ' : 'Joined '}
                    {format(new Date(member.joined_at || member.created_at), 'MMMM d, yyyy')}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Combined Financial Summary + Year Selector */}
              <MemberFinancialSummary
                memberId={member.id}
                tenantId={tenantId}
                joinedAt={member.joined_at}
                createdAt={member.created_at}
                advanceBalance={advanceBalance}
                variant="admin"
              />

              <Button 
                onClick={onEdit} 
                variant="outline" 
                className="w-full"
              >
                {language === 'bn' ? 'প্রোফাইল সম্পাদনা' : 'Edit Profile'}
              </Button>
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {language === 'bn' ? 'পেমেন্ট ইতিহাস' : 'Payment History'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{stats.paymentCount} {language === 'bn' ? 'টি' : 'payments'}</Badge>
                    {onCreatePayment && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onCreatePayment(member.id)}
                        className="gap-1 h-7 text-xs"
                      >
                        <Plus className="h-3 w-3" />
                        {language === 'bn' ? 'নতুন' : 'New'}
                      </Button>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-5 w-16" />
                      </div>
                    ))}
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>{language === 'bn' ? 'কোনো পেমেন্ট নেই' : 'No payment history yet'}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin">
                    {payments.map((payment) => (
                      <div 
                        key={payment.id} 
                        className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium">
                              ৳ {Number(payment.amount).toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {payment.period_month && payment.period_year 
                                ? `${payment.period_month}/${payment.period_year}`
                                : format(new Date(payment.payment_date || payment.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <PaymentMethodBadge method={payment.payment_method} type={payment.payment_type} />
                          <PaymentStatusBadge status={payment.status} showIcon={false} />
                          {/* Action buttons */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => handleEditPayment(payment)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            {payment.status !== 'cancelled' && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setDeletingPayment(payment)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Edit Payment Dialog */}
      <EditPaymentDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        payment={editingPayment}
        onSave={handleSavePayment}
        isSubmitting={isUpdating}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingPayment}
        onOpenChange={(open) => !open && setDeletingPayment(null)}
        title={language === 'bn' ? 'পেমেন্ট বাতিল করুন' : 'Cancel Payment'}
        description={language === 'bn' 
          ? `আপনি কি নিশ্চিত যে আপনি ৳${deletingPayment?.amount} এর পেমেন্ট বাতিল করতে চান?`
          : `Are you sure you want to cancel the payment of ৳${deletingPayment?.amount}?`}
        confirmLabel={language === 'bn' ? 'বাতিল করুন' : 'Cancel Payment'}
        variant="destructive"
        onConfirm={handleDeletePayment}
        isLoading={isDeleting}
      />
    </>
  );
}
