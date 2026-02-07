import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { usePendingPaymentRequests } from '@/hooks/usePendingPaymentRequests';
import { useApprovePaymentRequest } from '@/hooks/useApprovePaymentRequest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Loader2,
  Bell,
} from 'lucide-react';

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function PendingPaymentRequests() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { data: requests, isLoading } = usePendingPaymentRequests();
  const { approvePayment, rejectPayment, isApproving } = useApprovePaymentRequest();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);

  const handleApprove = async (paymentId: string) => {
    setProcessingId(paymentId);
    const result = await approvePayment(paymentId);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['pending-payment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-payments'] });
    }
    setProcessingId(null);
  };

  const handleReject = async () => {
    if (!rejectDialogId) return;
    setProcessingId(rejectDialogId);
    const success = await rejectPayment(rejectDialogId, 'Rejected by admin');
    if (success) {
      queryClient.invalidateQueries({ queryKey: ['pending-payment-requests'] });
    }
    setProcessingId(null);
    setRejectDialogId(null);
  };

  // Don't render if no pending requests
  if (!isLoading && (!requests || requests.length === 0)) {
    return null;
  }

  return (
    <>
      <Card className="border-warning/30 bg-warning/5">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-warning" />
            {language === 'bn' ? 'পেমেন্ট অনুমোদন' : 'Payment Approvals'}
            {requests && requests.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {requests.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {requests?.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/10 text-sm font-medium text-warning font-bengali">
                      {(req.member.name_bn || req.member.name).charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate font-bengali">
                        {language === 'bn' && req.member.name_bn ? req.member.name_bn : req.member.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{timeAgo(req.created_at)}</span>
                        {req.member.phone && (
                          <>
                            <span>•</span>
                            <span>{req.member.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-foreground whitespace-nowrap">
                      ৳{req.amount.toLocaleString()}
                    </span>
                    <Button
                      size="sm"
                      variant="default"
                      className="gap-1"
                      disabled={isApproving && processingId === req.id}
                      onClick={() => handleApprove(req.id)}
                    >
                      {isApproving && processingId === req.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      <span className="hidden sm:inline">
                        {language === 'bn' ? 'অনুমোদন' : 'Approve'}
                      </span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-destructive hover:text-destructive"
                      disabled={processingId === req.id}
                      onClick={() => setRejectDialogId(req.id)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">
                        {language === 'bn' ? 'বাতিল' : 'Reject'}
                      </span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={!!rejectDialogId} onOpenChange={() => setRejectDialogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'bn' ? 'পেমেন্ট রিকোয়েস্ট বাতিল করবেন?' : 'Reject Payment Request?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'bn'
                ? 'এই পেমেন্ট রিকোয়েস্ট বাতিল করা হবে এবং সদস্যকে জানানো হবে।'
                : 'This payment request will be cancelled and the member will be notified.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'bn' ? 'না' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'bn' ? 'হ্যাঁ, বাতিল করুন' : 'Yes, Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
