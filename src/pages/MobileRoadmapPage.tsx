import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import {
  Smartphone,
  Download,
  Wifi,
  WifiOff,
  Shield,
  Zap,
  Globe,
  Play,
  Check,
  Clock,
  ArrowRight,
  Layers,
  Users,
  DollarSign,
  Target,
  Hand,
  Eye,
  Lock,
  RefreshCw,
  CloudOff,
  Server,
  ChevronRight,
  Rocket,
  Package,
  Settings,
  MessageSquare,
  FileText
} from 'lucide-react';

export function MobileRoadmapPage() {
  const { language } = useLanguage();

  const phases = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'pwa', label: 'Phase 1: PWA', icon: Download },
    { id: 'android', label: 'Phase 2: Android', icon: Play },
    { id: 'offline', label: 'Phase 3: Offline', icon: WifiOff },
    { id: 'ux', label: 'UX Principles', icon: Hand },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'rollout', label: 'Rollout', icon: Rocket },
    { id: 'business', label: 'Business Case', icon: DollarSign },
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
              <Smartphone className="mr-2 h-3 w-3" />
              Mobile Roadmap
            </Badge>
            <Link to="/pitch">
              <Button variant="outline" size="sm">
                Pitch Deck
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-subtle" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-info/30 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 text-center">
          <Badge className="mb-6 bg-info/10 text-info hover:bg-info/20">
            <Smartphone className="mr-2 h-3 w-3" />
            Mobile-First Strategy
          </Badge>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Mobile App Strategy &{' '}
            <span className="bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
              Future Roadmap
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Accessible, low-cost, offline-friendly mobile experience for Bangladesh.
            Mobile-first, not mobile-only.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <div className="rounded-lg border border-border bg-card px-4 py-2">
              <p className="text-2xl font-bold text-primary">PWA</p>
              <p className="text-xs text-muted-foreground">Phase 1 (Now)</p>
            </div>
            <div className="rounded-lg border border-border bg-card px-4 py-2">
              <p className="text-2xl font-bold text-info">Android</p>
              <p className="text-xs text-muted-foreground">Phase 2</p>
            </div>
            <div className="rounded-lg border border-border bg-card px-4 py-2">
              <p className="text-2xl font-bold text-success">Offline</p>
              <p className="text-xs text-muted-foreground">Phase 3</p>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Pills */}
      <nav className="sticky top-16 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-thin">
            {phases.map((phase) => (
              <a
                key={phase.id}
                href={`#${phase.id}`}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground"
              >
                <phase.icon className="h-3 w-3" />
                {phase.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 space-y-24">

        {/* Strategy Overview */}
        <section id="overview" className="scroll-mt-32">
          <SectionHeader
            icon={Target}
            title="Strategy Overview"
            subtitle="Mobile-first, not mobile-only"
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Primary Mobile Users</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg bg-background/50 p-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Members</p>
                      <p className="text-sm text-muted-foreground">View payments, dues, notices</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-background/50 p-3">
                    <Settings className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Field-Level Admins</p>
                      <p className="text-sm text-muted-foreground">Quick payment collection, member lookup</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-info/20 bg-info/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Core Principles</h3>
                <ul className="space-y-3">
                  {[
                    'Avoid immediate native app complexity',
                    'Start with PWA-first approach',
                    'Reuse existing codebase (95%+)',
                    'Low-cost, fast iteration',
                    'Keep future native expansion possible',
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3 text-muted-foreground">
                      <Check className="h-4 w-4 text-info shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <div className="mt-8 rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Phased Approach</h3>
            <div className="flex flex-col md:flex-row gap-4">
              {[
                { phase: '1', title: 'PWA', status: 'Now', color: 'bg-primary', desc: 'Installable web app' },
                { phase: '2', title: 'Android Wrapper', status: 'After Traction', color: 'bg-info', desc: 'Play Store presence' },
                { phase: '3', title: 'Offline-First', status: 'Selective', color: 'bg-success', desc: 'Critical use-cases' },
                { phase: '4', title: 'Native (Optional)', status: 'If Needed', color: 'bg-muted', desc: 'Only if absolutely necessary' },
              ].map((item, index) => (
                <div key={index} className="flex-1 relative">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.color} text-white font-bold shrink-0`}>
                      {item.phase}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{item.title}</p>
                      <Badge variant="outline" className="mt-1 text-xs">{item.status}</Badge>
                      <p className="text-sm text-muted-foreground mt-2">{item.desc}</p>
                    </div>
                  </div>
                  {index < 3 && (
                    <ArrowRight className="absolute right-0 top-5 h-4 w-4 text-muted-foreground hidden md:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Phase 1: PWA */}
        <section id="pwa" className="scroll-mt-32">
          <SectionHeader
            icon={Download}
            title="Phase 1: Progressive Web App"
            subtitle="Immediate — Convert existing web app"
          />
          <div className="mt-8">
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-8">
              <div className="flex items-center gap-3 mb-6">
                <Badge className="bg-primary">Current Phase</Badge>
                <Badge variant="outline">Lowest Cost</Badge>
                <Badge variant="outline">Fastest Deployment</Badge>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">PWA Capabilities</h3>
                  <div className="space-y-3">
                    {[
                      { icon: Download, title: 'Installable', desc: 'Add to Android home screen' },
                      { icon: Layers, title: 'App-like Navigation', desc: 'Native feel without native code' },
                      { icon: Zap, title: 'Fast Loading', desc: 'Optimized for low-end devices' },
                      { icon: Wifi, title: 'Low Bandwidth', desc: 'Works on 2G/3G networks' },
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-3 rounded-lg bg-background/50 p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                          <item.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Feature Scope</h3>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                      <p className="font-medium text-foreground mb-2">✅ Full Member Portal</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• View payment history</li>
                        <li>• Check outstanding dues</li>
                        <li>• Read notices & constitution</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border border-info/30 bg-info/5 p-4">
                      <p className="font-medium text-foreground mb-2">📱 Admin Light Tasks</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• View dashboard summary</li>
                        <li>• Record offline payments</li>
                        <li>• Quick member lookup</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                      <p className="font-medium text-foreground mb-2">🔔 Notifications</p>
                      <p className="text-sm text-muted-foreground">Push-style in-app notifications (where supported)</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-8" />

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Technical Implementation</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <Server className="h-6 w-6 text-primary mb-3" />
                      <h4 className="font-medium text-foreground">Service Workers</h4>
                      <p className="text-sm text-muted-foreground mt-1">Asset caching for fast loads</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <CloudOff className="h-6 w-6 text-primary mb-3" />
                      <h4 className="font-medium text-foreground">Offline Fallback</h4>
                      <p className="text-sm text-muted-foreground mt-1">Graceful offline screens</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <Package className="h-6 w-6 text-primary mb-3" />
                      <h4 className="font-medium text-foreground">Lightweight Bundle</h4>
                      <p className="text-sm text-muted-foreground mt-1">Optimized for mobile</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-4">
                  <p className="text-sm text-warning font-medium">
                    ⚠️ Do NOT attempt full offline data sync in Phase 1. Keep PWA lightweight.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Phase 2: Android Wrapper */}
        <section id="android" className="scroll-mt-32">
          <SectionHeader
            icon={Play}
            title="Phase 2: Android App Wrapper"
            subtitle="Low-cost Play Store presence when traction increases"
          />
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="border-border">
              <CardContent className="p-6">
                <Badge variant="outline" className="mb-4">Strategy</Badge>
                <h3 className="text-lg font-semibold text-foreground mb-4">WebView-Based Shell</h3>
                <p className="text-muted-foreground mb-4">
                  Wrap the PWA in a native Android container using WebView technology.
                  This provides Play Store presence with minimal additional development.
                </p>
                <div className="space-y-3">
                  {[
                    'Play Store discoverability',
                    'Easier distribution & updates',
                    'Native app icon on home screen',
                    'Reuse 95%+ of existing codebase',
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success" />
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <Badge variant="outline" className="mb-4">Scope</Badge>
                <h3 className="text-lg font-semibold text-foreground mb-4">Android App Features</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-info shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Member-First Experience</p>
                      <p className="text-sm text-muted-foreground">Optimized for member portal</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-info shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Admin Quick Actions</p>
                      <p className="text-sm text-muted-foreground">Payment collection, lookups</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-info shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Notification Visibility</p>
                      <p className="text-sm text-muted-foreground">SMS + in-app notifications</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 rounded-lg border border-info/30 bg-info/5 p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-info" />
              <div>
                <p className="font-semibold text-foreground">When to Proceed</p>
                <p className="text-sm text-muted-foreground">
                  Move to Phase 2 only after validating member engagement and admin mobile usage with PWA.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Phase 3: Offline-First */}
        <section id="offline" className="scroll-mt-32">
          <SectionHeader
            icon={WifiOff}
            title="Phase 3: Offline-First Enhancements"
            subtitle="Selective implementation for critical use-cases only"
          />
          <div className="mt-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Offline Scenarios</h3>
                  <p className="text-muted-foreground mb-4">
                    Handle temporary internet loss during critical field operations:
                  </p>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-border p-3">
                      <p className="font-medium text-foreground">Payment Collection</p>
                      <p className="text-sm text-muted-foreground">Draft offline entries when network unavailable</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="font-medium text-foreground">Member Lookup</p>
                      <p className="text-sm text-muted-foreground">Cached member data for quick reference</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Allowed Actions</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-lg bg-success/10 p-3">
                      <Check className="h-5 w-5 text-success" />
                      <span className="text-foreground">Draft offline entries</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg bg-success/10 p-3">
                      <RefreshCw className="h-5 w-5 text-success" />
                      <span className="text-foreground">Auto-sync when online</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg bg-warning/10 p-3">
                      <Eye className="h-5 w-5 text-warning" />
                      <span className="text-foreground">Clear "Pending Sync" indicators</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 space-y-4">
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">⚠️ Critical Constraints</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <Lock className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Financial Integrity</p>
                        <p className="text-sm text-muted-foreground">
                          Offline actions must NEVER affect financial totals until synced and verified
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">No Complex Conflicts</p>
                        <p className="text-sm text-muted-foreground">
                          No complex conflict resolution initially — simple last-write-wins or manual review
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* UX Principles */}
        <section id="ux" className="scroll-mt-32">
          <SectionHeader
            icon={Hand}
            title="UX Principles for Mobile"
            subtitle="Designed for Bangladesh's mobile users"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Hand, title: 'Thumb-Friendly', desc: 'Navigation optimized for one-handed use' },
              { icon: Target, title: 'Large Tap Targets', desc: 'Easy to tap on small screens' },
              { icon: Zap, title: 'Minimal Text Input', desc: 'Dropdowns, selections over typing' },
              { icon: Globe, title: 'Bangla-First Readability', desc: 'Native language as primary' },
              { icon: Eye, title: 'No Dense Tables', desc: 'Card-based layouts on mobile' },
              { icon: Layers, title: 'Progressive Disclosure', desc: 'Show details on demand' },
            ].map((item, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground">{item.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Security */}
        <section id="security" className="scroll-mt-32">
          <SectionHeader
            icon={Shield}
            title="Security on Mobile"
            subtitle="Same protection, mobile-optimized"
          />
          <div className="mt-8 rounded-xl border border-border bg-card p-8">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground">Role & Tenant Enforcement</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  Same server-side RBAC as web. No client-side security shortcuts.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10 mb-4">
                  <Lock className="h-8 w-8 text-warning" />
                </div>
                <h4 className="font-semibold text-foreground">No Permanent Offline Storage</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  Sensitive data not stored permanently offline. Cache only non-sensitive info.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 mb-4">
                  <Clock className="h-8 w-8 text-destructive" />
                </div>
                <h4 className="font-semibold text-foreground">Auto-Logout</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  Automatic logout on prolonged inactivity. Session management enforced.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Rollout */}
        <section id="rollout" className="scroll-mt-32">
          <SectionHeader
            icon={Rocket}
            title="Rollout Recommendation"
            subtitle="Validated, phased approach"
          />
          <div className="mt-8">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-6">
                  <Badge className="bg-primary mb-4">Launch</Badge>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Start With</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-success" />
                      <span className="text-foreground">Full Web Application</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-success" />
                      <span className="text-foreground">Progressive Web App (PWA)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-info/30 bg-info/5">
                <CardContent className="p-6">
                  <Badge variant="outline" className="mb-4">Validate</Badge>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Before Phase 2</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <ChevronRight className="h-5 w-5 text-info" />
                      <span className="text-foreground">Member engagement metrics</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ChevronRight className="h-5 w-5 text-info" />
                      <span className="text-foreground">Admin mobile usage patterns</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 rounded-lg border border-muted bg-muted/30 p-6">
              <p className="text-muted-foreground text-center">
                <strong className="text-foreground">Native app only if absolutely necessary</strong> — Phase 4 is optional and should only be considered if PWA and Android wrapper fail to meet user needs.
              </p>
            </div>
          </div>
        </section>

        {/* Business Case */}
        <section id="business" className="scroll-mt-32">
          <SectionHeader
            icon={DollarSign}
            title="Business Perspective"
            subtitle="Why PWA-first makes sense"
          />
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Cost Savings</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Development Cost', before: 'High', after: 'Low', icon: DollarSign },
                    { label: 'Maintenance Cost', before: '2x (iOS + Android)', after: '1x (Web)', icon: Settings },
                    { label: 'Time to Market', before: 'Months', after: 'Weeks', icon: Clock },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg bg-background/50 p-3">
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-success" />
                        <span className="text-foreground">{item.label}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground line-through mr-2">{item.before}</span>
                        <span className="text-success font-medium">{item.after}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-info/30 bg-info/5">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Benefits</h3>
                <ul className="space-y-3">
                  {[
                    'Faster iteration & bug fixes',
                    'Easier onboarding for non-technical users',
                    'One codebase to maintain',
                    'Instant updates (no app store review)',
                    'Lower barrier to try (no install required)',
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3 text-foreground">
                      <Check className="h-4 w-4 text-info shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-8 text-center">
            <h3 className="text-xl font-bold text-foreground mb-4">Quality Control Principle</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Mobile experience must <strong className="text-foreground">not diverge</strong> from core logic. 
              <strong className="text-foreground"> One source of truth</strong> (backend). 
              Keep future native expansion <strong className="text-foreground">possible, not mandatory</strong>.
            </p>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-muted/30">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© 2024 Somiti. Mobile-first for Bangladesh.</p>
          <div className="flex items-center gap-4">
            <Link to="/pitch" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pitch Deck
            </Link>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Demo
            </Link>
          </div>
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
