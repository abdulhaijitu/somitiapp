import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Building2, 
  User, 
  Key, 
  CheckCircle2,
  Copy,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateTenantWithAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface CreatedCredentials {
  email: string;
  password: string;
  subdomain: string;
}

export function CreateTenantWithAdminDialog({
  open,
  onOpenChange,
  onSuccess
}: CreateTenantWithAdminDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(null);
  
  const [formData, setFormData] = useState({
    // Tenant info
    name: '',
    name_bn: '',
    subdomain: '',
    default_language: 'en',
    subscription_months: 1,
    // Admin info
    admin_name: '',
    admin_email: '',
    admin_phone: '',
    admin_password: ''
  });

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleGeneratePassword = () => {
    setFormData({ ...formData, admin_password: generatePassword() });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name || !formData.subdomain) {
      toast({
        title: 'Validation Error',
        description: 'Organization name and subdomain are required',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.admin_email || !formData.admin_password) {
      toast({
        title: 'Validation Error',
        description: 'Admin email and password are required',
        variant: 'destructive'
      });
      return;
    }

    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(formData.subdomain)) {
      toast({
        title: 'Validation Error',
        description: 'Subdomain must contain only lowercase letters, numbers, and hyphens',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Use Edge Function to create tenant with admin user
      const { data, error: fnError } = await supabase.functions.invoke('create-tenant', {
        body: {
          name: formData.name,
          name_bn: formData.name_bn || null,
          subdomain: formData.subdomain.toLowerCase(),
          default_language: formData.default_language,
          subscription_months: formData.subscription_months,
          plan: 'standard',
          // Admin credentials
          admin_email: formData.admin_email,
          admin_password: formData.admin_password,
          admin_name: formData.admin_name || null,
          admin_phone: formData.admin_phone || null,
        }
      });

      if (fnError) {
        throw fnError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const tenant = data?.tenant;

      // Store credentials for display
      setCredentials({
        email: formData.admin_email,
        password: formData.admin_password,
        subdomain: formData.subdomain
      });

      setStep('success');

    } catch (error) {
      console.error('Error creating tenant:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create tenant',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (credentials) {
      const text = `
Somiti Admin Credentials
------------------------
Organization: ${formData.name}
Portal URL: https://${credentials.subdomain}.somitiapp.com

Admin Email: ${credentials.email}
Temporary Password: ${credentials.password}

Please change your password after first login.
      `.trim();
      
      navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: 'Credentials copied to clipboard'
      });
    }
  };

  const handleClose = () => {
    setStep('form');
    setCredentials(null);
    setFormData({
      name: '',
      name_bn: '',
      subdomain: '',
      default_language: 'en',
      subscription_months: 1,
      admin_name: '',
      admin_email: '',
      admin_phone: '',
      admin_password: ''
    });
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        {step === 'form' ? (
          <>
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Create New Tenant with Admin</DialogTitle>
              <DialogDescription>
                Set up a new somiti organization with admin account credentials
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4 overflow-y-auto flex-1">
              {/* Organization Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Building2 className="h-4 w-4" />
                  Organization Details
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name *</Label>
                    <Input
                      id="name"
                      placeholder="ABC Somiti"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name_bn">Name (Bangla)</Label>
                    <Input
                      id="name_bn"
                      placeholder="এবিসি সমিতি"
                      className="font-bengali"
                      value={formData.name_bn}
                      onChange={(e) => setFormData({ ...formData, name_bn: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="subdomain"
                      placeholder="abc-somiti"
                      value={formData.subdomain}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                      })}
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">.somitiapp.com</span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Default Language</Label>
                    <Select 
                      value={formData.default_language}
                      onValueChange={(value) => setFormData({ ...formData, default_language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="bn">বাংলা (Bangla)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Initial Subscription</Label>
                    <Select 
                      value={formData.subscription_months.toString()}
                      onValueChange={(value) => setFormData({ ...formData, subscription_months: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Month</SelectItem>
                        <SelectItem value="3">3 Months</SelectItem>
                        <SelectItem value="6">6 Months</SelectItem>
                        <SelectItem value="12">12 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Admin Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <User className="h-4 w-4" />
                  Tenant Admin Credentials
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="admin_name">Admin Name</Label>
                    <Input
                      id="admin_name"
                      placeholder="Admin Name"
                      value={formData.admin_name}
                      onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin_phone">Phone Number</Label>
                    <Input
                      id="admin_phone"
                      placeholder="+880 1XXX-XXXXXX"
                      value={formData.admin_phone}
                      onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_email">Admin Email *</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    placeholder="admin@example.com"
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_password">Temporary Password *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="admin_password"
                      value={formData.admin_password}
                      onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                      placeholder="Enter or generate password"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleGeneratePassword}
                      className="gap-2"
                    >
                      <Key className="h-4 w-4" />
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this password securely with the tenant admin
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-primary hover:opacity-90"
              >
                {isSubmitting ? 'Creating...' : 'Create Tenant'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                Tenant Created Successfully
              </DialogTitle>
              <DialogDescription>
                Share these credentials securely with the tenant admin
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Save these credentials now. The password cannot be retrieved later.
                </AlertDescription>
              </Alert>

              <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Organization</Label>
                  <p className="font-medium">{formData.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Portal URL</Label>
                  <p className="font-mono text-sm">https://{credentials?.subdomain}.somitiapp.com</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground">Admin Email</Label>
                  <p className="font-mono text-sm">{credentials?.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Temporary Password</Label>
                  <p className="font-mono text-sm bg-warning/10 text-warning px-2 py-1 rounded inline-block">
                    {credentials?.password}
                  </p>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={handleCopyCredentials}
              >
                <Copy className="h-4 w-4" />
                Copy All Credentials
              </Button>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="bg-gradient-primary hover:opacity-90">
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
