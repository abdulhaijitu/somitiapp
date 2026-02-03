import { useLanguage } from '@/contexts/LanguageContext';
import { SEO } from '@/components/common/SEO';
import { ScrollAnimation } from '@/components/common/ScrollAnimation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Check,
  Users,
  MessageSquare,
  FileBarChart,
  Smartphone,
  CreditCard,
  Zap,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Starter',
    nameBn: 'স্টার্টার',
    price: '০',
    priceSuffix: '/মাস',
    priceEn: '0',
    priceSuffixEn: '/month',
    description: 'Perfect for small somitis just getting started',
    descriptionBn: 'ছোট সমিতির জন্য আদর্শ যারা সবেমাত্র শুরু করছে',
    ideal: 'Up to 25 members',
    idealBn: '২৫ সদস্য পর্যন্ত',
    features: [
      { text: 'Up to 25 members', textBn: '২৫ সদস্য পর্যন্ত' },
      { text: '10 SMS/month', textBn: '১০ SMS/মাস' },
      { text: 'Basic reports', textBn: 'বেসিক রিপোর্ট' },
      { text: 'Member portal', textBn: 'সদস্য পোর্টাল' },
      { text: 'Email support', textBn: 'ইমেইল সাপোর্ট' },
    ],
    cta: 'Get Started Free',
    ctaBn: 'বিনামূল্যে শুরু করুন',
    popular: false,
    highlighted: false,
  },
  {
    name: 'Standard',
    nameBn: 'স্ট্যান্ডার্ড',
    price: '৫০০',
    priceSuffix: '/মাস',
    priceEn: '500',
    priceSuffixEn: '/month',
    description: 'For growing somitis with more members',
    descriptionBn: 'বর্ধনশীল সমিতির জন্য যাদের সদস্য বেশি',
    ideal: 'Up to 100 members',
    idealBn: '১০০ সদস্য পর্যন্ত',
    features: [
      { text: 'Up to 100 members', textBn: '১০০ সদস্য পর্যন্ত' },
      { text: '50 SMS/month', textBn: '৫০ SMS/মাস' },
      { text: 'Advanced reports', textBn: 'অ্যাডভান্সড রিপোর্ট' },
      { text: 'Online payments', textBn: 'অনলাইন পেমেন্ট' },
      { text: 'Priority support', textBn: 'প্রাইওরিটি সাপোর্ট' },
      { text: '6 months report history', textBn: '৬ মাসের রিপোর্ট হিস্টোরি' },
    ],
    cta: 'Start Standard',
    ctaBn: 'স্ট্যান্ডার্ড শুরু করুন',
    popular: true,
    highlighted: true,
  },
  {
    name: 'Premium',
    nameBn: 'প্রিমিয়াম',
    price: '১,০০০',
    priceSuffix: '/মাস',
    priceEn: '1,000',
    priceSuffixEn: '/month',
    description: 'For large somitis with advanced needs',
    descriptionBn: 'বড় সমিতির জন্য যাদের উন্নত প্রয়োজন',
    ideal: 'Unlimited members',
    idealBn: 'সীমাহীন সদস্য',
    features: [
      { text: 'Unlimited members', textBn: 'সীমাহীন সদস্য' },
      { text: '200 SMS/month', textBn: '২০০ SMS/মাস' },
      { text: 'Custom reports', textBn: 'কাস্টম রিপোর্ট' },
      { text: 'All payment methods', textBn: 'সব পেমেন্ট মেথড' },
      { text: 'Dedicated support', textBn: 'ডেডিকেটেড সাপোর্ট' },
      { text: '12 months report history', textBn: '১২ মাসের রিপোর্ট হিস্টোরি' },
      { text: 'Early access features', textBn: 'আর্লি অ্যাক্সেস ফিচার' },
    ],
    cta: 'Start Premium',
    ctaBn: 'প্রিমিয়াম শুরু করুন',
    popular: false,
    highlighted: false,
  },
];

const addons = [
  {
    name: 'Extra SMS Pack',
    nameBn: 'অতিরিক্ত SMS প্যাক',
    description: '100 SMS for notifications',
    descriptionBn: 'নোটিফিকেশনের জন্য ১০০ SMS',
    price: '৳200',
    priceEn: '৳200',
    icon: MessageSquare,
  },
  {
    name: 'Extra Members',
    nameBn: 'অতিরিক্ত সদস্য',
    description: 'Add 50 more members',
    descriptionBn: 'আরও ৫০ সদস্য যোগ করুন',
    price: '৳150',
    priceEn: '৳150',
    icon: Users,
  },
  {
    name: 'Extended Reports',
    nameBn: 'বর্ধিত রিপোর্ট',
    description: '24 months history',
    descriptionBn: '২৪ মাসের হিস্টোরি',
    price: '৳100',
    priceEn: '৳100',
    icon: FileBarChart,
  },
];

