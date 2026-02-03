import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { 
  Settings, 
  Building2, 
  Globe, 
  CreditCard, 
  Bell,
  Shield,
  MessageSquare
} from 'lucide-react';

export function SettingsPage() {
  const { t, language, toggleLanguage } = useLanguage();

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

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            {language === 'bn' ? 'সাধারণ' : 'General'}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            {language === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main settings */}
            <div className="space-y-6 lg:col-span-2">
              {/* Organization Info */}
              <Card className="border-border">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{language === 'bn' ? 'প্রতিষ্ঠানের তথ্য' : 'Organization Information'}</CardTitle>
                      <CardDescription>{language === 'bn' ? 'আপনার সমিতির মৌলিক তথ্য' : 'Basic details about your somiti'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">{language === 'bn' ? 'সমিতির নাম' : 'Somiti Name'}</Label>
                      <Input id="name" defaultValue="ABC Somiti" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nameBn">{language === 'bn' ? 'নাম (বাংলা)' : 'Name (Bangla)'}</Label>
                      <Input id="nameBn" defaultValue="এবিসি সমিতি" className="font-bengali" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">{language === 'bn' ? 'ঠিকানা' : 'Address'}</Label>
                    <Input id="address" defaultValue="Dhaka, Bangladesh" />
                  </div>
                  <Button className="bg-gradient-primary hover:opacity-90">
                    {language === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>

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

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Subscription Status */}
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                      <CreditCard className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{language === 'bn' ? 'সাবস্ক্রিপশন' : 'Subscription'}</CardTitle>
                      <CardDescription>{language === 'bn' ? 'সক্রিয় প্ল্যান' : 'Active Plan'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{language === 'bn' ? 'প্ল্যান' : 'Plan'}</span>
                      <span className="font-medium text-foreground">Standard</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{language === 'bn' ? 'স্থিতি' : 'Status'}</span>
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                        {language === 'bn' ? 'সক্রিয়' : 'Active'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{language === 'bn' ? 'পরবর্তী বিলিং' : 'Next Billing'}</span>
                      <span className="font-medium text-foreground">Feb 1, 2024</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security */}
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

        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
