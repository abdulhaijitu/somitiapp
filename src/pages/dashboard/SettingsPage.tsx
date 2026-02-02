import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Building2, 
  Globe, 
  CreditCard, 
  Bell,
  Shield
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
          Manage your somiti settings and preferences
        </p>
      </div>

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
                  <CardTitle>Organization Information</CardTitle>
                  <CardDescription>Basic details about your somiti</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Somiti Name</Label>
                  <Input id="name" defaultValue="ABC Somiti" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameBn">Name (Bangla)</Label>
                  <Input id="nameBn" defaultValue="এবিসি সমিতি" className="font-bengali" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" defaultValue="Dhaka, Bangladesh" />
              </div>
              <Button className="bg-gradient-primary hover:opacity-90">
                Save Changes
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
                  <CardTitle>Language Preferences</CardTitle>
                  <CardDescription>Choose your preferred language</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Use Bangla</p>
                  <p className="text-sm text-muted-foreground">
                    Display interface in Bengali language
                  </p>
                </div>
                <Switch 
                  checked={language === 'bn'} 
                  onCheckedChange={toggleLanguage}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Bell className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Manage notification preferences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Payment Reminders</p>
                  <p className="text-sm text-muted-foreground">SMS reminders for dues</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">New Notices</p>
                  <p className="text-sm text-muted-foreground">Notify when new notices are posted</p>
                </div>
                <Switch defaultChecked />
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
                  <CardTitle className="text-lg">Subscription</CardTitle>
                  <CardDescription>Active Plan</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <span className="font-medium text-foreground">Standard</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Next Billing</span>
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
                  <CardTitle className="text-lg">Security</CardTitle>
                  <CardDescription>Account protection</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
