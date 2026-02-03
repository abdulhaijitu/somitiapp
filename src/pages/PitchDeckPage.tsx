import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import {
  Target,
  Lightbulb,
  AlertTriangle,
  Rocket,
  Monitor,
  TrendingUp,
  DollarSign,
  Sparkles,
  Shield,
  Cpu,
  Users,
  ArrowRight,
  Globe,
  MessageSquare,
  CreditCard,
  BarChart3,
  CheckCircle2,
  XCircle,
  Zap,
  Heart,
  Building2,
  Smartphone,
  Lock,
  ChevronRight,
  Quote,
  ArrowUpRight
} from 'lucide-react';

export function PitchDeckPage() {
  const { language } = useLanguage();

  const sections = [
    { id: 'vision', label: 'Vision & Mission', icon: Target },
    { id: 'problem', label: 'Problem', icon: AlertTriangle },
    { id: 'solution', label: 'Solution', icon: Lightbulb },
    { id: 'demo', label: 'Product Demo', icon: Monitor },
    { id: 'market', label: 'Market', icon: Globe },
    { id: 'business', label: 'Business Model', icon: DollarSign },
    { id: 'traction', label: 'Traction', icon: TrendingUp },
    { id: 'moat', label: 'Competitive Advantage', icon: Shield },
    { id: 'tech', label: 'Technology', icon: Cpu },
    { id: 'gtm', label: 'Go-To-Market', icon: Rocket },
    { id: 'growth', label: 'Growth Strategy', icon: Sparkles },
    { id: 'risks', label: 'Risks', icon: AlertTriangle },
    { id: 'ask', label: 'The Ask', icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Somiti</span>
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:flex">
              Investor Deck
            </Badge>
            <Link to="/dashboard">
              <Button size="sm" className="bg-gradient-primary">
                View Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-subtle" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 text-center">
          <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20">
            <Building2 className="mr-2 h-3 w-3" />
            Bangladesh-First Fintech
          </Badge>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Trust Infrastructure for{' '}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Community Finance
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Digitizing thousands of informal somitis across Bangladesh with transparency, 
            trust, and scalability.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <div className="rounded-lg border border-border bg-card px-4 py-2">
              <p className="text-2xl font-bold text-primary">10,000+</p>
              <p className="text-xs text-muted-foreground">Target Somitis</p>
            </div>
            <div className="rounded-lg border border-border bg-card px-4 py-2">
              <p className="text-2xl font-bold text-success">৳500M+</p>
              <p className="text-xs text-muted-foreground">Market Size (Annual)</p>
            </div>
            <div className="rounded-lg border border-border bg-card px-4 py-2">
              <p className="text-2xl font-bold text-info">SaaS</p>
              <p className="text-xs text-muted-foreground">Recurring Revenue</p>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Pills */}
      <nav className="sticky top-16 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-thin">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
              >
                <section.icon className="h-3 w-3" />
                {section.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Content Sections */}
      <div className="container mx-auto px-4 py-12 space-y-24">
        
        {/* Vision & Mission */}
        <section id="vision" className="scroll-mt-32">
          <SectionHeader 
            icon={Target} 
            title="Vision & Mission" 
            subtitle="Where we're headed"
          />
          <div className="grid gap-6 md:grid-cols-2 mt-8">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <Badge variant="outline" className="mb-4 border-primary/30 text-primary">Vision</Badge>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  Digitize & Modernize
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Transform thousands of informal somitis across Bangladesh into transparent, 
                  efficient, and trustworthy community financial organizations.
                </p>
              </CardContent>
            </Card>
            <Card className="border-success/20 bg-success/5">
              <CardContent className="p-6">
                <Badge variant="outline" className="mb-4 border-success/30 text-success">Mission</Badge>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  Transparency & Trust
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Bring transparency, trust, and scalability to community-based financial 
                  organizations through simple, accessible technology.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Problem Statement */}
        <section id="problem" className="scroll-mt-32">
          <SectionHeader 
            icon={AlertTriangle} 
            title="The Problem" 
            subtitle="Ground reality of somiti management"
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Current State</h3>
              <div className="space-y-3">
                {[
                  { icon: XCircle, text: 'Members managed on paper registers', color: 'text-destructive' },
                  { icon: XCircle, text: 'Payments collected manually with no receipts', color: 'text-destructive' },
                  { icon: XCircle, text: 'No real-time visibility into finances', color: 'text-destructive' },
                  { icon: XCircle, text: 'Disputes over payment records common', color: 'text-destructive' },
                  { icon: XCircle, text: 'No audit trail for accountability', color: 'text-destructive' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                    <span className="text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Key Challenges</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { title: 'No Transparency', desc: 'Members can\'t verify their contributions' },
                  { title: 'Trust Issues', desc: 'Disputes damage community relationships' },
                  { title: 'No Scalability', desc: 'Paper systems fail as somitis grow' },
                  { title: 'Low Tech Literacy', desc: 'Complex solutions don\'t work' },
                ].map((item, index) => (
                  <Card key={index} className="border-border">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                <p className="text-sm text-warning font-medium">
                  💡 Target users are not tech-savvy → They need simple, familiar tools
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Overview */}
        <section id="solution" className="scroll-mt-32">
          <SectionHeader 
            icon={Lightbulb} 
            title="Our Solution" 
            subtitle="One platform for thousands of somitis"
          />
          <div className="mt-8">
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-8">
              <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
                Cloud-Based, Multi-Tenant SaaS Platform
              </h3>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { icon: Globe, title: 'Subdomain Isolation', desc: 'Each somiti gets their own secure space' },
                  { icon: Smartphone, title: 'Mobile OTP Login', desc: 'No passwords to remember' },
                  { icon: CreditCard, title: 'Hybrid Payments', desc: 'Online + Offline payment tracking' },
                  { icon: MessageSquare, title: 'SMS-First', desc: 'Notifications via SMS for all' },
                  { icon: Globe, title: 'Bangla-First UX', desc: 'Native language interface' },
                  { icon: Lock, title: 'Data Security', desc: 'Enterprise-grade protection' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Product Demo Flow */}
        <section id="demo" className="scroll-mt-32">
          <SectionHeader 
            icon={Monitor} 
            title="Product Demo Flow" 
            subtitle="How the platform works"
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {[
              {
                role: 'Super Admin',
                color: 'destructive',
                actions: [
                  'Create new tenant (somiti)',
                  'Assign subscription plan',
                  'Monitor platform health',
                  'View revenue analytics'
                ]
              },
              {
                role: 'Tenant Admin',
                color: 'primary',
                actions: [
                  'Add & manage members',
                  'Record payments (online/offline)',
                  'Generate financial reports',
                  'Send SMS notifications'
                ]
              },
              {
                role: 'Member',
                color: 'success',
                actions: [
                  'Login via OTP (no password)',
                  'View personal payment history',
                  'Check outstanding dues',
                  'Receive SMS confirmations'
                ]
              }
            ].map((persona, index) => (
              <Card key={index} className="border-border overflow-hidden">
                <div className={`h-2 bg-${persona.color}`} />
                <CardContent className="p-6">
                  <Badge variant="outline" className="mb-4">{persona.role}</Badge>
                  <ul className="space-y-3">
                    {persona.actions.map((action, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{action}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link to="/dashboard">
              <Button size="lg" className="bg-gradient-primary gap-2">
                <Monitor className="h-4 w-4" />
                View Live Demo
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Market Opportunity */}
        <section id="market" className="scroll-mt-32">
          <SectionHeader 
            icon={Globe} 
            title="Market Opportunity" 
            subtitle="Bangladesh's untapped community finance sector"
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Bangladesh Market</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span className="text-muted-foreground">Local Somitis</span>
                      <span className="font-bold text-foreground">10,000+</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span className="text-muted-foreground">NGOs & Cooperatives</span>
                      <span className="font-bold text-foreground">5,000+</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span className="text-muted-foreground">Community Funds</span>
                      <span className="font-bold text-foreground">Growing</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Annual Market Size</span>
                      <span className="font-bold text-primary">৳500M+</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground">Target Segments</h3>
              <div className="space-y-3">
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary">Primary</Badge>
                    <span className="font-medium text-foreground">Small & Medium Somitis</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">20-500 members, monthly dues collection</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Expansion</Badge>
                    <span className="font-medium text-foreground">NGOs & Cooperatives</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Larger organizations needing transparency</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Future</Badge>
                    <span className="font-medium text-foreground">Credit Cooperatives</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Loan management add-on opportunity</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Business Model */}
        <section id="business" className="scroll-mt-32">
          <SectionHeader 
            icon={DollarSign} 
            title="Business Model" 
            subtitle="Predictable recurring revenue"
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {[
              { plan: 'Starter', price: '৳299', features: ['25 members', 'Offline payments', '50 SMS/mo'], color: 'border-muted' },
              { plan: 'Standard', price: '৳599', features: ['100 members', 'Online + Offline', '200 SMS/mo'], color: 'border-primary', popular: true },
              { plan: 'Premium', price: '৳999', features: ['500 members', 'Advanced reports', '500 SMS/mo'], color: 'border-muted' },
            ].map((tier, index) => (
              <Card key={index} className={`relative ${tier.color} ${tier.popular ? 'ring-2 ring-primary' : ''}`}>
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">Most Popular</Badge>
                )}
                <CardContent className="p-6 pt-8 text-center">
                  <h3 className="text-lg font-semibold text-foreground">{tier.plan}</h3>
                  <p className="text-3xl font-bold text-primary my-4">{tier.price}<span className="text-sm text-muted-foreground">/mo</span></p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 rounded-xl border border-border bg-muted/30 p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Additional Revenue Streams</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: MessageSquare, label: 'SMS Packs', desc: 'Extra SMS bundles' },
                { icon: Users, label: 'Member Packs', desc: 'Additional slots' },
                { icon: BarChart3, label: 'Report History', desc: 'Extended archives' },
                { icon: Zap, label: 'Future Modules', desc: 'Loan management, etc.' },
              ].map((addon, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <addon.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{addon.label}</p>
                    <p className="text-xs text-muted-foreground">{addon.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Traction */}
        <section id="traction" className="scroll-mt-32">
          <SectionHeader 
            icon={TrendingUp} 
            title="Traction" 
            subtitle="Early validation signals"
          />
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-success mb-2">3</p>
                <p className="text-muted-foreground">Pilot Tenants Onboarded</p>
              </CardContent>
            </Card>
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-primary mb-2">85%</p>
                <p className="text-muted-foreground">Positive Feedback Rate</p>
              </CardContent>
            </Card>
            <Card className="border-info/30 bg-info/5">
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-info mb-2">Early</p>
                <p className="text-muted-foreground">Revenue Validation</p>
              </CardContent>
            </Card>
          </div>
          <Card className="mt-6 border-border">
            <CardContent className="p-6">
              <Quote className="h-8 w-8 text-primary/30 mb-4" />
              <p className="text-lg text-foreground italic">
                "Finally, our members can see exactly what they've paid. No more disputes. 
                The SMS notifications build so much trust."
              </p>
              <p className="text-sm text-muted-foreground mt-4">— Pilot Somiti Admin, Dhaka</p>
            </CardContent>
          </Card>
        </section>

        {/* Competitive Advantage */}
        <section id="moat" className="scroll-mt-32">
          <SectionHeader 
            icon={Shield} 
            title="Competitive Advantage" 
            subtitle="Our defensible moat"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Globe, title: 'Bangladesh-Localized', desc: 'Built specifically for local context and needs' },
              { icon: MessageSquare, title: 'Bangla + SMS First', desc: 'Native language, familiar communication channel' },
              { icon: Zap, title: 'Simple UX', desc: 'No heavy accounting—just what somitis need' },
              { icon: Smartphone, title: 'Low-End Device Ready', desc: 'Works on basic smartphones' },
              { icon: Lock, title: 'Data Lock-In', desc: 'High switching cost once data lives in system' },
              { icon: Users, title: 'Network Effects', desc: 'Members bring more somitis' },
            ].map((item, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="font-semibold text-foreground">{item.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Technology */}
        <section id="tech" className="scroll-mt-32">
          <SectionHeader 
            icon={Cpu} 
            title="Technology & Scalability" 
            subtitle="Built for scale from day one"
          />
          <div className="mt-8 rounded-xl border border-border bg-card p-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Architecture</h3>
                <ul className="space-y-3">
                  {[
                    'Multi-tenant SaaS with shared infrastructure',
                    'Row-Level Security for strict data isolation',
                    'Edge Functions for serverless performance',
                    'Real-time updates & notifications',
                    'Horizontal scaling ready',
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Scalability</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border p-4 text-center">
                    <p className="text-2xl font-bold text-primary">1000+</p>
                    <p className="text-xs text-muted-foreground">Concurrent Tenants</p>
                  </div>
                  <div className="rounded-lg border border-border p-4 text-center">
                    <p className="text-2xl font-bold text-primary">99.9%</p>
                    <p className="text-xs text-muted-foreground">Uptime SLA</p>
                  </div>
                  <div className="rounded-lg border border-border p-4 text-center">
                    <p className="text-2xl font-bold text-primary">&lt;100ms</p>
                    <p className="text-xs text-muted-foreground">API Response</p>
                  </div>
                  <div className="rounded-lg border border-border p-4 text-center">
                    <p className="text-2xl font-bold text-primary">Auto</p>
                    <p className="text-xs text-muted-foreground">Scaling</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Go-To-Market */}
        <section id="gtm" className="scroll-mt-32">
          <SectionHeader 
            icon={Rocket} 
            title="Go-To-Market Strategy" 
            subtitle="Community-first distribution"
          />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: '1', title: 'Direct Outreach', desc: 'Connect with somiti leaders through local networks' },
              { step: '2', title: 'NGO Partnerships', desc: 'Partner with established NGOs for credibility' },
              { step: '3', title: 'Word of Mouth', desc: 'Trust-based referrals within communities' },
              { step: '4', title: 'Pilot Programs', desc: 'Free trials to demonstrate value' },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold mb-4">
                  {item.step}
                </div>
                <h4 className="font-semibold text-foreground mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
                {index < 3 && (
                  <ArrowRight className="absolute top-5 -right-3 h-4 w-4 text-muted-foreground hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Growth Strategy */}
        <section id="growth" className="scroll-mt-32">
          <SectionHeader 
            icon={Sparkles} 
            title="Revenue Growth Strategy" 
            subtitle="Path to profitability"
          />
          <div className="mt-8 space-y-4">
            {[
              { icon: ArrowUpRight, title: 'Plan Upselling', desc: 'Move Starter users to Standard as they grow', metric: '+100% ARPU' },
              { icon: MessageSquare, title: 'Add-On Sales', desc: 'SMS bundles, member packs generate additional revenue', metric: '+30% Revenue' },
              { icon: DollarSign, title: 'Annual Prepay', desc: 'Discounts for yearly payment improves cash flow', metric: '2 months free' },
              { icon: Lock, title: 'Data Retention', desc: 'Historical data creates switching cost', metric: '90%+ Retention' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Badge variant="outline" className="shrink-0">{item.metric}</Badge>
              </div>
            ))}
          </div>
        </section>

        {/* Risks */}
        <section id="risks" className="scroll-mt-32">
          <SectionHeader 
            icon={AlertTriangle} 
            title="Risks & Mitigation" 
            subtitle="How we're addressing challenges"
          />
          <div className="mt-8 grid gap-4">
            {[
              { risk: 'Low tech literacy among users', mitigation: 'Simple UX + in-person training + video tutorials' },
              { risk: 'Payment trust issues', mitigation: 'SMS confirmations + detailed audit trail + receipts' },
              { risk: 'Customer churn risk', mitigation: 'Subscription reminders + value dashboards + support' },
              { risk: 'Competition from larger players', mitigation: 'Local focus + Bangla-first + community relationships' },
            ].map((item, index) => (
              <div key={index} className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0" />
                  <span className="text-foreground">{item.risk}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  <span className="text-muted-foreground">{item.mitigation}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* The Ask */}
        <section id="ask" className="scroll-mt-32">
          <SectionHeader 
            icon={Heart} 
            title="The Ask" 
            subtitle="What we're looking for"
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-6">
                <DollarSign className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Funding</h3>
                <p className="text-muted-foreground text-sm">
                  Seed funding for marketing, sales outreach, and customer support infrastructure.
                </p>
              </CardContent>
            </Card>
            <Card className="border-info/30 bg-info/5">
              <CardContent className="p-6">
                <Users className="h-8 w-8 text-info mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Partnerships</h3>
                <p className="text-muted-foreground text-sm">
                  Strategic partnerships with NGOs, cooperatives, and community organizations.
                </p>
              </CardContent>
            </Card>
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-6">
                <TrendingUp className="h-8 w-8 text-success mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Guidance</h3>
                <p className="text-muted-foreground text-sm">
                  Mentorship on scaling, GTM strategy, and navigating the Bangladesh market.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Closing */}
        <section className="scroll-mt-32 py-12">
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 md:p-12 text-center">
            <Quote className="h-12 w-12 text-primary/30 mx-auto mb-6" />
            <blockquote className="text-2xl md:text-3xl font-bold text-foreground max-w-3xl mx-auto leading-relaxed">
              "We are not just building software — we are building{' '}
              <span className="text-primary">trust infrastructure</span> for communities."
            </blockquote>
            <Separator className="my-8 max-w-xs mx-auto" />
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/dashboard">
                <Button size="lg" className="bg-gradient-primary gap-2">
                  <Monitor className="h-4 w-4" />
                  View Live Demo
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Contact Us
              </Button>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Somiti. Building trust infrastructure for Bangladesh's communities.</p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
