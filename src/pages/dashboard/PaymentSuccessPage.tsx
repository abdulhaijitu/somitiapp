import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useOnlinePayment } from '@/hooks/useOnlinePayment';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('ref');
  const invoiceId = searchParams.get('invoice_id');
  const { verifyPayment, isVerifying } = useOnlinePayment();
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    status?: string;
    transaction_id?: string;
    payment_method?: string;
    amount?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (reference || invoiceId) {
      handleVerify();
    }
  }, [reference, invoiceId]);

  const handleVerify = async () => {
    const result = await verifyPayment({ 
      reference: reference || undefined,
      invoice_id: invoiceId || undefined 
    });
    setVerificationResult(result);
  };

  if (isVerifying || !verificationResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
            <Skeleton className="h-6 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
            <p className="text-sm text-muted-foreground">Verifying your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaid = verificationResult.status === 'paid';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-6">
          {isPaid ? (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mx-auto">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Payment Successful!</h1>
                <p className="text-muted-foreground mt-2">
                  Your payment has been processed successfully.
                </p>
              </div>
              <div className="rounded-lg border border-border p-4 text-left space-y-2">
                {verificationResult.transaction_id && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transaction ID:</span>
                    <span className="font-mono">{verificationResult.transaction_id}</span>
                  </div>
                )}
                {verificationResult.payment_method && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="capitalize">{verificationResult.payment_method}</span>
                  </div>
                )}
                {verificationResult.amount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">৳ {verificationResult.amount}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Payment Failed</h1>
                <p className="text-muted-foreground mt-2">
                  {verificationResult.error || 'We could not verify your payment. Please try again.'}
                </p>
              </div>
              <Button onClick={handleVerify} variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Retry Verification
              </Button>
            </>
          )}

          <Link to="/dashboard/payments">
            <Button className="w-full gap-2 bg-gradient-primary hover:opacity-90">
              Go to Payments
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