export function PricingPage() {
  const { language } = useLanguage();

  return (
    <>
      <SEO 
        title="Pricing"
        description="Simple, transparent pricing for somiti management. Choose a plan that fits your organization's needs. Start free, upgrade anytime."
        keywords={['somiti pricing', 'association management cost', 'bangladesh saas pricing', 'সমিতি মূল্য']}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container relative mx-auto px-4 text-center">
          <ScrollAnimation animation="fade-up">
            <Badge variant="secondary" className="mb-4">
              {language === 'bn' ? 'সহজ মূল্য নির্ধারণ' : 'Simple Pricing'}
            </Badge>
            <h1 className="text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
              {language === 'bn' ? 'আপনার সমিতির জন্য সঠিক প্ল্যান বেছে নিন' : 'Choose the Right Plan for Your Somiti'}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              {language === 'bn' 
                ? 'বিনামূল্যে শুরু করুন, যখন প্রয়োজন আপগ্রেড করুন। কোনো লুকানো ফি নেই।'
                : 'Start for free, upgrade when you need. No hidden fees, no surprises.'}
            </p>
          </ScrollAnimation>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <ScrollAnimation key={plan.name} animation="fade-up" delay={index * 100}>
                <Card 
                  className={cn(
                    "relative flex flex-col h-full transition-all duration-300 hover:shadow-lg",
                    plan.highlighted && "border-primary shadow-lg scale-[1.02] lg:scale-105"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-primary shadow-glow">
                        {language === 'bn' ? 'সবচেয়ে জনপ্রিয়' : 'Most Popular'}
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">
                      {language === 'bn' ? plan.nameBn : plan.name}
                    </CardTitle>
                    <CardDescription>
                      {language === 'bn' ? plan.descriptionBn : plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pt-4">
                    {/* Price */}
                    <div className="text-center mb-6">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-lg text-muted-foreground">৳</span>
                        <span className="text-4xl font-bold text-foreground">
                          {language === 'bn' ? plan.price : plan.priceEn}
                        </span>
                        <span className="text-muted-foreground">
                          {language === 'bn' ? plan.priceSuffix : plan.priceSuffixEn}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {language === 'bn' ? plan.idealBn : plan.ideal}
                      </p>
                    </div>
                    
                    {/* Features */}
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">
                            {language === 'bn' ? feature.textBn : feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Link to="/contact" className="w-full">
                      <Button 
                        className={cn(
                          "w-full gap-2",
                          plan.highlighted 
                            ? "bg-gradient-primary shadow-glow" 
                            : "variant-outline"
                        )}
                        variant={plan.highlighted ? "default" : "outline"}
                      >
                        {language === 'bn' ? plan.ctaBn : plan.cta}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons Section */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <ScrollAnimation animation="fade-up" className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              {language === 'bn' ? 'অ্যাড-অন প্যাক' : 'Add-on Packs'}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {language === 'bn' 
                ? 'যখন প্রয়োজন, অতিরিক্ত ফিচার যোগ করুন'
                : 'Add extra features when you need them'}
            </p>
          </ScrollAnimation>
          
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {addons.map((addon, index) => (
              <ScrollAnimation key={addon.name} animation="zoom-in" delay={index * 100}>
                <Card className="text-center h-full hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <addon.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">
                      {language === 'bn' ? addon.nameBn : addon.name}
                    </CardTitle>
                    <CardDescription>
                      {language === 'bn' ? addon.descriptionBn : addon.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold text-foreground">
                      {language === 'bn' ? addon.price : addon.priceEn}
                    </span>
                  </CardContent>
                </Card>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ / Contact CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <ScrollAnimation animation="zoom-in">
            <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 p-8 md:p-12">
              <HelpCircle className="mx-auto h-12 w-12 text-primary mb-4" />
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                {language === 'bn' ? 'প্রশ্ন আছে?' : 'Have Questions?'}
              </h2>
              <p className="mt-4 text-muted-foreground">
                {language === 'bn' 
                  ? 'আমাদের সাথে যোগাযোগ করুন। আমরা আপনার সমিতির জন্য সঠিক প্ল্যান খুঁজে পেতে সাহায্য করব।'
                  : 'Contact us for a personalized demo. We\'ll help you find the right plan for your somiti.'}
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link to="/contact">
                  <Button size="lg" className="bg-gradient-primary shadow-glow gap-2">
                    {language === 'bn' ? 'ডেমোর জন্য যোগাযোগ করুন' : 'Contact for Demo'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>
    </>
  );
}
