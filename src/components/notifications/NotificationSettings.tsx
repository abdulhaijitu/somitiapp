import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bell, 
  MessageSquare, 
  Clock,
  AlertTriangle,
  Save,
  CheckCircle2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettingsData {
  id?: string;
  tenant_id: string;
  payment_success_sms: boolean;
  payment_failed_sms: boolean;
  dues_reminder_enabled: boolean;
  dues_reminder_day: number;
  overdue_reminder_enabled: boolean;
  overdue_reminder_frequency_days: number;
  admin_alert_on_failed_payment: boolean;
  admin_alert_on_high_overdue: boolean;
  high_overdue_threshold: number;
}

export function NotificationSettings() {
  const { language } = useLanguage();
  const { tenant, isAdmin } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<NotificationSettingsData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch settings
  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ['notification-settings', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Return defaults if no settings exist
      return data || {
        tenant_id: tenant.id,
        payment_success_sms: true,
        payment_failed_sms: true,
        dues_reminder_enabled: true,
        dues_reminder_day: 1,
        overdue_reminder_enabled: true,
        overdue_reminder_frequency_days: 7,
        admin_alert_on_failed_payment: true,
        admin_alert_on_high_overdue: true,
        high_overdue_threshold: 5
      };
    },
    enabled: !!tenant?.id && isAdmin
  });

  useEffect(() => {
    if (existingSettings) {
      setSettings(existingSettings);
    }
  }, [existingSettings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: NotificationSettingsData) => {
      if (data.id) {
        // Update existing
        const { error } = await supabase
          .from('notification_settings')
          .update({
            payment_success_sms: data.payment_success_sms,
            payment_failed_sms: data.payment_failed_sms,
            dues_reminder_enabled: data.dues_reminder_enabled,
            dues_reminder_day: data.dues_reminder_day,
            overdue_reminder_enabled: data.overdue_reminder_enabled,
            overdue_reminder_frequency_days: data.overdue_reminder_frequency_days,
            admin_alert_on_failed_payment: data.admin_alert_on_failed_payment,
            admin_alert_on_high_overdue: data.admin_alert_on_high_overdue,
            high_overdue_threshold: data.high_overdue_threshold
          })
          .eq('id', data.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('notification_settings')
          .insert(data);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: language === 'bn' ? 'সেটিংস সংরক্ষিত' : 'Settings Saved',
        description: language === 'bn' 
          ? 'নোটিফিকেশন সেটিংস সফলভাবে আপডেট করা হয়েছে।'
          : 'Notification settings have been updated.',
      });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['notification-settings', tenant?.id] });
    },
    onError: () => {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' 
          ? 'সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে।'
          : 'Failed to save settings.',
        variant: 'destructive'
      });
    }
  });

  const updateSetting = <K extends keyof NotificationSettingsData>(
    key: K, 
    value: NotificationSettingsData[K]
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
    setHasChanges(true);
  };

  if (!isAdmin) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {language === 'bn' 
            ? 'শুধুমাত্র অ্যাডমিন এই সেটিংস পরিবর্তন করতে পারবেন।'
            : 'Only admins can modify notification settings.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading || !settings) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* SMS Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>{language === 'bn' ? 'SMS সেটিংস' : 'SMS Settings'}</CardTitle>
              <CardDescription>
                {language === 'bn' 
                  ? 'সদস্যদের কাছে SMS পাঠানোর সেটিংস'
                  : 'Configure SMS notifications to members'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-bengali">
                {language === 'bn' ? 'সফল পেমেন্ট SMS' : 'Payment Success SMS'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === 'bn' 
                  ? 'পেমেন্ট সফল হলে সদস্যকে SMS পাঠান'
                  : 'Send SMS when payment is successful'}
              </p>
            </div>
            <Switch
              checked={settings.payment_success_sms}
              onCheckedChange={(checked) => updateSetting('payment_success_sms', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-bengali">
                {language === 'bn' ? 'ব্যর্থ পেমেন্ট SMS' : 'Payment Failed SMS'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === 'bn' 
                  ? 'পেমেন্ট ব্যর্থ হলে সদস্যকে SMS পাঠান'
                  : 'Send SMS when payment fails'}
              </p>
            </div>
            <Switch
              checked={settings.payment_failed_sms}
              onCheckedChange={(checked) => updateSetting('payment_failed_sms', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reminder Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <CardTitle>{language === 'bn' ? 'রিমাইন্ডার সেটিংস' : 'Reminder Settings'}</CardTitle>
              <CardDescription>
                {language === 'bn' 
                  ? 'স্বয়ংক্রিয় রিমাইন্ডার সেটিংস কনফিগার করুন'
                  : 'Configure automatic payment reminders'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-bengali">
                {language === 'bn' ? 'বকেয়া রিমাইন্ডার সক্রিয়' : 'Enable Dues Reminders'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === 'bn' 
                  ? 'প্রতি মাসে বকেয়ার রিমাইন্ডার পাঠান'
                  : 'Send monthly dues reminders'}
              </p>
            </div>
            <Switch
              checked={settings.dues_reminder_enabled}
              onCheckedChange={(checked) => updateSetting('dues_reminder_enabled', checked)}
            />
          </div>

          {settings.dues_reminder_enabled && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="dues-day" className="font-bengali">
                {language === 'bn' ? 'রিমাইন্ডার তারিখ (মাসের দিন)' : 'Reminder Day (of month)'}
              </Label>
              <Input
                id="dues-day"
                type="number"
                min={1}
                max={28}
                value={settings.dues_reminder_day}
                onChange={(e) => updateSetting('dues_reminder_day', parseInt(e.target.value) || 1)}
                className="w-24"
              />
            </div>
          )}
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-bengali">
                {language === 'bn' ? 'বিলম্বিত পেমেন্ট রিমাইন্ডার' : 'Overdue Reminders'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === 'bn' 
                  ? 'বিলম্বিত পেমেন্টের জন্য রিমাইন্ডার'
                  : 'Send reminders for overdue payments'}
              </p>
            </div>
            <Switch
              checked={settings.overdue_reminder_enabled}
              onCheckedChange={(checked) => updateSetting('overdue_reminder_enabled', checked)}
            />
          </div>

          {settings.overdue_reminder_enabled && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="overdue-freq" className="font-bengali">
                {language === 'bn' ? 'রিমাইন্ডার ফ্রিকোয়েন্সি (দিন)' : 'Reminder Frequency (days)'}
              </Label>
              <Input
                id="overdue-freq"
                type="number"
                min={1}
                max={30}
                value={settings.overdue_reminder_frequency_days}
                onChange={(e) => updateSetting('overdue_reminder_frequency_days', parseInt(e.target.value) || 7)}
                className="w-24"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <Bell className="h-5 w-5 text-info" />
            </div>
            <div>
              <CardTitle>{language === 'bn' ? 'অ্যাডমিন সতর্কতা' : 'Admin Alerts'}</CardTitle>
              <CardDescription>
                {language === 'bn' 
                  ? 'গুরুত্বপূর্ণ ইভেন্টের জন্য অ্যাডমিন নোটিফিকেশন'
                  : 'Get notified about important events'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-bengali">
                {language === 'bn' ? 'ব্যর্থ পেমেন্ট সতর্কতা' : 'Failed Payment Alerts'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === 'bn' 
                  ? 'অনলাইন পেমেন্ট ব্যর্থ হলে সতর্কতা'
                  : 'Alert when online payments fail'}
              </p>
            </div>
            <Switch
              checked={settings.admin_alert_on_failed_payment}
              onCheckedChange={(checked) => updateSetting('admin_alert_on_failed_payment', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-bengali">
                {language === 'bn' ? 'অতিরিক্ত বকেয়া সতর্কতা' : 'High Overdue Alert'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === 'bn' 
                  ? 'অনেক সদস্যের বকেয়া থাকলে সতর্কতা'
                  : 'Alert when many members have overdue payments'}
              </p>
            </div>
            <Switch
              checked={settings.admin_alert_on_high_overdue}
              onCheckedChange={(checked) => updateSetting('admin_alert_on_high_overdue', checked)}
            />
          </div>

          {settings.admin_alert_on_high_overdue && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="overdue-threshold" className="font-bengali">
                {language === 'bn' ? 'সতর্কতার থ্রেশহোল্ড (সদস্য সংখ্যা)' : 'Alert Threshold (member count)'}
              </Label>
              <Input
                id="overdue-threshold"
                type="number"
                min={1}
                max={100}
                value={settings.high_overdue_threshold}
                onChange={(e) => updateSetting('high_overdue_threshold', parseInt(e.target.value) || 5)}
                className="w-24"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button
            onClick={() => saveMutation.mutate(settings)}
            disabled={saveMutation.isPending}
            className="bg-gradient-primary"
          >
            {saveMutation.isPending ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2 animate-spin" />
                {language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
