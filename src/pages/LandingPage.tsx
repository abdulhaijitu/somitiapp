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
import { MobileBottomNav, BottomNavItem } from '@/components/common/MobileBottomNav';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import heroDashboard from '@/assets/hero-dashboard.png';
import grameenLogo from '@/assets/partners/grameen-logo.png';
import bracLogo from '@/assets/partners/brac-logo.png';
import asaLogo from '@/assets/partners/asa-logo.png';
import tmssLogo from '@/assets/partners/tmss-logo.png';
import shaktiLogo from '@/assets/partners/shakti-logo.png';
import pksfLogo from '@/assets/partners/pksf-logo.png';
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
  Home,
  LogIn,
  Presentation,
  Map,
  Mail,
  Phone,
  MessageSquare,
  Send
} from 'lucide-react';

// Bottom nav items for landing page
const landingBottomNavItems: BottomNavItem[] = [
  { key: 'home', label: 'Home', labelBn: 'হোম', icon: Home, href: '/', end: true },
  { key: 'roadmap', label: 'Roadmap', labelBn: 'রোডম্যাপ', icon: Map, href: '/mobile-roadmap' },
  { key: 'pitch', label: 'Investors', labelBn: 'বিনিয়োগ', icon: Presentation, href: '/pitch' },
  { key: 'login', label: 'Login', labelBn: 'লগইন', icon: LogIn, href: '/dashboard' },
];

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
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 lg:pt-24 lg:pb-32">
        {/* Rich Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        
        {/* Mesh gradient overlay */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 20% 40%, hsl(var(--primary) / 0.15), transparent),
              radial-gradient(ellipse 60% 40% at 80% 60%, hsl(var(--accent) / 0.12), transparent),
              radial-gradient(ellipse 50% 30% at 50% 20%, hsl(var(--info) / 0.08), transparent)
            `
          }}
        />
        
        <div className="absolute inset-0">
          {/* Animated Gradient Orbs */}
          <div className="absolute left-[10%] top-[15%] h-72 w-72 rounded-full bg-primary/20 blur-[100px] animate-[pulse_4s_ease-in-out_infinite]" />
          <div className="absolute right-[10%] top-[25%] h-64 w-64 rounded-full bg-accent/15 blur-[80px] animate-[pulse_5s_ease-in-out_infinite]" style={{ animationDelay: '1s' }} />
          <div className="absolute left-[40%] bottom-[20%] h-56 w-56 rounded-full bg-info/12 blur-[70px] animate-[pulse_6s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
          
          {/* Floating particles - more subtle */}
          <div className="absolute left-[8%] top-[25%] h-2 w-2 rounded-full bg-primary/50 animate-float" />
          <div className="absolute right-[12%] top-[35%] h-1.5 w-1.5 rounded-full bg-accent/60 animate-float" style={{ animationDelay: '0.5s' }} />
          <div className="absolute left-[15%] bottom-[30%] h-1.5 w-1.5 rounded-full bg-success/50 animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute right-[20%] bottom-[40%] h-2 w-2 rounded-full bg-warning/40 animate-float" style={{ animationDelay: '1.5s' }} />
          <div className="absolute left-[50%] top-[10%] h-1 w-1 rounded-full bg-primary/30 animate-float" style={{ animationDelay: '2s' }} />
          
          {/* Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />
          
          {/* Diagonal lines accent */}
          <div 
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, hsl(var(--primary)), hsl(var(--primary)) 1px, transparent 1px, transparent 60px)',
            }}
          />
        </div>
        
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            {/* Animated Badge with shimmer effect */}
            <div className="mb-8 inline-flex animate-fade-in items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary backdrop-blur-md shadow-lg shadow-primary/5">
              <div className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </div>
              <Smartphone className="h-4 w-4" />
              <span className="font-bengali">Mobile-first platform for Bangladesh</span>
            </div>
            
            {/* Main Headline with staggered animation */}
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              <span 
                className="block animate-fade-in opacity-0" 
                style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
              >
                {t('landing.hero.title').split(' ').slice(0, 3).join(' ')}
              </span>
              <span 
                className="mt-2 block bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-fade-in opacity-0"
                style={{ 
                  animationDelay: '250ms', 
                  animationFillMode: 'forwards',
                  animation: 'fade-in 0.5s ease-out 250ms forwards, gradient-shift 3s ease-in-out infinite'
                }}
              >
                {t('landing.hero.title').split(' ').slice(3).join(' ') || 'Somiti'}
              </span>
            </h1>
            
            {/* Subheadline with fade-in */}
            <p 
              className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl animate-fade-in opacity-0" 
              style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
            >
              {t('landing.hero.subtitle')}
            </p>
            
            {/* CTA Buttons with enhanced hover effects */}
            <div 
              className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-fade-in opacity-0" 
              style={{ animationDelay: '550ms', animationFillMode: 'forwards' }}
            >
              <Button 
                size="lg" 
                className="group relative gap-2 overflow-hidden bg-gradient-primary px-8 py-6 text-base font-semibold shadow-glow transition-all duration-300 hover:shadow-xl hover:scale-105"
                onClick={() => trackCTA('hero_get_started')}
              >
                <span className="relative z-10">{t('landing.hero.cta')}</span>
                <ArrowRight className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                {/* Shine effect on hover */}
                <div className="absolute inset-0 -z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="group gap-2 border-2 px-8 py-6 text-base font-semibold transition-all duration-300 hover:bg-primary/5 hover:border-primary/50 hover:scale-105"
                onClick={() => trackCTA('hero_view_demo')}
              >
                <FileText className="h-5 w-5 transition-transform duration-300 group-hover:rotate-6" />
                View Demo
              </Button>
            </div>
            
            {/* Trust Indicators with staggered animation */}
            <div 
              className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground"
            >
              {[
                { icon: CheckCircle2, text: 'Free to start', delay: '700ms' },
                { icon: CheckCircle2, text: 'No credit card required', delay: '800ms' },
                { icon: CheckCircle2, text: 'বাংলা supported', delay: '900ms' },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 animate-fade-in opacity-0"
                  style={{ animationDelay: item.delay, animationFillMode: 'forwards' }}
                >
                  <item.icon className="h-4 w-4 text-success" />
                  <span className="font-bengali">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Hero Visual - Enhanced Dashboard Preview */}
          <div 
            className="relative mx-auto mt-16 max-w-5xl animate-fade-in opacity-0" 
            style={{ animationDelay: '1000ms', animationFillMode: 'forwards' }}
          >
            {/* Animated glow background */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/40 via-accent/30 to-primary/40 opacity-60 blur-3xl animate-[pulse_4s_ease-in-out_infinite]" />
            
            {/* Browser mockup frame */}
            <div className="relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl overflow-hidden">
              {/* Browser header */}
              <div className="flex items-center gap-2 border-b border-border/50 bg-muted/50 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-destructive/60" />
                  <div className="h-3 w-3 rounded-full bg-warning/60" />
                  <div className="h-3 w-3 rounded-full bg-success/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="flex items-center gap-2 rounded-lg bg-background/50 px-4 py-1.5 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3 text-success" />
                    <span>somitiapp.lovable.app</span>
                  </div>
                </div>
                <div className="w-[52px]" /> {/* Spacer for balance */}
              </div>
              
              {/* Dashboard image with hover effect */}
              <div className="relative overflow-hidden group">
                <img 
                  src={heroDashboard} 
                  alt="Somiti Dashboard - Modern financial management interface" 
                  className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Floating stats cards for visual interest */}
                <div className="absolute top-4 right-4 hidden md:flex flex-col gap-2 animate-fade-in" style={{ animationDelay: '1300ms', animationFillMode: 'forwards' }}>
                  <div className="rounded-lg bg-card/90 backdrop-blur-md border border-border/50 px-3 py-2 shadow-lg">
                    <div className="text-xs text-muted-foreground">Active Members</div>
                    <div className="text-lg font-bold text-foreground">1,247</div>
                  </div>
                </div>
                
                <div className="absolute bottom-4 left-4 hidden md:block animate-fade-in" style={{ animationDelay: '1500ms', animationFillMode: 'forwards' }}>
                  <div className="rounded-lg bg-success/90 backdrop-blur-md px-3 py-2 shadow-lg">
                    <div className="flex items-center gap-2 text-success-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">৳45,000 collected today</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative elements around the image */}
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 hidden lg:block">
              <div className="flex flex-col gap-3">
                <div className="h-20 w-1 rounded-full bg-gradient-to-b from-primary/0 via-primary/50 to-primary/0" />
                <div className="h-12 w-1 rounded-full bg-gradient-to-b from-accent/0 via-accent/50 to-accent/0" />
              </div>
            </div>
            <div className="absolute -right-8 top-1/2 -translate-y-1/2 hidden lg:block">
              <div className="flex flex-col gap-3">
                <div className="h-12 w-1 rounded-full bg-gradient-to-b from-accent/0 via-accent/50 to-accent/0" />
                <div className="h-20 w-1 rounded-full bg-gradient-to-b from-primary/0 via-primary/50 to-primary/0" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="border-y border-border bg-muted/30 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <span>⭐</span>
              <span>Trusted by 100+ Somitis</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              What Our Users Say
            </h2>
            <p className="mt-4 text-muted-foreground">
              Real feedback from somiti administrators across Bangladesh
            </p>
          </div>
          
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Testimonial 1 */}
            <div className="group relative rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-warning">⭐</span>
                ))}
              </div>
              <p className="text-foreground leading-relaxed">
                "আমাদের সমিতির সকল হিসাব এখন অনেক সহজ হয়ে গেছে। আগে এক্সেলে করতে অনেক সময় লাগতো, এখন এক ক্লিকে সব রিপোর্ট পাই।"
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  মো
                </div>
                <div>
                  <p className="font-semibold text-foreground">মো: রফিকুল ইসলাম</p>
                  <p className="text-sm text-muted-foreground">সভাপতি, গ্রাম উন্নয়ন সমিতি</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="group relative rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-warning">⭐</span>
                ))}
              </div>
              <p className="text-foreground leading-relaxed">
                "The OTP-based member login is brilliant! Our members can now check their dues and payment history from their phones anytime."
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent font-semibold">
                  SA
                </div>
                <div>
                  <p className="font-semibold text-foreground">Sadia Ahmed</p>
                  <p className="text-sm text-muted-foreground">Secretary, Dhaka Women's Cooperative</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="group relative rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:col-span-2 lg:col-span-1">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-warning">⭐</span>
                ))}
              </div>
              <p className="text-foreground leading-relaxed">
                "bKash integration এর জন্য পেমেন্ট নেওয়া অনেক সহজ। সদস্যরা নিজেরাই পেমেন্ট করতে পারে, আমাদের আর হাতে টাকা সামলাতে হয় না।"
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success font-semibold">
                  কা
                </div>
                <div>
                  <p className="font-semibold text-foreground">কামরুল হাসান</p>
                  <p className="text-sm text-muted-foreground">কোষাধ্যক্ষ, চট্টগ্রাম ব্যবসায়ী সমিতি</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Partners Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Trusted by leading organizations
            </p>
          </div>
          
          {/* Logo Grid */}
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6 items-center justify-items-center">
              {/* Partner logos */}
              <div className="flex h-16 w-32 items-center justify-center rounded-lg p-2 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                <img src={grameenLogo} alt="Grameen" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex h-16 w-32 items-center justify-center rounded-lg p-2 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                <img src={bracLogo} alt="BRAC" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex h-16 w-32 items-center justify-center rounded-lg p-2 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                <img src={asaLogo} alt="ASA" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex h-16 w-32 items-center justify-center rounded-lg p-2 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                <img src={tmssLogo} alt="TMSS" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex h-16 w-32 items-center justify-center rounded-lg p-2 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                <img src={shaktiLogo} alt="Shakti Foundation" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex h-16 w-32 items-center justify-center rounded-lg p-2 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                <img src={pksfLogo} alt="PKSF" className="max-h-full max-w-full object-contain" />
              </div>
            </div>
            
            {/* Stats */}
            <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
              <div>
                <p className="text-3xl font-bold text-primary">100+</p>
                <p className="text-sm text-muted-foreground mt-1">Active Somitis</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">5,000+</p>
                <p className="text-sm text-muted-foreground mt-1">Members Managed</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">৳10M+</p>
                <p className="text-sm text-muted-foreground mt-1">Payments Processed</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">99.9%</p>
                <p className="text-sm text-muted-foreground mt-1">Uptime</p>
              </div>
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

      {/* FAQ Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <span>❓</span>
              <span>Got Questions?</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about Somiti App. Can't find the answer? Contact our support team.
            </p>
          </div>
          
          <div className="mx-auto max-w-3xl">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {/* Getting Started */}
              <AccordionItem value="item-1" className="rounded-xl border border-border bg-card px-6 data-[state=open]:shadow-md transition-shadow">
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  How do I get started with Somiti App?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  Getting started is easy! Simply sign up for a free account, create your somiti organization, and start adding members. 
                  Our onboarding wizard will guide you through setting up monthly dues, contribution types, and other settings. 
                  You can be up and running in less than 10 minutes.
                </AccordionContent>
              </AccordionItem>

              {/* Pricing */}
              <AccordionItem value="item-2" className="rounded-xl border border-border bg-card px-6 data-[state=open]:shadow-md transition-shadow">
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  What are the pricing plans available?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  We offer flexible pricing plans to suit organizations of all sizes:
                  <ul className="mt-3 space-y-2 list-disc list-inside">
                    <li><strong>Starter (Free):</strong> Up to 25 members, basic features</li>
                    <li><strong>Standard:</strong> Up to 100 members, SMS notifications, reports</li>
                    <li><strong>Premium:</strong> Unlimited members, online payments, advanced analytics</li>
                  </ul>
                  All paid plans come with a 14-day free trial. No credit card required to start.
                </AccordionContent>
              </AccordionItem>

              {/* Member Portal */}
              <AccordionItem value="item-3" className="rounded-xl border border-border bg-card px-6 data-[state=open]:shadow-md transition-shadow">
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  Can members access their own portal?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  Yes! Each member gets access to their personal portal where they can view their payment history, 
                  check outstanding dues, see notices, and even make online payments (on supported plans). 
                  Members log in using OTP verification via their registered phone number - no password needed!
                </AccordionContent>
              </AccordionItem>

              {/* Online Payments */}
              <AccordionItem value="item-4" className="rounded-xl border border-border bg-card px-6 data-[state=open]:shadow-md transition-shadow">
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  Do you support bKash/Nagad payments?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  Absolutely! We support all major mobile payment methods in Bangladesh including bKash, Nagad, and Rocket. 
                  Members can pay their dues directly from their phones, and payments are automatically reconciled with their accounts. 
                  This feature is available on our Premium plan.
                </AccordionContent>
              </AccordionItem>

              {/* Data Security */}
              <AccordionItem value="item-5" className="rounded-xl border border-border bg-card px-6 data-[state=open]:shadow-md transition-shadow">
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  Is my organization's data secure?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  Security is our top priority. We use enterprise-grade encryption for all data, 
                  and each organization's data is completely isolated from others. 
                  We're hosted on secure cloud infrastructure with regular backups and 99.9% uptime guarantee. 
                  Your financial data is protected with bank-level security standards.
                </AccordionContent>
              </AccordionItem>

              {/* Bangla Support */}
              <AccordionItem value="item-6" className="rounded-xl border border-border bg-card px-6 data-[state=open]:shadow-md transition-shadow">
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  বাংলা ভাষায় কি সাপোর্ট আছে?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  হ্যাঁ! Somiti App সম্পূর্ণ বাংলা ভাষায় ব্যবহার করা যায়। 
                  আপনি এক ক্লিকে ইংরেজি থেকে বাংলায় সুইচ করতে পারবেন। 
                  সদস্যদের নাম, ঠিকানা এবং সকল তথ্য বাংলায় সংরক্ষণ করা যায়। 
                  SMS নোটিফিকেশনও বাংলায় পাঠানো সম্ভব।
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="border-y border-border bg-muted/30 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <span>💎</span>
              <span>Simple Pricing</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Choose Your Plan
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Start free and scale as your organization grows. No hidden fees.
            </p>
          </div>
          
          {/* Pricing Cards */}
          <div className="mx-auto max-w-5xl grid gap-6 md:grid-cols-3">
            {/* Starter Plan */}
            <div className="relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-lg">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">Starter</h3>
                <p className="text-sm text-muted-foreground mt-1">Perfect for small somitis</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">৳0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span>Up to 25 members</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span>Basic member management</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span>Offline payment tracking</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span>3 months report history</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-4 w-4 flex items-center justify-center flex-shrink-0">—</span>
                  <span>SMS notifications</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-4 w-4 flex items-center justify-center flex-shrink-0">—</span>
                  <span>Online payments</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full">
                Get Started Free
              </Button>
            </div>

            {/* Standard Plan - Popular */}
            <div className="relative rounded-2xl border-2 border-primary bg-card p-6 transition-all duration-300 hover:shadow-xl shadow-lg">
              {/* Popular Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground shadow-glow">
                  Most Popular
                </span>
              </div>
              <div className="mb-6 mt-2">
                <h3 className="text-lg font-semibold text-foreground">Standard</h3>
                <p className="text-sm text-muted-foreground mt-1">For growing organizations</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">৳499</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span>Up to 100 members</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span>Advanced member management</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span>Offline payment tracking</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span>12 months report history</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span>50 SMS/month included</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-4 w-4 flex items-center justify-center flex-shrink-0">—</span>
                  <span>Online payments</span>
                </li>
              </ul>
              <Button className="w-full bg-gradient-primary shadow-glow hover:opacity-90">
                Start 14-Day Trial
              </Button>
            </div>

            {/* Premium Plan */}
            <div className="relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-lg">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">Premium</h3>
                <p className="text-sm text-muted-foreground mt-1">For large organizations</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">৳999</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span className="font-medium">Unlimited members</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span>Advanced member management</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span className="font-medium">bKash/Nagad payments</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span>Unlimited report history</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span>200 SMS/month included</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                  <span>Priority support</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5">
                Start 14-Day Trial
              </Button>
            </div>
          </div>

          {/* Feature Comparison Table */}
          <div className="mt-16 mx-auto max-w-4xl">
            <h3 className="text-xl font-semibold text-foreground text-center mb-8">
              Compare All Features
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-4 font-medium text-muted-foreground">Feature</th>
                    <th className="text-center py-4 px-4 font-semibold text-foreground">Starter</th>
                    <th className="text-center py-4 px-4 font-semibold text-primary">Standard</th>
                    <th className="text-center py-4 px-4 font-semibold text-foreground">Premium</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4 text-foreground">Maximum Members</td>
                    <td className="py-4 px-4 text-center">25</td>
                    <td className="py-4 px-4 text-center font-medium text-primary">100</td>
                    <td className="py-4 px-4 text-center font-medium">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4 text-foreground">Member Portal Access</td>
                    <td className="py-4 px-4 text-center"><CheckCircle2 className="h-4 w-4 text-success mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><CheckCircle2 className="h-4 w-4 text-success mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><CheckCircle2 className="h-4 w-4 text-success mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4 text-foreground">Dues Management</td>
                    <td className="py-4 px-4 text-center"><CheckCircle2 className="h-4 w-4 text-success mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><CheckCircle2 className="h-4 w-4 text-success mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><CheckCircle2 className="h-4 w-4 text-success mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4 text-foreground">Report History</td>
                    <td className="py-4 px-4 text-center">3 months</td>
                    <td className="py-4 px-4 text-center font-medium text-primary">12 months</td>
                    <td className="py-4 px-4 text-center font-medium">Unlimited</td>
                  </tr>
                  <tr className="hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4 text-foreground">SMS Notifications</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">—</td>
                    <td className="py-4 px-4 text-center font-medium text-primary">50/month</td>
                    <td className="py-4 px-4 text-center font-medium">200/month</td>
                  </tr>
                  <tr className="hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4 text-foreground">Online Payments (bKash/Nagad)</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">—</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">—</td>
                    <td className="py-4 px-4 text-center"><CheckCircle2 className="h-4 w-4 text-success mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4 text-foreground">Advanced Reports</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">—</td>
                    <td className="py-4 px-4 text-center"><CheckCircle2 className="h-4 w-4 text-success mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><CheckCircle2 className="h-4 w-4 text-success mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4 text-foreground">Priority Support</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">—</td>
                    <td className="py-4 px-4 text-center text-muted-foreground">—</td>
                    <td className="py-4 px-4 text-center"><CheckCircle2 className="h-4 w-4 text-success mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Add-ons note */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Need more SMS or members? Purchase add-on bundles anytime from your dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <span>📞</span>
              <span>Get In Touch</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Contact Us
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Have questions? We're here to help. Reach out through any of these channels.
            </p>
          </div>

          <div className="mx-auto max-w-5xl grid gap-8 md:grid-cols-2">
            {/* Contact Info Cards */}
            <div className="space-y-6">
              {/* Email Card */}
              <div className="rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/30">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Email Support</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                      Get a response within 24 hours
                    </p>
                    <a 
                      href="mailto:support@somitiapp.com" 
                      className="text-primary hover:underline font-medium"
                    >
                      support@somitiapp.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Phone Card */}
              <div className="rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/30">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Phone Support</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                      Available Sat-Thu, 10AM-6PM
                    </p>
                    <a 
                      href="tel:+8801700000000" 
                      className="text-foreground hover:text-primary font-medium"
                    >
                      +880 1700-000000
                    </a>
                  </div>
                </div>
              </div>

              {/* WhatsApp Card */}
              <div className="rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/30">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#25D366]/10 text-[#25D366]">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">WhatsApp</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">
                      Quick responses for urgent queries
                    </p>
                    <a 
                      href="https://wa.me/8801700000000" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-primary font-medium"
                    >
                      Chat on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="rounded-xl border border-border bg-card p-6 md:p-8">
              <h3 className="font-semibold text-foreground text-lg mb-6">Send us a message</h3>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);
                  const name = formData.get('name') as string;
                  const email = formData.get('email') as string;
                  const message = formData.get('message') as string;
                  
                  // Basic validation
                  if (!name?.trim() || !email?.trim() || !message?.trim()) {
                    toast({
                      title: "Missing fields",
                      description: "Please fill in all fields.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  // Email validation
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(email)) {
                    toast({
                      title: "Invalid email",
                      description: "Please enter a valid email address.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  // Success - in production this would send to backend
                  toast({
                    title: "Message sent!",
                    description: "We'll get back to you within 24 hours.",
                  });
                  form.reset();
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Your Name</Label>
                  <Input 
                    id="contact-name" 
                    name="name"
                    placeholder="Enter your name" 
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email Address</Label>
                  <Input 
                    id="contact-email" 
                    name="email"
                    type="email" 
                    placeholder="you@example.com" 
                    maxLength={255}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea 
                    id="contact-message" 
                    name="message"
                    placeholder="How can we help you?" 
                    rows={4}
                    maxLength={1000}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary shadow-glow hover:opacity-90">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </form>
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
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav items={landingBottomNavItems} />
      
      {/* Developer Credit - Hidden on mobile to avoid overlap */}
      <DeveloperCredit className="hidden lg:block" />
      
      {/* Floating Actions */}
      <FloatingActions />
    </div>
  );
}
