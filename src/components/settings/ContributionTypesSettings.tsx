import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2,
  Banknote,
  HandCoins,
  MoreHorizontal
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
      const { data, error } = await supabase
        .from('contribution_types')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('sort_order');

      if (error) throw error;
      setTypes((data || []) as unknown as ContributionType[]);
    } catch (error) {
      console.error('Error loading contribution types:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি' : 'Error',
        description: language === 'bn' 
          ? 'চাঁদার ধরন লোড করতে সমস্যা হয়েছে' 
          : 'Failed to load contribution types',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (type?: ContributionType) => {
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
    if (!tenant?.id || !formData.name.trim()) return;

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
          description: language === 'bn' ? 'চাঁদার ধরন আপডেট হয়েছে' : 'Contribution type updated',
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
          description: language === 'bn' ? 'নতুন চাঁদার ধরন যোগ হয়েছে' : 'Contribution type created',
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
          : 'Failed to save contribution type',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (type: ContributionType) => {
    try {
      const { error } = await supabase
        .from('contribution_types')
        .update({ is_active: !type.is_active })
        .eq('id', type.id);

      if (error) throw error;
      
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
                  {language === 'bn' ? 'চাঁদার ধরন' : 'Contribution Types'}
                </CardTitle>
                <CardDescription>
                  {language === 'bn' 
                    ? 'পেমেন্ট ক্যাটাগরি কনফিগার করুন'
                    : 'Configure payment categories for your somiti'}
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              {language === 'bn' ? 'নতুন যোগ করুন' : 'Add New'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {types.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <HandCoins className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{language === 'bn' ? 'কোনো চাঁদার ধরন নেই' : 'No contribution types defined'}</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4" />
                {language === 'bn' ? 'প্রথম টাইপ যোগ করুন' : 'Add your first type'}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'bn' ? 'নাম' : 'Name'}</TableHead>
                  <TableHead>{language === 'bn' ? 'ক্যাটাগরি' : 'Category'}</TableHead>
                  <TableHead className="text-right">{language === 'bn' ? 'পরিমাণ' : 'Amount'}</TableHead>
                  <TableHead className="text-center">{language === 'bn' ? 'সক্রিয়' : 'Active'}</TableHead>
                  <TableHead className="text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <Badge variant={getCategoryBadgeVariant(type.category_type)}>
                        {getCategoryLabel(type.category_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {type.is_fixed_amount ? (
                        <span className="font-medium">৳{type.default_amount}</span>
                      ) : (
                        <span className="text-muted-foreground">
                          {language === 'bn' ? 'নমনীয়' : 'Flexible'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={type.is_active}
                        onCheckedChange={() => handleToggleActive(type)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleOpenDialog(type)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingType 
                ? (language === 'bn' ? 'চাঁদার ধরন সম্পাদনা' : 'Edit Contribution Type')
                : (language === 'bn' ? 'নতুন চাঁদার ধরন' : 'New Contribution Type')}
            </DialogTitle>
            <DialogDescription>
              {language === 'bn' 
                ? 'পেমেন্ট ক্যাটাগরির বিবরণ দিন'
                : 'Define the payment category details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Names */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'bn' ? 'নাম (ইংরেজি) *' : 'Name (English) *'}</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Monthly Contribution"
                />
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
              <Label>{language === 'bn' ? 'ক্যাটাগরি টাইপ' : 'Category Type'}</Label>
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
            </div>

            {/* Amount Settings */}
            <div className="space-y-4 rounded-lg border p-4">
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
                    ? (language === 'bn' ? 'নির্ধারিত পরিমাণ' : 'Fixed Amount')
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
    </>
  );
}
