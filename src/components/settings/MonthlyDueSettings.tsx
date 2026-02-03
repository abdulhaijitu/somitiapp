import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, DollarSign, Settings2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ContributionType {
  id: string;
  name: string;
  name_bn: string | null;
  category_type: string;
  is_active: boolean;
}

interface MonthlyDueSetting {
  id: string;
  tenant_id: string;
  contribution_type_id: string;
  fixed_amount: number;
  generation_day: number;
  start_month: string;
  is_enabled: boolean;
  include_members_joined_after_generation: boolean;
}

export function MonthlyDueSettings() {
  const { language } = useLanguage();
  const { tenant } = useTenant();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contributionTypes, setContributionTypes] = useState<ContributionType[]>([]);
  const [settings, setSettings] = useState<MonthlyDueSetting | null>(null);
  
  // Form state
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [fixedAmount, setFixedAmount] = useState<string>('');
  const [generationDay, setGenerationDay] = useState<string>('1');
  const [includeNewMembers, setIncludeNewMembers] = useState(true);

  useEffect(() => {
    if (tenant?.id) {
      fetchData();
    }
  }, [tenant?.id]);

  const fetchData = async () => {
    if (!tenant?.id) return;
    
    setLoading(true);
    try {
      // Fetch contribution types (only monthly category)
      const { data: types, error: typesError } = await supabase
        .from('contribution_types')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .eq('category_type', 'monthly');

      if (typesError) throw typesError;
      setContributionTypes(types || []);

      // Fetch existing settings
      const { data: existingSettings, error: settingsError } = await supabase
        .from('monthly_due_settings')
        .select('*')
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      if (settingsError) throw settingsError;
      
      if (existingSettings) {
        setSettings(existingSettings);
        setIsEnabled(existingSettings.is_enabled);
        setSelectedTypeId(existingSettings.contribution_type_id);
        setFixedAmount(String(existingSettings.fixed_amount));
        setGenerationDay(String(existingSettings.generation_day));
        setIncludeNewMembers(existingSettings.include_members_joined_after_generation);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'ডেটা লোড করতে ব্যর্থ' : 'Failed to load data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tenant?.id) return;

    if (!selectedTypeId) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'অনুগ্রহ করে একটি চাঁদার ধরন নির্বাচন করুন' : 'Please select a contribution type',
        variant: 'destructive'
      });
      return;
    }

    const amount = parseFloat(fixedAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'সঠিক পরিমাণ দিন' : 'Please enter a valid amount',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const data = {
        tenant_id: tenant.id,
        contribution_type_id: selectedTypeId,
        fixed_amount: amount,
        generation_day: parseInt(generationDay),
        is_enabled: isEnabled,
        include_members_joined_after_generation: includeNewMembers,
        start_month: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
      };

      if (settings?.id) {
        // Update existing
        const { error } = await supabase
          .from('monthly_due_settings')
          .update(data)
          .eq('id', settings.id);
        
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('monthly_due_settings')
          .insert(data);
        
        if (error) throw error;
      }

      toast({
        title: language === 'bn' ? 'সফল' : 'Success',
        description: language === 'bn' ? 'সেটিংস সংরক্ষিত হয়েছে' : 'Settings saved successfully'
      });

      fetchData();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' ? 'সংরক্ষণ করতে ব্যর্থ' : 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const selectedType = contributionTypes.find(t => t.id === selectedTypeId);

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>{language === 'bn' ? 'মাসিক বকেয়া স্বয়ংক্রিয় তৈরি' : 'Monthly Due Auto-Generation'}</CardTitle>
            <CardDescription>
              {language === 'bn' 
                ? 'প্রতি মাসে স্বয়ংক্রিয়ভাবে সদস্যদের জন্য বকেয়া তৈরি করুন'
                : 'Automatically generate dues for members every month'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">
              {language === 'bn' ? 'স্বয়ংক্রিয় বকেয়া সক্রিয় করুন' : 'Enable Auto Due Generation'}
            </Label>
            <p className="text-sm text-muted-foreground">
              {language === 'bn' 
                ? 'প্রতি মাসে নির্ধারিত দিনে বকেয়া তৈরি হবে'
                : 'Dues will be generated on the specified day each month'}
            </p>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>

        {isEnabled && (
          <>
            {contributionTypes.length === 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {language === 'bn' 
                    ? 'কোনো সক্রিয় "Monthly" ক্যাটাগরি পাওয়া যায়নি। প্রথমে Contributions ট্যাবে একটি Monthly Contribution ধরন তৈরি করুন।'
                    : 'No active "Monthly" category found. Please create a Monthly Contribution type in the Contributions tab first.'}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Contribution Type Selection */}
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'চাঁদার ধরন' : 'Contribution Type'} *</Label>
                  <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'bn' ? 'নির্বাচন করুন' : 'Select type'} />
                    </SelectTrigger>
                    <SelectContent>
                      {contributionTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {language === 'bn' && type.name_bn ? type.name_bn : type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {language === 'bn' 
                      ? 'যে ধরনের চাঁদা স্বয়ংক্রিয়ভাবে বকেয়া হিসেবে যোগ হবে'
                      : 'The contribution type that will be used for auto-generated dues'}
                  </p>
                </div>

                {/* Fixed Amount */}
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'মাসিক পরিমাণ (৳)' : 'Monthly Amount (৳)'} *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="number"
                      value={fixedAmount}
                      onChange={(e) => setFixedAmount(e.target.value)}
                      placeholder="1000"
                      className="pl-10"
                      min="1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'bn' 
                      ? 'প্রতি মাসে প্রতিটি সদস্যের জন্য এই পরিমাণ বকেয়া তৈরি হবে'
                      : 'This amount will be due for each member every month'}
                  </p>
                </div>

                {/* Generation Day */}
                <div className="space-y-2">
                  <Label>{language === 'bn' ? 'বকেয়া তৈরির দিন' : 'Due Generation Day'}</Label>
                  <Select value={generationDay} onValueChange={setGenerationDay}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={String(day)}>
                          {language === 'bn' ? `প্রতি মাসের ${day} তারিখ` : `Day ${day} of each month`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {language === 'bn' 
                      ? 'প্রতি মাসে এই দিনে বকেয়া স্বয়ংক্রিয়ভাবে তৈরি হবে'
                      : 'Dues will be automatically generated on this day each month'}
                  </p>
                </div>

                {/* Include New Members */}
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      {language === 'bn' ? 'নতুন সদস্যদের অন্তর্ভুক্ত করুন' : 'Include New Members'}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {language === 'bn' 
                        ? 'বকেয়া তৈরির দিনের পরে যোগ হওয়া সদস্যদেরও বকেয়া দেওয়া হবে'
                        : 'Members who join after the generation day will also receive dues'}
                    </p>
                  </div>
                  <Switch
                    checked={includeNewMembers}
                    onCheckedChange={setIncludeNewMembers}
                  />
                </div>

                {/* Status Indicator */}
                {settings && (
                  <Alert className={settings.is_enabled ? 'border-success/50 bg-success/10' : 'border-warning/50 bg-warning/10'}>
                    {settings.is_enabled ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-warning" />
                    )}
                    <AlertDescription className={settings.is_enabled ? 'text-success' : 'text-warning'}>
                      {settings.is_enabled 
                        ? (language === 'bn' 
                            ? `প্রতি মাসের ${settings.generation_day} তারিখে ৳${settings.fixed_amount} বকেয়া তৈরি হবে`
                            : `Dues of ৳${settings.fixed_amount} will be generated on day ${settings.generation_day} of each month`)
                        : (language === 'bn' 
                            ? 'স্বয়ংক্রিয় বকেয়া তৈরি বন্ধ আছে'
                            : 'Auto due generation is currently disabled')}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving || (isEnabled && contributionTypes.length === 0)}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
