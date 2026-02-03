import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SEO } from '@/components/common/SEO';
import { ScrollAnimation } from '@/components/common/ScrollAnimation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import {
  Smartphone,
  Download,
  Share,
  Plus,
  MoreVertical,
  Chrome,
  Apple,
  CheckCircle2,
  Wifi,
  WifiOff,
  Bell,
  Zap,
  Shield,
  ArrowDown,
} from 'lucide-react';

export function InstallAppPage() {
  const { language } = useLanguage();
  const { canInstall, isInstalled, installApp } = usePWAInstall();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const benefits = [
    {
      icon: Zap,
      title: language === 'bn' ? 'দ্রুত লোডিং' : 'Fast Loading',
      description: language === 'bn' 
        ? 'অ্যাপ ইনস্টল করলে তা সরাসরি আপনার ফোনে থাকবে এবং দ্রুত লোড হবে।'
        : 'The app loads instantly from your device, much faster than a website.',
    },
    {
      icon: WifiOff,
      title: language === 'bn' ? 'অফলাইন অ্যাক্সেস' : 'Offline Access',
      description: language === 'bn'
        ? 'ইন্টারনেট সংযোগ ছাড়াও বেসিক ফিচার ব্যবহার করতে পারবেন।'
        : 'Access basic features even when you don\'t have internet connection.',
    },
    {
      icon: Bell,
      title: language === 'bn' ? 'নোটিফিকেশন' : 'Notifications',
      description: language === 'bn'
        ? 'পেমেন্ট রিমাইন্ডার ও গুরুত্বপূর্ণ আপডেট সরাসরি পাবেন।'
        : 'Get payment reminders and important updates directly on your phone.',
    },
    {
      icon: Shield,
      title: language === 'bn' ? 'নিরাপদ' : 'Secure',
      description: language === 'bn'
        ? 'ব্যাংক-লেভেল নিরাপত্তা সহ আপনার ডেটা সুরক্ষিত।'
        : 'Your data is protected with bank-level security.',
    },
  ];

  const iosSteps = [
    {
      icon: Share,
      title: language === 'bn' ? 'শেয়ার বাটনে ট্যাপ করুন' : 'Tap the Share button',
      description: language === 'bn'
        ? 'Safari-তে নিচে শেয়ার আইকন (বাক্স থেকে তীর) ট্যাপ করুন।'
        : 'In Safari, tap the share icon (box with arrow) at the bottom.',
    },
    {
      icon: Plus,
      title: language === 'bn' ? '"Add to Home Screen" সিলেক্ট করুন' : 'Select "Add to Home Screen"',
      description: language === 'bn'
        ? 'মেনু স্ক্রল করে "Add to Home Screen" অপশন খুঁজুন।'
        : 'Scroll down the menu and find "Add to Home Screen".',
    },
    {
      icon: CheckCircle2,
      title: language === 'bn' ? '"Add" ট্যাপ করুন' : 'Tap "Add"',
      description: language === 'bn'
        ? 'উপরে ডানে "Add" বাটনে ট্যাপ করলেই ইনস্টল হয়ে যাবে।'
        : 'Tap "Add" in the top right corner to complete installation.',
    },
  ];

  const androidSteps = [
    {
      icon: MoreVertical,
      title: language === 'bn' ? 'মেনু বাটনে ট্যাপ করুন' : 'Tap the Menu button',
      description: language === 'bn'
        ? 'Chrome-এ উপরে ডানে তিন ডট মেনু আইকন ট্যাপ করুন।'
        : 'In Chrome, tap the three-dot menu icon in the top right.',
    },
    {
      icon: Download,
      title: language === 'bn' ? '"Install App" সিলেক্ট করুন' : 'Select "Install App"',
      description: language === 'bn'
        ? 'মেনু থেকে "Install App" বা "Add to Home Screen" অপশন খুঁজুন।'
        : 'Find "Install App" or "Add to Home Screen" in the menu.',
    },
    {
      icon: CheckCircle2,
      title: language === 'bn' ? '"Install" ট্যাপ করুন' : 'Tap "Install"',
      description: language === 'bn'
        ? 'প্রম্পটে "Install" বাটনে ট্যাপ করলেই অ্যাপ ইনস্টল হবে।'
        : 'Tap "Install" in the prompt to complete installation.',
    },
  ];

  return (
    <>
      <SEO 
        title={language === 'bn' ? 'অ্যাপ ইনস্টল করুন' : 'Install App'}
        description={language === 'bn' 
          ? 'Somiti App আপনার মোবাইলে ইনস্টল করুন। দ্রুত অ্যাক্সেস, অফলাইন সাপোর্ট এবং নোটিফিকেশন পান।'
          : 'Install Somiti App on your mobile. Get fast access, offline support, and notifications.'}
        keywords={['install somiti app', 'pwa install', 'mobile app', 'অ্যাপ ইনস্টল']}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container relative mx-auto px-4">
          <ScrollAnimation animation="fade-up" className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4 gap-1">
              <Smartphone className="h-3 w-3" />
              {language === 'bn' ? 'মোবাইল অ্যাপ' : 'Mobile App'}
            </Badge>
            <h1 className="text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
              {language === 'bn' 
                ? 'Somiti App ইনস্টল করুন'
                : 'Install Somiti App'}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              {language === 'bn' 
                ? 'আপনার ফোনের হোম স্ক্রিনে অ্যাপ যোগ করুন। কোনো অ্যাপ স্টোর লাগবে না, সরাসরি ব্রাউজার থেকে ইনস্টল করুন।'
                : 'Add the app to your phone\'s home screen. No app store needed, install directly from your browser.'}
            </p>

            {/* Status badges */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Badge variant={isOnline ? 'default' : 'secondary'} className="gap-1">
                {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isOnline 
                  ? (language === 'bn' ? 'অনলাইন' : 'Online')
                  : (language === 'bn' ? 'অফলাইন' : 'Offline')}
              </Badge>
              {isInstalled && (
                <Badge variant="default" className="gap-1 bg-success">
                  <CheckCircle2 className="h-3 w-3" />
                  {language === 'bn' ? 'ইনস্টল করা আছে' : 'Already Installed'}
                </Badge>
              )}
            </div>

            {/* Install button for supported browsers */}
            {canInstall && !isInstalled && (
              <ScrollAnimation animation="zoom-in" delay={200} className="mt-8">
                <Button 
                  size="lg" 
                  onClick={installApp}
                  className="bg-gradient-primary shadow-glow gap-2 text-lg px-8 py-6"
                >
                  <Download className="h-5 w-5" />
                  {language === 'bn' ? 'এখনই ইনস্টল করুন' : 'Install Now'}
                </Button>
                <p className="mt-3 text-sm text-muted-foreground">
                  {language === 'bn' 
                    ? 'একটি ক্লিকে ইনস্টল হবে'
                    : 'One-click installation'}
                </p>
              </ScrollAnimation>
            )}

            {isInstalled && (
              <ScrollAnimation animation="zoom-in" delay={200} className="mt-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-6 py-3 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">
                    {language === 'bn' 
                      ? 'অ্যাপ ইতিমধ্যে ইনস্টল করা আছে!'
                      : 'App is already installed!'}
                  </span>
                </div>
              </ScrollAnimation>
            )}
          </ScrollAnimation>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <ScrollAnimation animation="fade-up" className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {language === 'bn' ? 'কেন ইনস্টল করবেন?' : 'Why Install?'}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {language === 'bn' 
                ? 'ওয়েবসাইট ব্রাউজ করার চেয়ে অ্যাপ ব্যবহার অনেক সুবিধাজনক'
                : 'Using the app is much more convenient than browsing the website'}
            </p>
          </ScrollAnimation>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <ScrollAnimation key={index} animation="zoom-in" delay={index * 100}>
                <Card className="text-center h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <benefit.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* Installation Instructions */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <ScrollAnimation animation="fade-up" className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {language === 'bn' ? 'কিভাবে ইনস্টল করবেন' : 'How to Install'}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {language === 'bn' 
                ? 'আপনার ফোনের অপারেটিং সিস্টেম অনুযায়ী নির্দেশনা অনুসরণ করুন'
                : 'Follow the instructions based on your phone\'s operating system'}
            </p>
          </ScrollAnimation>

          <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
            {/* iOS Instructions */}
            <ScrollAnimation animation="fade-right">
              <Card className="h-full">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-600">
                    <Apple className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">iPhone / iPad</CardTitle>
                  <CardDescription>
                    {language === 'bn' ? 'Safari ব্রাউজার ব্যবহার করুন' : 'Use Safari browser'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {iosSteps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground flex items-center gap-2">
                          <step.icon className="h-4 w-4 text-primary" />
                          {step.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </ScrollAnimation>

            {/* Android Instructions */}
            <ScrollAnimation animation="fade-left">
              <Card className="h-full">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700">
                    <Chrome className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Android</CardTitle>
                  <CardDescription>
                    {language === 'bn' ? 'Chrome ব্রাউজার ব্যবহার করুন' : 'Use Chrome browser'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {androidSteps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground flex items-center gap-2">
                          <step.icon className="h-4 w-4 text-primary" />
                          {step.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <ScrollAnimation animation="zoom-in">
            <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 p-8 md:p-12">
              <ArrowDown className="mx-auto h-12 w-12 text-primary mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                {language === 'bn' 
                  ? 'এখনই শুরু করুন'
                  : 'Get Started Now'}
              </h2>
              <p className="mt-4 text-muted-foreground">
                {language === 'bn' 
                  ? 'আপনার সমিতির হিসাব-নিকাশ সহজ করুন। বিনামূল্যে শুরু করুন।'
                  : 'Simplify your somiti\'s accounting. Start for free.'}
              </p>
              {canInstall && !isInstalled ? (
                <Button 
                  size="lg" 
                  onClick={installApp}
                  className="mt-8 bg-gradient-primary shadow-glow gap-2"
                >
                  <Download className="h-4 w-4" />
                  {language === 'bn' ? 'অ্যাপ ইনস্টল করুন' : 'Install App'}
                </Button>
              ) : (
                <div className="mt-8 text-sm text-muted-foreground">
                  {isInstalled
                    ? (language === 'bn' ? '✓ অ্যাপ ইনস্টল করা আছে' : '✓ App is installed')
                    : (language === 'bn' 
                        ? 'উপরের নির্দেশনা অনুসরণ করে ইনস্টল করুন' 
                        : 'Follow the instructions above to install')}
                </div>
              )}
            </div>
          </ScrollAnimation>
        </div>
      </section>
    </>
  );
}
