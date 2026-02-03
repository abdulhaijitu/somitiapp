import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { SEO, getOrganizationSchema } from '@/components/common/SEO';
import { pageConfigs, defaultBrandConfig } from '@/lib/seo';
import { useAnalytics, useScrollTracking } from '@/hooks/useAnalytics';
import { DeveloperCredit } from '@/components/common/DeveloperCredit';
import { FloatingActions } from '@/components/common/FloatingActions';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import heroDashboard from '@/assets/hero-dashboard.png';
import { 
  Users, 
  CreditCard, 
  FileText, 
  Bell, 
  Shield, 
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Menu,
  X
} from 'lucide-react';

export function LandingPage() {
  const { t } = useLanguage();
  const { trackCTA } = useAnalytics();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Track scroll depth on landing page
  useScrollTracking();

  const navLinks = [
    { label: 'Investors', href: '/pitch' },
    { label: 'Roadmap', href: '/mobile-roadmap' },
    { label: 'Admin', href: '/super-admin' },
  ];

  const features = [
    {
      icon: Users,
      title: t('landing.features.members'),
      description: 'Add, manage, and track all your somiti members in one place.',
    },
    {
      icon: CreditCard,
      title: t('landing.features.payments'),
      description: 'Track online and offline payments with detailed histories.',
    },
    {
      icon: BarChart3,
      title: t('landing.features.reports'),
      description: 'Generate monthly and yearly financial reports with exports.',
    },
    {
      icon: Bell,
      title: t('landing.features.notices'),
      description: 'Publish notices and updates for all members to see.',
    },
  ];

  const benefits = [
    'Multi-tenant architecture for multiple somitis',
    'Role-based access control (Admin, Manager, Member)',
    'Mobile-first with OTP authentication',
    'Bilingual support (English & বাংলা)',
    'Secure data isolation per organization',
    'Export reports to PDF and Excel',
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        {...pageConfigs.home}
        structuredData={getOrganizationSchema()}
      />
      
      {/* Enhanced Header with Glassmorphism */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <Shield className="h-5 w-5 text-primary-foreground" />
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-primary opacity-30 blur-sm" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-foreground">Somiti</span>
              <span className="ml-1 text-xs font-medium text-primary">App</span>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                to={link.href} 
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <LanguageToggle />
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="font-medium">
                {t('auth.login')}
              </Button>
            </Link>
            <Button size="sm" className="bg-gradient-primary font-medium shadow-glow hover:opacity-90">
              {t('auth.signup')}
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageToggle />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header */}
                  <div className="flex items-center justify-between border-b border-border p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                        <Shield className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <span className="font-bold text-foreground">Somiti</span>
                    </div>
                  </div>
                  
                  {/* Mobile Navigation Links */}
                  <nav className="flex-1 p-4">
                    <div className="space-y-1">
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          to={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </nav>
                  
                  {/* Mobile Menu Footer */}
                  <div className="border-t border-border p-4 space-y-3">
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full font-medium">
                        {t('auth.login')}
                      </Button>
                    </Link>
                    <Button className="w-full bg-gradient-primary font-medium shadow-glow hover:opacity-90">
                      {t('auth.signup')}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 lg:py-40">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-gradient-subtle" />
        <div className="absolute inset-0">
          {/* Gradient Orbs */}
          <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/4 h-96 w-96 animate-pulse rounded-full bg-accent/10 blur-3xl" style={{ animationDelay: '1s' }} />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-info/10 blur-3xl" style={{ animationDelay: '2s' }} />
          
          {/* Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
              backgroundSize: '60px 60px'
            }}
          />
        </div>
        
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            {/* Animated Badge */}
            <div className="mb-8 inline-flex animate-fade-in items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm">
              <div className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </div>
              <Smartphone className="h-4 w-4" />
              <span>Mobile-first platform for Bangladesh</span>
            </div>
            
            {/* Main Headline with Animation */}
            <h1 className="animate-slide-up text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="block">{t('landing.hero.title').split(' ').slice(0, 3).join(' ')}</span>
              <span className="mt-2 block bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                {t('landing.hero.title').split(' ').slice(3).join(' ') || 'Somiti'}
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="mx-auto mt-6 max-w-2xl animate-slide-up text-lg text-muted-foreground sm:text-xl" style={{ animationDelay: '100ms' }}>
              {t('landing.hero.subtitle')}
            </p>
            
            {/* CTA Buttons */}
            <div className="mt-10 flex animate-slide-up flex-col items-center gap-4 sm:flex-row sm:justify-center" style={{ animationDelay: '200ms' }}>
              <Button 
                size="lg" 
                className="group relative gap-2 overflow-hidden bg-gradient-primary px-8 py-6 text-base font-semibold shadow-glow transition-all hover:shadow-xl"
                onClick={() => trackCTA('hero_get_started')}
              >
                <span className="relative z-10">{t('landing.hero.cta')}</span>
                <ArrowRight className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 -z-0 bg-gradient-to-r from-primary to-primary/80 opacity-0 transition-opacity group-hover:opacity-100" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2 border-2 px-8 py-6 text-base font-semibold transition-all hover:bg-primary/5"
                onClick={() => trackCTA('hero_view_demo')}
              >
                <FileText className="h-5 w-5" />
                View Demo
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-12 flex animate-slide-up flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>বাংলা supported</span>
              </div>
            </div>
          </div>
          
          {/* Hero Visual - AI Generated Dashboard Image */}
          <div className="relative mx-auto mt-16 max-w-5xl animate-slide-up" style={{ animationDelay: '400ms' }}>
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 opacity-60 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <img 
                src={heroDashboard} 
                alt="Somiti Dashboard - Modern financial management interface" 
                className="w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
              />
              {/* Overlay gradient for text readability if needed */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent opacity-0" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {t('landing.features.title')}
            </h2>
            <p className="mt-4 text-muted-foreground">
              Comprehensive tools to manage your association efficiently
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="border-y border-border bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                Built for Modern Associations
              </h2>
              <p className="mt-4 text-muted-foreground">
                Everything you need to run your somiti professionally, with enterprise-grade security and Bangladesh-first features.
              </p>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-video overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                <div className="flex h-full items-center justify-center bg-gradient-subtle p-8">
                  <div className="grid w-full max-w-sm gap-4">
                    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10" />
                        <div className="space-y-1">
                          <div className="h-3 w-24 rounded bg-muted" />
                          <div className="h-2 w-16 rounded bg-muted" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                        <div className="h-2 w-12 rounded bg-muted" />
                        <div className="mt-2 h-6 w-16 rounded bg-primary/20" />
                      </div>
                      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                        <div className="h-2 w-12 rounded bg-muted" />
                        <div className="mt-2 h-6 w-16 rounded bg-success/20" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-primary p-8 text-center shadow-glow md:p-12">
            <h2 className="text-2xl font-bold text-primary-foreground md:text-3xl">
              Ready to Get Started?
            </h2>
            <p className="mt-3 text-primary-foreground/80">
              Join hundreds of somitis already using our platform.
            </p>
            <Button 
              size="lg" 
              className="mt-6 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} {defaultBrandConfig.appName}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <a href="mailto:support@somitiapp.com" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>
      
      {/* Developer Credit */}
      <DeveloperCredit />
      
      {/* Floating Actions */}
      <FloatingActions />
    </div>
  );
}
