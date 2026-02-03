import { memo, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Zap, Smartphone, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface PWAInstallPromptProps {
  isVisible: boolean;
  onInstall: () => Promise<boolean>;
  onDismiss: () => void;
}

export const PWAInstallPrompt = memo(function PWAInstallPrompt({
  isVisible,
  onInstall,
  onDismiss,
}: PWAInstallPromptProps) {
  const { language } = useLanguage();
  const { toast } = useToast();

  // Handle install click
  const handleInstall = async () => {
    const success = await onInstall();
    
    if (success) {
      toast({
        title: language === 'bn' ? 'অ্যাপ ইনস্টল সফল!' : 'App installed successfully!',
        description: language === 'bn' 
          ? 'এখন হোম স্ক্রিন থেকে অ্যাপ খুলুন' 
          : 'You can now open the app from your home screen',
      });
    }
  };

  // Benefits list
  const benefits = [
    {
      icon: Zap,
      text: language === 'bn' ? 'দ্রুত অ্যাক্সেস' : 'Faster access',
    },
    {
      icon: Smartphone,
      text: language === 'bn' ? 'মোবাইল অ্যাপের মতো কাজ করে' : 'Works like a mobile app',
    },
    {
      icon: Wifi,
      text: language === 'bn' ? 'কম ডেটা খরচ' : 'Less data usage',
    },
  ];

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm lg:hidden animate-fade-in"
        onClick={onDismiss}
      />
      
      {/* Bottom Sheet */}
      <Card 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
          "rounded-t-2xl rounded-b-none border-t border-x border-b-0",
          "bg-card shadow-2xl",
          "animate-slide-up",
          "safe-area-bottom"
        )}
      >
        <CardContent className="p-5 pb-6">
          {/* Header with close button */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* App icon */}
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg">
                <Download className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground font-bengali">
                  {language === 'bn' 
                    ? 'অ্যাপটি ইনস্টল করুন' 
                    : 'Install this app'}
                </h3>
                <p className="text-sm text-muted-foreground font-bengali">
                  {language === 'bn' 
                    ? 'সহজে অ্যাক্সেসের জন্য' 
                    : 'For easier access'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 -mt-1 -mr-1"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Benefits */}
          <div className="space-y-2 mb-5">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                  <benefit.icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="font-bengali">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 font-bengali"
              onClick={onDismiss}
            >
              {language === 'bn' ? 'এখন না' : 'Not now'}
            </Button>
            <Button
              className="flex-1 gap-2 font-bengali"
              onClick={handleInstall}
            >
              <Download className="h-4 w-4" />
              {language === 'bn' ? 'ইনস্টল করুন' : 'Install App'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
});

// CSS animation keyframes - add to index.css if not present
// @keyframes slide-up {
//   from { transform: translateY(100%); opacity: 0; }
//   to { transform: translateY(0); opacity: 1; }
// }
// .animate-slide-up { animation: slide-up 0.3s ease-out; }
