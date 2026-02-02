import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowRight, RotateCcw } from 'lucide-react';

export function PaymentCancelledPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 mx-auto">
            <XCircle className="h-8 w-8 text-warning" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payment Cancelled</h1>
            <p className="text-muted-foreground mt-2">
              Your payment was cancelled. No charges were made.
            </p>
          </div>
          
          <div className="rounded-lg border border-border p-4 bg-muted/30">
            <h3 className="font-medium text-foreground mb-2">What would you like to do?</h3>
            <ul className="text-sm text-muted-foreground text-left space-y-1">
              <li>• Try the payment again with a different method</li>
              <li>• Contact your administrator for assistance</li>
              <li>• Record an offline payment instead</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link to="/dashboard/payments">
              <Button className="w-full gap-2 bg-gradient-primary hover:opacity-90">
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="w-full gap-2">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
