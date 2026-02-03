import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building2, Loader2, Eye, EyeOff } from 'lucide-react';
import { SEO } from '@/components/common/SEO';
import { pageConfigs } from '@/lib/seo';
import { useAnalytics } from '@/hooks/useAnalytics';

export function TenantLoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackLoginAttempt, trackLoginSuccess, trackLoginFailure } = useAnalytics();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Check if user has admin or manager role for a tenant
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role, tenant_id')
          .eq('user_id', session.user.id)
          .in('role', ['admin', 'manager'])
          .maybeSingle();

        if (roleData?.tenant_id) {
          navigate('/dashboard');
          return;
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setCheckingSession(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    trackLoginAttempt();
    
    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Authentication failed');
      }

      // Check if user has admin or manager role for a tenant
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, tenant_id')
        .eq('user_id', authData.user.id)
        .in('role', ['admin', 'manager'])
        .maybeSingle();

      if (roleError) {
        console.error('Role check error:', roleError);
        await supabase.auth.signOut();
        throw new Error('Failed to verify permissions');
      }

      if (!roleData || !roleData.tenant_id) {
        // User is not a tenant admin/manager
        await supabase.auth.signOut();
        throw new Error('Access denied. Tenant Admin privileges required.');
      }

      trackLoginSuccess();
      
      toast({
        title: 'Login Successful',
        description: 'Welcome to your Dashboard',
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      trackLoginFailure();
      
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <SEO {...pageConfigs.login} />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Tenant Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access your organization dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@yourorg.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => navigate('/forgot-password')}
                className="text-muted-foreground hover:text-primary"
              >
                Forgot password?
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
            >
              ← Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
