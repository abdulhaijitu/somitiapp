import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Phone, KeyRound, Users, ArrowLeft } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { SEO } from '@/components/common/SEO';
import { pageConfigs, defaultBrandConfig } from '@/lib/seo';
import { DeveloperCredit } from '@/components/common/DeveloperCredit';

type Step = 'phone' | 'otp';

export function MemberLoginPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [sessionData, setSessionData] = useState<{ token: string; userId: string } | null>(null);

  const t = (en: string, bn: string) => language === 'bn' ? bn : en;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || phone.length < 10) {
      toast({
        title: t('Error', 'ত্রুটি'),
        description: t('Please enter a valid phone number', 'অনুগ্রহ করে একটি বৈধ ফোন নম্বর দিন'),
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('member-otp', {
        body: { action: 'send', phone }
      });

      if (error) throw error;

      if (!data.success) {
        toast({
          title: t('Error', 'ত্রুটি'),
          description: language === 'bn' ? data.error_bn : data.error,
          variant: 'destructive'
        });
        return;
      }

      setMemberName(data.member_name);
      setDemoOtp(data.demo_otp || ''); // For demo only
      setStep('otp');
      
      toast({
        title: t('OTP Sent', 'OTP পাঠানো হয়েছে'),
        description: language === 'bn' ? data.message_bn : data.message
      });
    } catch (error: any) {
      console.error('Send OTP error:', error);
      toast({
        title: t('Error', 'ত্রুটি'),
        description: error.message || t('Failed to send OTP', 'OTP পাঠাতে ব্যর্থ'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast({
        title: t('Error', 'ত্রুটি'),
        description: t('Please enter a valid 6-digit OTP', 'অনুগ্রহ করে ৬ সংখ্যার OTP দিন'),
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Verify OTP
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('member-otp', {
        body: { action: 'verify', phone, otp }
      });

      if (verifyError) throw verifyError;

      if (!verifyData.success) {
        toast({
          title: t('Error', 'ত্রুটি'),
          description: language === 'bn' ? verifyData.error_bn : verifyData.error,
          variant: 'destructive'
        });
        return;
      }

      // Step 2: Exchange token for session
      const { data: sessionResult, error: sessionError } = await supabase.functions.invoke('member-session', {
        body: { 
          session_token: verifyData.session_token,
          user_id: verifyData.user_id
        }
      });

      if (sessionError) throw sessionError;

      if (!sessionResult.success) {
        throw new Error(sessionResult.error);
      }

      // Step 3: Sign in with the credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: sessionResult.email,
        password: sessionResult.password
      });

      if (signInError) throw signInError;

      toast({
        title: t('Welcome!', 'স্বাগতম!'),
        description: t(`Welcome back, ${memberName}`, `স্বাগতম, ${memberName}`)
      });

      navigate('/member');
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      toast({
        title: t('Error', 'ত্রুটি'),
        description: error.message || t('Failed to verify OTP', 'OTP যাচাই করতে ব্যর্থ'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30">
      <SEO {...pageConfigs.memberLogin} />
      
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('Home', 'হোম')}
          </Button>
          <LanguageToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold font-bengali">
                {t('Member Portal', 'সদস্য পোর্টাল')}
              </CardTitle>
              <CardDescription className="font-bengali">
                {step === 'phone' 
                  ? t('Enter your registered phone number to login', 'লগইন করতে আপনার নিবন্ধিত ফোন নম্বর দিন')
                  : t('Enter the OTP sent to your phone', 'আপনার ফোনে পাঠানো OTP দিন')
                }
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            {step === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-bengali">
                    {t('Phone Number', 'ফোন নম্বর')}
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground font-bengali">
                    {t('Enter the phone number registered with your somiti', 'আপনার সমিতিতে নিবন্ধিত ফোন নম্বর দিন')}
                  </p>
                </div>

                <Button type="submit" className="w-full font-bengali" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('Sending OTP...', 'OTP পাঠানো হচ্ছে...')}
                    </>
                  ) : (
                    t('Send OTP', 'OTP পাঠান')
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {memberName && (
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground font-bengali">
                      {t('Welcome', 'স্বাগতম')},
                    </p>
                    <p className="font-semibold font-bengali">{memberName}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="font-bengali">
                    {t('Enter OTP', 'OTP দিন')}
                  </Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                      disabled={isLoading}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  
                  {/* Demo OTP Display - Remove in production! */}
                  {demoOtp && (
                    <div className="mt-2 p-2 bg-muted rounded text-center border border-border">
                      <p className="text-xs text-muted-foreground">
                        Demo OTP: <span className="font-mono font-bold text-foreground">{demoOtp}</span>
                      </p>
                    </div>
                  )}
                </div>

                <Button type="submit" className="w-full font-bengali" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('Verifying...', 'যাচাই করা হচ্ছে...')}
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      {t('Verify & Login', 'যাচাই করুন এবং লগইন করুন')}
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStep('phone');
                      setOtp('');
                      setDemoOtp('');
                    }}
                    disabled={isLoading}
                    className="font-bengali"
                  >
                    {t('Change number', 'নম্বর পরিবর্তন')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSendOtp}
                    disabled={isLoading}
                    className="font-bengali"
                  >
                    {t('Resend OTP', 'আবার OTP পাঠান')}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-border text-center">
              <p className="text-sm text-muted-foreground font-bengali">
                {t('Are you an admin?', 'আপনি কি অ্যাডমিন?')}{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto font-bengali"
                  onClick={() => navigate('/login')}
                >
                  {t('Login here', 'এখানে লগইন করুন')}
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-sm text-muted-foreground">
        <p className="font-bengali">
          © {new Date().getFullYear()} {defaultBrandConfig.appName}. {t('All rights reserved.', 'সমস্ত অধিকার সংরক্ষিত।')}
        </p>
      </footer>
      
      {/* Developer Credit */}
      <DeveloperCredit />
    </div>
  );
}
