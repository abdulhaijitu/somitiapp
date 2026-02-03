import { useLanguage } from '@/contexts/LanguageContext';
import { SEO } from '@/components/common/SEO';
import { ScrollAnimation } from '@/components/common/ScrollAnimation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Target,
  Eye,
  Heart,
  Users,
  Globe,
  Shield,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Building2,
} from 'lucide-react';

export function AboutPage() {
  const { language } = useLanguage();

  const values = [
    {
      icon: Shield,
      title: 'Trust & Transparency',
      titleBn: 'বিশ্বাস ও স্বচ্ছতা',
      description: 'We believe every member deserves clear visibility into their somiti\'s finances.',
      descriptionBn: 'আমরা বিশ্বাস করি প্রতিটি সদস্য তাদের সমিতির আর্থিক বিষয়ে স্পষ্ট দৃশ্যমানতার যোগ্য।',
    },
    {
      icon: Smartphone,
      title: 'Mobile-First',
      titleBn: 'মোবাইল-ফার্স্ট',
      description: 'Designed for Bangladesh where mobile is the primary internet access point.',
      descriptionBn: 'বাংলাদেশের জন্য ডিজাইন করা যেখানে মোবাইল প্রধান ইন্টারনেট অ্যাক্সেস পয়েন্ট।',
    },
    {
      icon: Heart,
      title: 'Community Focus',
      titleBn: 'কমিউনিটি ফোকাস',
      description: 'Built to strengthen community bonds through better organization.',
      descriptionBn: 'উন্নত সংগঠনের মাধ্যমে কমিউনিটি বন্ধন শক্তিশালী করতে তৈরি।',
    },
    {
      icon: Globe,
      title: 'Bilingual Support',
      titleBn: 'দ্বিভাষিক সাপোর্ট',
      description: 'Full support for English and বাংলা to serve all users comfortably.',
      descriptionBn: 'সব ব্যবহারকারীদের আরামদায়কভাবে সেবা দিতে English ও বাংলা সম্পূর্ণ সাপোর্ট।',
    },
  ];

  const milestones = [
    { year: '2024', event: 'Platform launched', eventBn: 'প্ল্যাটফর্ম চালু' },
    { year: '2024', event: '100+ somitis onboarded', eventBn: '১০০+ সমিতি যুক্ত' },
    { year: '2024', event: '5,000+ members served', eventBn: '৫,০০০+ সদস্য সেবা' },
    { year: '2025', event: 'Mobile app launch (planned)', eventBn: 'মোবাইল অ্যাপ লঞ্চ (পরিকল্পিত)' },
  ];

  return (
    <>
      <SEO 
        title="About Us"
        description="Learn about our mission to digitize and empower somitis across Bangladesh. Built with trust, transparency, and community at heart."
        keywords={['about somiti app', 'bangladesh fintech', 'association management', 'সমিতি সম্পর্কে']}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container relative mx-auto px-4">
          <ScrollAnimation animation="fade-up" className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              {language === 'bn' ? 'আমাদের গল্প' : 'Our Story'}
            </Badge>
            <h1 className="text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
              {language === 'bn' 
                ? 'বাংলাদেশের সমিতিগুলোকে ডিজিটাল করছি'
                : 'Digitizing Somitis Across Bangladesh'}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              {language === 'bn' 
                ? 'আমরা বাংলাদেশের হাজার হাজার সমিতি, সংগঠন এবং কমিউনিটি গ্রুপকে আধুনিক প্রযুক্তি দিয়ে ক্ষমতায়িত করতে প্রতিশ্রুতিবদ্ধ।'
                : 'We\'re on a mission to empower thousands of somitis, associations, and community groups in Bangladesh with modern technology.'}
            </p>
          </ScrollAnimation>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Mission */}
            <ScrollAnimation animation="fade-right">
              <Card className="relative overflow-hidden h-full">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-primary" />
                <CardContent className="p-8">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Target className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    {language === 'bn' ? 'আমাদের মিশন' : 'Our Mission'}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {language === 'bn' 
                      ? 'বাংলাদেশের প্রতিটি সমিতিকে স্বচ্ছ, দক্ষ এবং সদস্য-বান্ধব আর্থিক ব্যবস্থাপনা প্রদান করা। আমরা চাই প্রতিটি সদস্য তাদের অবদানের হিসাব সহজেই দেখতে পারুক এবং প্রতিটি প্রশাসক নিরবচ্ছিন্নভাবে তাদের সমিতি পরিচালনা করতে পারুক।'
                      : 'To provide every somiti in Bangladesh with transparent, efficient, and member-friendly financial management. We want every member to easily track their contributions and every administrator to manage their somiti seamlessly.'}
                  </p>
                </CardContent>
              </Card>
            </ScrollAnimation>

            {/* Vision */}
            <ScrollAnimation animation="fade-left">
              <Card className="relative overflow-hidden h-full">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-accent to-primary" />
                <CardContent className="p-8">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
                    <Eye className="h-7 w-7 text-accent" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    {language === 'bn' ? 'আমাদের ভিশন' : 'Our Vision'}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {language === 'bn' 
                      ? 'এমন একটি বাংলাদেশ যেখানে প্রতিটি কমিউনিটি গ্রুপ, সমবায় সমিতি, এবং সংগঠন ডিজিটাল টুল ব্যবহার করে তাদের সদস্যদের আরও ভালোভাবে সেবা দিতে পারে। আমরা বিশ্বাস করি প্রযুক্তি কমিউনিটি বন্ধনকে আরও শক্তিশালী করতে পারে।'
                      : 'A Bangladesh where every community group, cooperative society, and association uses digital tools to better serve their members. We believe technology can strengthen community bonds and build trust.'}
                  </p>
                </CardContent>
              </Card>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Why We Built This */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <ScrollAnimation animation="fade-up" className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                {language === 'bn' ? 'কেন আমরা এটি তৈরি করলাম' : 'Why We Built This'}
              </h2>
            </ScrollAnimation>
            
            <ScrollAnimation animation="fade-up" delay={100}>
              <div className="prose prose-lg max-w-none text-muted-foreground">
                {language === 'bn' ? (
                  <>
                    <p>
                      বাংলাদেশে লক্ষ লক্ষ সমিতি, সমবায়, এবং কমিউনিটি গ্রুপ রয়েছে যারা এখনও কাগজ-ভিত্তিক হিসাব-নিকাশ ব্যবহার করে। এই পুরনো পদ্ধতিতে অনেক সমস্যা আছে - হিসাবের গড়মিল, স্বচ্ছতার অভাব, এবং সদস্যদের মধ্যে অবিশ্বাস।
                    </p>
                    <p>
                      আমরা দেখেছি কিভাবে একটি সহজ ডিজিটাল সমাধান এই সমস্যাগুলো সমাধান করতে পারে। প্রতিটি সদস্য তাদের মোবাইল থেকে তাদের পেমেন্ট দেখতে পারে, প্রতিটি প্রশাসক রিয়েল-টাইম রিপোর্ট পেতে পারে, এবং পুরো সিস্টেম স্বচ্ছ থাকে।
                    </p>
                    <p>
                      এটাই আমাদের লক্ষ্য - বাংলাদেশের সমিতিগুলোকে আধুনিক, স্বচ্ছ, এবং দক্ষ করে তোলা।
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Bangladesh has millions of somitis, cooperatives, and community groups that still rely on paper-based accounting. This outdated system causes many problems - accounting errors, lack of transparency, and distrust among members.
                    </p>
                    <p>
                      We've seen how a simple digital solution can solve these issues. Every member can view their payments from their mobile, every administrator can get real-time reports, and the entire system stays transparent.
                    </p>
                    <p>
                      That's our goal - to make Bangladesh's somitis modern, transparent, and efficient.
                    </p>
                  </>
                )}
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <ScrollAnimation animation="fade-up" className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {language === 'bn' ? 'আমাদের মূল্যবোধ' : 'Our Values'}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {language === 'bn' 
                ? 'যে নীতিগুলো আমাদের কাজকে পরিচালিত করে'
                : 'The principles that guide everything we do'}
            </p>
          </ScrollAnimation>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <ScrollAnimation key={index} animation="zoom-in" delay={index * 100}>
                <Card className="text-center h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <value.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {language === 'bn' ? value.titleBn : value.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'bn' ? value.descriptionBn : value.description}
                    </p>
                  </CardContent>
                </Card>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <ScrollAnimation animation="fade-up" className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              {language === 'bn' ? 'আমাদের যাত্রা' : 'Our Journey'}
            </h2>
          </ScrollAnimation>
          
          <ScrollAnimation animation="fade-up" delay={100} className="mx-auto max-w-2xl">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border md:left-1/2 md:-translate-x-1/2" />
              
              {milestones.map((milestone, index) => (
                <div 
                  key={index}
                  className={`relative flex items-center gap-4 mb-8 ${
                    index % 2 === 0 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold z-10 md:absolute md:left-1/2 md:-translate-x-1/2">
                    {index + 1}
                  </div>
                  <div className={`flex-1 md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                    <Card>
                      <CardContent className="p-4">
                        <span className="text-sm font-medium text-primary">{milestone.year}</span>
                        <p className="text-foreground font-medium">
                          {language === 'bn' ? milestone.eventBn : milestone.event}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <ScrollAnimation animation="zoom-in">
            <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 p-8 md:p-12">
              <Building2 className="mx-auto h-12 w-12 text-primary mb-4" />
              <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                {language === 'bn' ? 'আপনার সমিতিকে আধুনিক করুন' : 'Modernize Your Somiti Today'}
              </h2>
              <p className="mt-4 text-muted-foreground">
                {language === 'bn' 
                  ? 'আমাদের সাথে যোগাযোগ করুন এবং দেখুন কিভাবে আমরা আপনার সমিতিকে সাহায্য করতে পারি।'
                  : 'Get in touch with us and see how we can help your organization thrive.'}
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link to="/contact">
                  <Button size="lg" className="bg-gradient-primary shadow-glow gap-2">
                    {language === 'bn' ? 'যোগাযোগ করুন' : 'Contact Us'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button size="lg" variant="outline">
                    {language === 'bn' ? 'মূল্য দেখুন' : 'View Pricing'}
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
