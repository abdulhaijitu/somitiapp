import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus } from 'lucide-react';

interface AddTenantAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: { id: string; name: string } | null;
  onSuccess?: () => void;
}

export function AddTenantAdminDialog({
  open,
  onOpenChange,
  tenant,
  onSuccess
}: AddTenantAdminDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    if (!formData.email || !formData.password) {
      toast({
        title: 'Validation Error',
        description: 'Email and password are required',
        variant: 'destructive'
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: 'Error',
          description: 'Not authenticated',
          variant: 'destructive'
        });
        return;
      }

      const response = await supabase.functions.invoke('add-tenant-admin', {
        body: {
          tenant_id: tenant.id,
          admin_email: formData.email,
          admin_password: formData.password,
          admin_name: formData.name || undefined
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to add admin');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: 'Success',
        description: `Admin added to ${tenant.name} successfully`
      });

      setFormData({ email: '', password: '', name: '' });
      onOpenChange(false);
      onSuccess?.();

    } catch (error: any) {
      console.error('Error adding admin:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add admin',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add Admin to {tenant?.name}
          </DialogTitle>
          <DialogDescription>
            Create a new admin user for this tenant or assign admin role to existing user.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Admin Email *</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password">Password *</Label>
            <Input
              id="admin-password"
              type="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-name">Name (Optional)</Label>
            <Input
              id="admin-name"
              type="text"
              placeholder="Admin Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Admin
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
