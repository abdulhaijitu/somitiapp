import { useLanguage } from '@/contexts/LanguageContext';
import { useAnalytics, useScrollTracking } from '@/hooks/useAnalytics';
import { SEO, getOrganizationSchema } from '@/components/common/SEO';
import { pageConfigs, defaultBrandConfig } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import heroDashboard from '@/assets/hero-dashboard.png';
import appLogo from '@/assets/logo.png';
import logoIcon from '@/assets/logo-icon.png';
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
  Building2,
  Briefcase,
  Heart,
  Star,
  Quote,
} from 'lucide-react';

export function HomePage() {
  const { t, language } = useLanguage();
  const { trackCTA } = useAnalytics();
  
  useScrollTracking();

  const features = [
    {
      icon: Users,
      title: language === 'bn' ? 'সদস্য ব্যবস্থাপনা' : 'Member Management',
      description: language === 'bn' 
        ? 'সব সদস্যের তথ্য এক জায়গায় পরিচালনা করুন।'
        : 'Add, manage, and track all your somiti members in one place.',
    },
    {
      icon: CreditCard,
      title: language === 'bn' ? 'পেমেন্ট ট্র্যাকিং' : 'Payment Tracking',
      description: language === 'bn'
        ? 'অনলাইন ও অফলাইন পেমেন্ট সহজে ট্র্যাক করুন।'
        : 'Track online and offline payments with detailed histories.',
    },
    {
      icon: BarChart3,
      title: language === 'bn' ? 'রিপোর্ট' : 'Reports',
      description: language === 'bn'
        ? 'মাসিক ও বার্ষিক রিপোর্ট তৈরি ও এক্সপোর্ট করুন।'
        : 'Generate monthly and yearly financial reports with exports.',
    },
    {
      icon: Bell,
      title: language === 'bn' ? 'নোটিফিকেশন' : 'Notifications',
      description: language === 'bn'
        ? 'SMS ও অ্যাপ নোটিফিকেশন দিয়ে সদস্যদের জানান।'
        : 'Keep members informed with SMS and in-app notifications.',
    },
  ];

  const howItWorks = [
    {
      step: '1',
      title: language === 'bn' ? 'রেজিস্টার করুন' : 'Register',
      description: language === 'bn'
        ? 'বিনামূল্যে একাউন্ট তৈরি করুন এবং আপনার সমিতি সেটআপ করুন।'
        : 'Create a free account and set up your somiti in minutes.',
    },
    {
      step: '2',
      title: language === 'bn' ? 'সদস্য যোগ করুন' : 'Add Members',
      description: language === 'bn'
        ? 'সদস্যদের তথ্য যোগ করুন এবং তাদের মোবাইল অ্যাক্সেস দিন।'
        : 'Add member details and give them mobile portal access.',
    },
    {
      step: '3',
      title: language === 'bn' ? 'পরিচালনা শুরু করুন' : 'Start Managing',
      description: language === 'bn'
        ? 'পেমেন্ট, বকেয়া, রিপোর্ট সব এক জায়গায় পরিচালনা করুন।'
        : 'Manage payments, dues, and reports all in one place.',
    },
  ];

  const targetAudience = [
    {
      icon: Building2,
      title: language === 'bn' ? 'সমিতি' : 'Somitis',
      description: language === 'bn'
        ? 'সঞ্চয় সমিতি, সমবায় সমিতি, মহিলা সমিতি'
        : 'Savings groups, cooperatives, women\'s groups',
    },
    {
      icon: Heart,
      title: language === 'bn' ? 'এনজিও' : 'NGOs',
      description: language === 'bn'
        ? 'মাইক্রোফাইন্যান্স, কমিউনিটি ডেভেলপমেন্ট'
        : 'Microfinance, community development organizations',
    },
    {
      icon: Briefcase,
      title: language === 'bn' ? 'সংগঠন' : 'Associations',
      description: language === 'bn'
        ? 'ব্যবসায়িক সংগঠন, পেশাদার সমিতি'
        : 'Business associations, professional groups',
    },
  ];

  const testimonials = [
    {
      quote: language === 'bn'
        ? 'এই প্ল্যাটফর্ম আমাদের সমিতির হিসাব-নিকাশ সম্পূর্ণ বদলে দিয়েছে। এখন সব সদস্য তাদের পেমেন্ট মোবাইল থেকে দেখতে পারে।'
        : 'This platform has completely transformed our somiti\'s accounting. Now all members can see their payments from their mobile.',
      author: language === 'bn' ? 'মোঃ রফিকুল ইসলাম' : 'Md. Rafiqul Islam',
      role: language === 'bn' ? 'সভাপতি, গ্রামীণ সঞ্চয় সমিতি' : 'President, Grameen Savings Somiti',
    },
    {
      quote: language === 'bn'
        ? 'আগে কাগজে হিসাব করতে অনেক ভুল হতো। এখন সব ডিজিটাল হওয়ায় কোনো গড়মিল নেই।'
        : 'We used to make many mistakes with paper accounting. Now that everything is digital, there are no discrepancies.',
      author: language === 'bn' ? 'ফাতেমা খাতুন' : 'Fatema Khatun',
      role: language === 'bn' ? 'ম্যানেজার, মহিলা উন্নয়ন সমিতি' : 'Manager, Women Development Somiti',
    },
    {
      quote: language === 'bn'
        ? 'SMS রিমাইন্ডার ফিচারটি অসাধারণ। সদস্যরা এখন সময়মতো পেমেন্ট করে।'
        : 'The SMS reminder feature is amazing. Members now make payments on time.',
      author: language === 'bn' ? 'আব্দুল করিম' : 'Abdul Karim',
      role: language === 'bn' ? 'সেক্রেটারি, কৃষক সমবায় সমিতি' : 'Secretary, Farmers Cooperative',
    },
  ];

  const faqs = [
    {
      q: language === 'bn' ? 'এটি কি বিনামূল্যে ব্যবহার করা যায়?' : 'Is it free to use?',
      a: language === 'bn' 
        ? 'হ্যাঁ, ছোট সমিতির জন্য স্টার্টার প্ল্যান সম্পূর্ণ বিনামূল্যে। ২৫ সদস্য পর্যন্ত কোনো চার্জ নেই।'
        : 'Yes, the Starter plan is completely free for small somitis. No charges for up to 25 members.',
    },
    {
      q: language === 'bn' ? 'সদস্যরা কি মোবাইল থেকে ব্যবহার করতে পারবে?' : 'Can members use it from mobile?',
      a: language === 'bn'
        ? 'হ্যাঁ, সদস্যরা তাদের মোবাইল থেকে নিজেদের পেমেন্ট হিস্টোরি, বকেয়া, এবং নোটিশ দেখতে পারবে।'
        : 'Yes, members can view their payment history, dues, and notices from their mobile phones.',
    },
    {
      q: language === 'bn' ? 'অনলাইন পেমেন্ট করা যায়?' : 'Can payments be made online?',
      a: language === 'bn'
        ? 'হ্যাঁ, bKash, Nagad এবং অন্যান্য জনপ্রিয় পেমেন্ট মেথড সাপোর্ট করে।'
        : 'Yes, we support bKash, Nagad, and other popular payment methods.',
    },
    {
      q: language === 'bn' ? 'ডেটা কি নিরাপদ?' : 'Is my data secure?',
      a: language === 'bn'
        ? 'সম্পূর্ণ নিরাপদ। আমরা ব্যাংক-লেভেল এনক্রিপশন ব্যবহার করি এবং প্রতিটি সমিতির ডেটা আলাদা রাখা হয়।'
        : 'Completely secure. We use bank-level encryption and each somiti\'s data is kept separate.',
    },
  ];

  const partnerLogos = [
    { src: grameenLogo, alt: 'Grameen' },
    { src: bracLogo, alt: 'BRAC' },
    { src: asaLogo, alt: 'ASA' },
    { src: tmssLogo, alt: 'TMSS' },
    { src: shaktiLogo, alt: 'Shakti' },
    { src: pksfLogo, alt: 'PKSF' },
  ];

  return (
    <>
      <SEO 
        {...pageConfigs.home}
        structuredData={getOrganizationSchema()}
      />

      {/* Hero Section - Split Layout */}
      <section className="relative overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24 lg:pt-20 lg:pb-32">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 20% 40%, hsl(var(--primary) / 0.15), transparent),
              radial-gradient(ellipse 60% 40% at 80% 60%, hsl(var(--accent) / 0.12), transparent)
            `
          }}
        />
        
        <div className="container relative mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left - Text Content */}
            <div className="order-2 lg:order-1 text-center lg:text-left">
              <Badge variant="secondary" className="mb-6 gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </div>
                <Smartphone className="h-4 w-4" />
                <span>{language === 'bn' ? 'বাংলাদেশের জন্য মোবাইল-ফার্স্ট প্ল্যাটফর্ম' : 'Mobile-first platform for Bangladesh'}</span>
              </Badge>
              
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
                <span className="block">
                  {language === 'bn' ? 'আপনার সমিতি পরিচালনা' : 'Manage Your Somiti'}
                </span>
                <span className="mt-2 block bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent">
                  {language === 'bn' ? 'সহজ ও স্বচ্ছ' : 'Simply & Transparently'}
                </span>
              </h1>
              
              <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg lg:mx-0 lg:text-xl">
                {language === 'bn' 
                  ? 'সদস্য ব্যবস্থাপনা, পেমেন্ট ট্র্যাকিং, এবং আর্থিক রিপোর্ট - সব এক জায়গায়। আপনার সমিতিকে আধুনিক করুন।'
                  : 'Member management, payment tracking, and financial reports - all in one place. Modernize your somiti today.'}
              </p>
              
              {/* CTAs */}
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
                <Link to="/contact">
                  <Button 
                    size="lg" 
                    className="w-full gap-2 bg-gradient-primary px-8 py-6 text-base font-semibold shadow-glow hover:opacity-90 sm:w-auto"
                    onClick={() => trackCTA('hero_get_started')}
                  >
                    {language === 'bn' ? 'শুরু করুন' : 'Get Started'}
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full gap-2 border-2 px-8 py-6 text-base font-semibold sm:w-auto"
                    onClick={() => trackCTA('hero_view_pricing')}
                  >
                    <FileText className="h-5 w-5" />
                    {language === 'bn' ? 'মূল্য দেখুন' : 'View Pricing'}
                  </Button>
                </Link>
              </div>
              
              {/* Trust Indicators */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground lg:justify-start">
                {[
                  { text: language === 'bn' ? 'বিনামূল্যে শুরু' : 'Free to start' },
                  { text: language === 'bn' ? 'ক্রেডিট কার্ড লাগবে না' : 'No credit card' },
                  { text: 'বাংলা supported' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="mt-10 grid grid-cols-3 gap-4">
                {[
                  { value: '100+', label: language === 'bn' ? 'সমিতি' : 'Somitis' },
                  { value: '5,000+', label: language === 'bn' ? 'সদস্য' : 'Members' },
                  { value: '৳50L+', label: language === 'bn' ? 'প্রসেসড' : 'Processed' },
                ].map((stat, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-foreground sm:text-3xl">{stat.value}</div>
                    <div className="text-xs text-muted-foreground sm:text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right - Dashboard Preview */}
            <div className="order-1 lg:order-2 relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 opacity-60 blur-3xl" />
              
              <div className="relative">
                <div className="relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl overflow-hidden transform lg:rotate-1 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center gap-2 border-b border-border/50 bg-muted/50 px-4 py-3">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-destructive/60" />
                      <div className="h-3 w-3 rounded-full bg-warning/60" />
                      <div className="h-3 w-3 rounded-full bg-success/60" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="flex items-center gap-2 rounded-lg bg-background/50 px-4 py-1.5 text-xs text-muted-foreground">
                        <Shield className="h-3 w-3 text-success" />
                        <span>somitiapp.com</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative overflow-hidden group">
                    <img 
                      src={heroDashboard} 
                      alt="Somiti Dashboard" 
                      className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                  </div>
                </div>
                
                {/* Floating Cards */}
                <div className="absolute -top-4 -left-4 hidden md:block">
                  <div className="rounded-xl bg-card/95 backdrop-blur-md border border-border/50 px-4 py-3 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">{language === 'bn' ? 'আজকের কালেকশন' : 'Today\'s Collection'}</div>
                        <div className="text-lg font-bold text-foreground">৳45,000</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-4 -right-4 hidden md:block">
                  <div className="rounded-xl bg-card/95 backdrop-blur-md border border-border/50 px-4 py-3 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">{language === 'bn' ? 'সক্রিয় সদস্য' : 'Active Members'}</div>
                        <div className="text-lg font-bold text-foreground">1,247</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              {language === 'bn' ? 'বৈশিষ্ট্যসমূহ' : 'Features'}
            </Badge>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {language === 'bn' ? 'সব কিছু এক জায়গায়' : 'Everything You Need'}
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              {language === 'bn' 
                ? 'আপনার সমিতি পরিচালনার জন্য প্রয়োজনীয় সব ফিচার'
                : 'All the features you need to manage your somiti efficiently'}
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              {language === 'bn' ? 'কিভাবে কাজ করে' : 'How It Works'}
            </Badge>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {language === 'bn' ? 'তিনটি সহজ ধাপ' : 'Three Simple Steps'}
            </h2>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {howItWorks.map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-2xl font-bold text-primary-foreground shadow-glow">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%]">
                    <ArrowRight className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              {language === 'bn' ? 'কাদের জন্য' : 'Who It\'s For'}
            </Badge>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {language === 'bn' ? 'সব ধরনের সংগঠনের জন্য' : 'For All Types of Organizations'}
            </h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {targetAudience.map((item, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 gap-1">
              <Star className="h-3 w-3" />
              {language === 'bn' ? '১০০+ সমিতির বিশ্বাস' : 'Trusted by 100+ Somitis'}
            </Badge>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {language === 'bn' ? 'আমাদের ব্যবহারকারীরা কি বলেন' : 'What Our Users Say'}
            </h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-primary/20 mb-4" />
                  <p className="text-muted-foreground mb-6 italic">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Logos */}
      <section className="py-12 border-y border-border bg-muted/20">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-8">
            {language === 'bn' ? 'বিশ্বস্ত সংগঠনগুলো' : 'Trusted by leading organizations'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {partnerLogos.map((logo, index) => (
              <img 
                key={index}
                src={logo.src} 
                alt={logo.alt} 
                className="h-10 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              />
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              {language === 'bn' ? 'সচরাচর প্রশ্ন' : 'FAQs'}
            </Badge>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {language === 'bn' ? 'সাধারণ প্রশ্নসমূহ' : 'Frequently Asked Questions'}
            </h2>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left font-medium">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            {language === 'bn' ? 'আজই আপনার সমিতি ডিজিটাল করুন' : 'Digitize Your Somiti Today'}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {language === 'bn' 
              ? 'বিনামূল্যে শুরু করুন এবং দেখুন কিভাবে আমরা আপনার সমিতিকে আরও স্বচ্ছ ও দক্ষ করতে পারি।'
              : 'Start for free and see how we can make your somiti more transparent and efficient.'}
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link to="/contact">
              <Button size="lg" className="bg-gradient-primary shadow-glow gap-2 px-8">
                {language === 'bn' ? 'বিনামূল্যে শুরু করুন' : 'Get Started Free'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="px-8">
                {language === 'bn' ? 'আমাদের সম্পর্কে জানুন' : 'Learn About Us'}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
