import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Users, 
  CreditCard, 
  FileText, 
  Bell, 
  Shield, 
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Smartphone
} from 'lucide-react';

export function LandingPage() {
  const { t } = useLanguage();

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
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Somiti</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/pitch" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Investors
            </Link>
            <Link to="/mobile-roadmap" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Roadmap
            </Link>
            <Link to="/super-admin" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Admin
            </Link>
            <LanguageToggle />
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                {t('auth.login')}
              </Button>
            </Link>
            <Button size="sm" className="bg-gradient-primary hover:opacity-90">
              {t('auth.signup')}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-subtle" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/4 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Smartphone className="h-4 w-4" />
              <span>Mobile-first platform for Bangladesh</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {t('landing.hero.title')}
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground md:text-xl">
              {t('landing.hero.subtitle')}
            </p>
            <div className="flex flex-col items-center gap-4 pt-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="gap-2 bg-gradient-primary px-8 hover:opacity-90 shadow-glow">
                {t('landing.hero.cta')}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="gap-2 px-8">
                <FileText className="h-4 w-4" />
                View Demo
              </Button>
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
          <p>© 2024 Somiti. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
