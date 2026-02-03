import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { 
  Plus, 
  Edit, 
  Loader2,
  Banknote,
  HandCoins,
  Info,
  AlertTriangle,
  Lock
} from 'lucide-react';

interface ContributionType {
  id: string;
  name: string;
  name_bn: string | null;
  description: string | null;
  description_bn: string | null;
  category_type: 'monthly' | 'fund_raise' | 'other';
  is_active: boolean;
  is_fixed_amount: boolean;
  default_amount: number;
  sort_order: number;
  payment_count?: number;
}

export function ContributionTypesSettings() {
  const { language } = useLanguage();
  const { tenant } = useTenant();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [types, setTypes] = useState<ContributionType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ContributionType | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: ContributionType | null;
    action: 'disable' | 'enable';
  }>({ open: false, type: null, action: 'disable' });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    name_bn: '',
    description: '',
    description_bn: '',
    category_type: 'other' as 'monthly' | 'fund_raise' | 'other',
    is_fixed_amount: false,
    default_amount: 0,
  });

  useEffect(() => {
    if (tenant?.id) {
      loadContributionTypes();
    }
  }, [tenant?.id]);

  const loadContributionTypes = async () => {
    if (!tenant?.id) return;

    setLoading(true);
    try {
      // Load contribution types with payment counts
      const { data, error } = await supabase
        .from('contribution_types')
        .select(`
          *,
          payments:payments(count)
        `)
        .eq('tenant_id', tenant.id)
        .order('sort_order');

      if (error) throw error;
      
      // Transform data to include payment count
      const typesWithCounts = (data || []).map((type: any) => ({
        ...type,
        payment_count: type.payments?.[0]?.count || 0
      }));
      
      setTypes(typesWithCounts as ContributionType[]);
    } catch (error) {
      console.error('Error loading contribution types:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' 
          ? 'পেমেন্ট ক্যাটাগরি লোড করতে সমস্যা হয়েছে' 
          : 'Failed to load payment categories',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const validateName = (name: string): boolean => {
    if (!name.trim()) {
      setNameError(language === 'bn' ? 'নাম আবশ্যক' : 'Name is required');
      return false;
    }
    
    // Check for duplicate names (excluding current editing type)
    const duplicate = types.find(t => 
      t.name.toLowerCase() === name.trim().toLowerCase() && 
      t.id !== editingType?.id
    );
    
    if (duplicate) {
      setNameError(language === 'bn' 
        ? 'এই নামে আরেকটি ক্যাটাগরি আছে' 
        : 'A category with this name already exists');
      return false;
    }
    
    setNameError(null);
    return true;
  };

  const handleOpenDialog = (type?: ContributionType) => {
    setNameError(null);
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        name_bn: type.name_bn || '',
        description: type.description || '',
        description_bn: type.description_bn || '',
        category_type: type.category_type,
        is_fixed_amount: type.is_fixed_amount,
        default_amount: type.default_amount,
      });
    } else {
      setEditingType(null);
      setFormData({
        name: '',
        name_bn: '',
        description: '',
        description_bn: '',
        category_type: 'other',
        is_fixed_amount: false,
        default_amount: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!tenant?.id) return;
    
    // Validate name
    if (!validateName(formData.name)) return;
    
    // Validate fixed amount
    if (formData.is_fixed_amount && formData.default_amount <= 0) {
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' 
          ? 'নির্ধারিত পরিমাণ শূন্যের বেশি হতে হবে' 
          : 'Fixed amount must be greater than zero',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      if (editingType) {
        // Update
        const { error } = await supabase
          .from('contribution_types')
          .update({
            name: formData.name.trim(),
            name_bn: formData.name_bn.trim() || null,
            description: formData.description.trim() || null,
            description_bn: formData.description_bn.trim() || null,
            category_type: formData.category_type,
            is_fixed_amount: formData.is_fixed_amount,
            default_amount: formData.default_amount,
          })
          .eq('id', editingType.id);

        if (error) throw error;
        
        toast({
          title: language === 'bn' ? 'সফল' : 'Success',
          description: language === 'bn' ? 'পেমেন্ট ক্যাটাগরি আপডেট হয়েছে' : 'Payment category updated',
        });
      } else {
        // Create
        const { error } = await supabase
          .from('contribution_types')
          .insert({
            tenant_id: tenant.id,
            name: formData.name.trim(),
            name_bn: formData.name_bn.trim() || null,
            description: formData.description.trim() || null,
            description_bn: formData.description_bn.trim() || null,
            category_type: formData.category_type,
            is_fixed_amount: formData.is_fixed_amount,
            default_amount: formData.default_amount,
            sort_order: types.length + 1,
          });

        if (error) throw error;
        
        toast({
          title: language === 'bn' ? 'সফল' : 'Success',
          description: language === 'bn' ? 'নতুন পেমেন্ট ক্যাটাগরি যোগ হয়েছে' : 'Payment category created',
        });
      }

      setIsDialogOpen(false);
      loadContributionTypes();
    } catch (error) {
      console.error('Error saving contribution type:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' 
          ? 'সংরক্ষণ করতে সমস্যা হয়েছে' 
          : 'Failed to save payment category',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActiveRequest = (type: ContributionType) => {
    // If disabling, show confirmation
    if (type.is_active) {
      setConfirmDialog({ open: true, type, action: 'disable' });
    } else {
      // Enabling doesn't need confirmation
      handleToggleActive(type);
    }
  };

  const handleToggleActive = async (type: ContributionType) => {
    try {
      const { error } = await supabase
        .from('contribution_types')
        .update({ is_active: !type.is_active })
        .eq('id', type.id);

      if (error) throw error;
      
      toast({
        title: language === 'bn' ? 'সফল' : 'Success',
        description: type.is_active 
          ? (language === 'bn' ? 'ক্যাটাগরি নিষ্ক্রিয় করা হয়েছে' : 'Category disabled')
          : (language === 'bn' ? 'ক্যাটাগরি সক্রিয় করা হয়েছে' : 'Category enabled'),
      });
      
      loadContributionTypes();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' 
          ? 'স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে' 
          : 'Failed to toggle status',
        variant: 'destructive'
      });
    }
    setConfirmDialog({ open: false, type: null, action: 'disable' });
  };

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case 'monthly':
        return language === 'bn' ? 'মাসিক চাঁদা' : 'Monthly';
      case 'fund_raise':
        return language === 'bn' ? 'ফান্ড রেইজ' : 'Fund Raise';
      default:
        return language === 'bn' ? 'অন্যান্য' : 'Others';
    }
  };

  const getCategoryBadgeVariant = (type: string): "default" | "secondary" | "outline" => {
    switch (type) {
      case 'monthly':
        return 'default';
      case 'fund_raise':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const isDefaultCategory = (type: ContributionType) => {
    return type.category_type === 'monthly' || 
           (type.sort_order <= 3 && ['monthly', 'fund_raise', 'other'].includes(type.category_type));
  };

  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Banknote className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>
                  {language === 'bn' ? 'পেমেন্ট ক্যাটাগরি' : 'Payment Categories'}
                </CardTitle>
                <CardDescription>
                  {language === 'bn' 
                    ? 'সদস্যদের কাছ থেকে টাকা সংগ্রহের সময় এই ক্যাটাগরিগুলো ব্যবহৃত হয়'
                    : 'These categories are used when collecting money from members'}
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              {language === 'bn' ? 'নতুন যোগ করুন' : 'Add New'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Helper Info */}
          <Alert className="border-info/30 bg-info/5">
            <Info className="h-4 w-4 text-info" />
            <AlertDescription className="text-sm text-muted-foreground">
              {language === 'bn' 
                ? 'পেমেন্ট ক্যাটাগরি পেমেন্ট ফর্ম এবং রিপোর্টে ব্যবহৃত হয়। নির্ধারিত পরিমাণের ক্যাটাগরিতে সদস্য সেই নির্দিষ্ট পরিমাণ দেবে, নমনীয় ক্যাটাগরিতে যেকোনো পরিমাণ দেওয়া যায়।'
                : 'Payment categories are used in payment forms and reports. Fixed amount categories require members to pay the specified amount, while flexible categories allow any amount.'}
            </AlertDescription>
          </Alert>

          {types.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HandCoins className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{language === 'bn' ? 'কোনো পেমেন্ট ক্যাটাগরি নেই' : 'No payment categories defined'}</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4" />
                {language === 'bn' ? 'প্রথম ক্যাটাগরি যোগ করুন' : 'Add your first category'}
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'bn' ? 'নাম' : 'Name'}</TableHead>
                    <TableHead>{language === 'bn' ? 'টাইপ' : 'Type'}</TableHead>
                    <TableHead className="text-right">{language === 'bn' ? 'পরিমাণ' : 'Amount'}</TableHead>
                    <TableHead className="text-center">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</TableHead>
                    <TableHead className="text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {types.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium">
                              {language === 'bn' && type.name_bn ? type.name_bn : type.name}
                            </p>
                            {type.description && (
                              <p className="text-xs text-muted-foreground">
                                {language === 'bn' && type.description_bn 
                                  ? type.description_bn 
                                  : type.description}
                              </p>
                            )}
                          </div>
                          {isDefaultCategory(type) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Lock className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  {language === 'bn' ? 'ডিফল্ট ক্যাটাগরি' : 'Default category'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getCategoryBadgeVariant(type.category_type)}>
                          {getCategoryLabel(type.category_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {type.is_fixed_amount ? (
                          <span className="font-medium text-primary">৳{type.default_amount}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {language === 'bn' ? 'নমনীয়' : 'Flexible'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="inline-flex">
                                <Switch
                                  checked={type.is_active}
                                  onCheckedChange={() => handleToggleActiveRequest(type)}
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {type.is_active 
                                ? (language === 'bn' ? 'সক্রিয় - ক্লিক করে নিষ্ক্রিয় করুন' : 'Active - Click to disable')
                                : (language === 'bn' ? 'নিষ্ক্রিয় - ক্লিক করে সক্রিয় করুন' : 'Inactive - Click to enable')}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleOpenDialog(type)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {(type.payment_count || 0) > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="text-xs">
                                    {type.payment_count} {language === 'bn' ? 'পেমেন্ট' : 'payments'}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {language === 'bn' 
                                    ? 'এই ক্যাটাগরিতে পেমেন্ট আছে তাই মুছে ফেলা যাবে না'
                                    : 'This category has payments and cannot be deleted'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingType 
                ? (language === 'bn' ? 'পেমেন্ট ক্যাটাগরি সম্পাদনা' : 'Edit Payment Category')
                : (language === 'bn' ? 'নতুন পেমেন্ট ক্যাটাগরি' : 'New Payment Category')}
            </DialogTitle>
            <DialogDescription>
              {language === 'bn' 
                ? 'পেমেন্ট ক্যাটাগরির বিবরণ দিন। এটি পেমেন্ট সংগ্রহের সময় ব্যবহৃত হবে।'
                : 'Define the payment category details. This will be used when collecting payments.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Names */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'নাম (ইংরেজি) *' : 'Name (English) *'}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (nameError) validateName(e.target.value);
                  }}
                  placeholder="Monthly Contribution"
                  className={nameError ? 'border-destructive' : ''}
                />
                {nameError && (
                  <p className="text-xs text-destructive">{nameError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>নাম (বাংলা)</Label>
                <Input
                  value={formData.name_bn}
                  onChange={(e) => setFormData({ ...formData, name_bn: e.target.value })}
                  placeholder="মাসিক চাঁদা"
                  className="font-bengali"
                />
              </div>
            </div>

            {/* Category Type */}
            <div className="space-y-2">
              <Label>{language === 'bn' ? 'ক্যাটাগরি টাইপ *' : 'Category Type *'}</Label>
              <Select 
                value={formData.category_type} 
                onValueChange={(v) => setFormData({ 
                  ...formData, 
                  category_type: v as 'monthly' | 'fund_raise' | 'other',
                  is_fixed_amount: v === 'monthly' ? true : formData.is_fixed_amount
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">
                    {language === 'bn' ? 'মাসিক চাঁদা' : 'Monthly Contribution'}
                  </SelectItem>
                  <SelectItem value="fund_raise">
                    {language === 'bn' ? 'ফান্ড রেইজ' : 'Fund Raise'}
                  </SelectItem>
                  <SelectItem value="other">
                    {language === 'bn' ? 'অন্যান্য' : 'Others'}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.category_type === 'monthly' 
                  ? (language === 'bn' ? 'মাসিক চাঁদা সাধারণত নির্ধারিত পরিমাণ হয়' : 'Monthly contributions are typically fixed amounts')
                  : formData.category_type === 'fund_raise'
                    ? (language === 'bn' ? 'ফান্ড রেইজ সাধারণত নমনীয় পরিমাণ হয়' : 'Fund raises are typically flexible amounts')
                    : (language === 'bn' ? 'অন্যান্য ধরনের পেমেন্ট' : 'Other types of payments')}
              </p>
            </div>

            {/* Amount Settings */}
            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {language === 'bn' ? 'নির্ধারিত পরিমাণ' : 'Fixed Amount'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'bn' 
                      ? 'সকল সদস্যের জন্য একই পরিমাণ' 
                      : 'Same amount for all members'}
                  </p>
                </div>
                <Switch
                  checked={formData.is_fixed_amount}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_fixed_amount: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  {formData.is_fixed_amount 
                    ? (language === 'bn' ? 'নির্ধারিত পরিমাণ *' : 'Fixed Amount *')
                    : (language === 'bn' ? 'ডিফল্ট পরিমাণ (ঐচ্ছিক)' : 'Default Amount (Optional)')}
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">৳</span>
                  <Input
                    type="number"
                    value={formData.default_amount}
                    onChange={(e) => setFormData({ ...formData, default_amount: Number(e.target.value) })}
                    className="pl-8"
                    min={0}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.is_fixed_amount
                    ? (language === 'bn' ? 'এই পরিমাণ পেমেন্ট ফর্মে স্বয়ংক্রিয়ভাবে সেট হবে' : 'This amount will be auto-filled in payment forms')
                    : (language === 'bn' ? 'ডিফল্ট হিসেবে দেখাবে, কিন্তু পরিবর্তন করা যাবে' : 'Will be shown as default, but can be changed')}
                </p>
              </div>
            </div>

            {/* Descriptions */}
            <div className="space-y-2">
              <Label>{language === 'bn' ? 'বিবরণ (ঐচ্ছিক)' : 'Description (Optional)'}</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={language === 'bn' ? 'সংক্ষিপ্ত বিবরণ...' : 'Brief description...'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {language === 'bn' ? 'বাতিল' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name.trim() || saving}
              className="gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingType 
                ? (language === 'bn' ? 'আপডেট করুন' : 'Update')
                : (language === 'bn' ? 'যোগ করুন' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={language === 'bn' ? 'ক্যাটাগরি নিষ্ক্রিয় করুন' : 'Disable Category'}
        description={
          language === 'bn'
            ? `আপনি কি "${confirmDialog.type?.name}" ক্যাটাগরি নিষ্ক্রিয় করতে চান? নিষ্ক্রিয় ক্যাটাগরি নতুন পেমেন্টে ব্যবহার করা যাবে না, তবে পুরানো পেমেন্ট রেকর্ড অপরিবর্তিত থাকবে।`
            : `Are you sure you want to disable "${confirmDialog.type?.name}"? Inactive categories cannot be used for new payments, but existing payment records will remain unchanged.`
        }
        confirmLabel={language === 'bn' ? 'নিষ্ক্রিয় করুন' : 'Disable'}
        cancelLabel={language === 'bn' ? 'বাতিল' : 'Cancel'}
        variant="destructive"
        onConfirm={() => {
          if (confirmDialog.type) {
            handleToggleActive(confirmDialog.type);
          }
        }}
      />
    </>
  );
}
