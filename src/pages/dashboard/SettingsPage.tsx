import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { TenantBillingCard } from '@/components/billing/TenantBillingCard';
import { AddOnPurchaseCard } from '@/components/billing/AddOnPurchaseCard';
import { OrganizationInfoForm } from '@/components/settings/OrganizationInfoForm';
import { ContributionTypesSettings } from '@/components/settings/ContributionTypesSettings';
import { MonthlyDueSettings } from '@/components/settings/MonthlyDueSettings';
import { 
  Settings, 
  Globe, 
  CreditCard, 
  Shield,
  MessageSquare,
  Banknote,
  CalendarClock
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function SettingsPage() {
  const { t, language, toggleLanguage } = useLanguage();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Default to billing tab if specified in URL
  const defaultTab = searchParams.get('tab') || 'general';

  const handleUpgradeRequest = () => {
    toast({
      title: language === 'bn' ? 'আপগ্রেড অনুরোধ' : 'Upgrade Request',
      description: language === 'bn' 
        ? 'আপগ্রেডের জন্য সাপোর্ট টিমের সাথে যোগাযোগ করুন।'
        : 'Contact support team to upgrade your plan.'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
          {t('nav.settings')}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {language === 'bn' ? 'আপনার সমিতির সেটিংস ও পছন্দ পরিচালনা করুন' : 'Manage your somiti settings and preferences'}
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full max-w-3xl grid-cols-5">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">{language === 'bn' ? 'সাধারণ' : 'General'}</span>
          </TabsTrigger>
          <TabsTrigger value="contributions" className="gap-2">
            <Banknote className="h-4 w-4" />
            <span className="hidden sm:inline">{language === 'bn' ? 'চাঁদা' : 'Contributions'}</span>
          </TabsTrigger>
          <TabsTrigger value="dues" className="gap-2">
            <CalendarClock className="h-4 w-4" />
            <span className="hidden sm:inline">{language === 'bn' ? 'বকেয়া' : 'Dues'}</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">{language === 'bn' ? 'বিলিং' : 'Billing'}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">{language === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main settings */}
            <div className="space-y-6 lg:col-span-2">
              {/* Organization Info - Now using dedicated component */}
              <OrganizationInfoForm />

              {/* Language Settings */}
              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                      <Globe className="h-5 w-5 text-info" />
                    </div>
                    <div>
                      <CardTitle>{language === 'bn' ? 'ভাষার পছন্দ' : 'Language Preferences'}</CardTitle>
                      <CardDescription>{language === 'bn' ? 'আপনার পছন্দের ভাষা নির্বাচন করুন' : 'Choose your preferred language'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{language === 'bn' ? 'বাংলা ব্যবহার করুন' : 'Use Bangla'}</p>
                      <p className="text-sm text-muted-foreground">
                        {language === 'bn' ? 'বাংলা ভাষায় ইন্টারফেস দেখান' : 'Display interface in Bengali language'}
                      </p>
                    </div>
                    <Switch 
                      checked={language === 'bn'} 
                      onCheckedChange={toggleLanguage}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Security */}
            <div className="space-y-6">
              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                      <Shield className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{language === 'bn' ? 'নিরাপত্তা' : 'Security'}</CardTitle>
                      <CardDescription>{language === 'bn' ? 'অ্যাকাউন্ট সুরক্ষা' : 'Account protection'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    {language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contributions" className="space-y-6">
          <ContributionTypesSettings />
        </TabsContent>

        <TabsContent value="dues" className="space-y-6">
          <MonthlyDueSettings />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <TenantBillingCard onRequestUpgrade={handleUpgradeRequest} />
            <AddOnPurchaseCard />
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
