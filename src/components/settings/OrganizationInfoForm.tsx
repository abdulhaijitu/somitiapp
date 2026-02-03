import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Building2, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { Skeleton } from '@/components/ui/skeleton';

const organizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  name_bn: z.string().min(1, 'Bengali name is required'),
  address: z.string().min(1, 'Address is required'),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

export function OrganizationInfoForm() {
  const { language } = useLanguage();
  const { tenant, isLoading, isSaving, updateTenantSettings } = useTenantSettings();

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      name_bn: '',
      address: '',
    },
  });

  // Populate form when tenant data loads
  useEffect(() => {
    if (tenant) {
      form.reset({
        name: tenant.name || '',
        name_bn: tenant.name_bn || '',
        address: tenant.address || '',
      });
    }
  }, [tenant, form]);

  const onSubmit = async (data: OrganizationFormData) => {
    await updateTenantSettings({
      name: data.name,
      name_bn: data.name_bn,
      address: data.address,
    });
  };

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>
              {language === 'bn' ? 'প্রতিষ্ঠানের তথ্য' : 'Organization Information'}
            </CardTitle>
            <CardDescription>
              {language === 'bn' ? 'আপনার সমিতির মৌলিক তথ্য' : 'Basic details about your somiti'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {language === 'bn' ? 'সমিতির নাম' : 'Somiti Name'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={language === 'bn' ? 'সমিতির নাম লিখুন' : 'Enter somiti name'}
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name_bn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {language === 'bn' ? 'নাম (বাংলা)' : 'Name (Bangla)'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={language === 'bn' ? 'বাংলায় নাম লিখুন' : 'Enter name in Bangla'}
                        className="font-bengali"
                        disabled={isSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {language === 'bn' ? 'ঠিকানা' : 'Address'}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder={language === 'bn' ? 'ঠিকানা লিখুন' : 'Enter address'}
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              disabled={isSaving || !form.formState.isDirty}
              className="bg-gradient-primary hover:opacity-90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}
                </>
              ) : (
                language === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
