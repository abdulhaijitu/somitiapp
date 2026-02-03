import { useState, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Cookie, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  getConsentStatus, 
  setConsentStatus, 
  ConsentStatus,
  CONSENT_STORAGE_KEY 
} from '@/lib/cookie-consent';

interface CookieConsentBannerProps {
  className?: string;
}

export const CookieConsentBanner = memo(function CookieConsentBanner({ 
  className 
}: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    // Check if user has already made a choice
    const existingConsent = getConsentStatus();
    if (!existingConsent) {
      // Small delay for better UX - don't show immediately on page load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const consent: ConsentStatus = {
      necessary: true,
      analytics: true,
      timestamp: Date.now(),
    };
    setConsentStatus(consent);
    setIsVisible(false);
    
    // Reload to apply analytics if enabled
    if (consent.analytics) {
      window.location.reload();
    }
  };

  const handleAcceptSelected = () => {
    const consent: ConsentStatus = {
      necessary: true,
      analytics: analyticsEnabled,
      timestamp: Date.now(),
    };
    setConsentStatus(consent);
    setIsVisible(false);
    
    // Reload to apply/remove analytics
    window.location.reload();
  };

  const handleRejectAll = () => {
    const consent: ConsentStatus = {
      necessary: true, // Always required
      analytics: false,
      timestamp: Date.now(),
    };
    setConsentStatus(consent);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up",
        className
      )}
    >
      <Card className="max-w-2xl mx-auto p-4 shadow-lg border bg-background">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
            <Cookie className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-sm">
                আমরা কুকি ব্যবহার করি / We use cookies
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                আমরা আপনার অভিজ্ঞতা উন্নত করতে কুকি ব্যবহার করি। আপনি সেটিংস কাস্টমাইজ করতে পারেন।
                <br />
                <span className="text-muted-foreground/80">
                  We use cookies to improve your experience. You can customize your preferences.
                </span>
              </p>
            </div>

            {/* Details Toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Customize preferences
                </>
              )}
            </button>

            {/* Cookie Settings */}
            {showDetails && (
              <div className="space-y-3 pt-2 border-t">
                {/* Necessary Cookies - Always enabled */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">
                      Essential Cookies
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Required for the app to function properly
                    </p>
                  </div>
                  <Switch checked disabled />
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">
                      Analytics Cookies
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Help us understand how visitors use our site
                    </p>
                  </div>
                  <Switch 
                    checked={analyticsEnabled}
                    onCheckedChange={setAnalyticsEnabled}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Learn more in our{' '}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {showDetails ? (
                <>
                  <Button 
                    size="sm" 
                    onClick={handleAcceptSelected}
                    className="text-xs"
                  >
                    Save Preferences
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleRejectAll}
                    className="text-xs"
                  >
                    Reject All
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    size="sm" 
                    onClick={handleAcceptAll}
                    className="text-xs"
                  >
                    Accept All
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleRejectAll}
                    className="text-xs"
                  >
                    Reject All
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleRejectAll}
            className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors"
            aria-label="Close cookie banner"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </Card>
    </div>
  );
});
