import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/common/SEO';
import { pageConfigs } from '@/lib/seo';
import { DeveloperCredit } from '@/components/common/DeveloperCredit';
import { LegalFooterLinks } from '@/components/common/LegalFooterLinks';

export function TermsOfServicePage() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <SEO {...pageConfigs.terms} />
      
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                {language === 'bn' ? 'সমিতি' : 'Somiti'}
              </span>
            </Link>
            <Link to="/">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {language === 'bn' ? 'ফিরে যান' : 'Back'}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-border">
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none p-8">
            {language === 'bn' ? (
              <>
                <h1 className="text-3xl font-bold text-foreground mb-6 font-bengali">
                  সেবার শর্তাবলী
                </h1>
                <p className="text-muted-foreground text-sm mb-8">
                  সর্বশেষ আপডেট: ফেব্রুয়ারি ২০২৬
                </p>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4 font-bengali">
                  ১. পরিষেবার বিবরণ
                </h2>
                <p className="text-foreground/80 mb-4 font-bengali">
                  সমিতি একটি সমবায় সমিতি ব্যবস্থাপনা প্ল্যাটফর্ম যা বাংলাদেশে সমিতি সংগঠনগুলির জন্য 
                  সদস্য ব্যবস্থাপনা, পেমেন্ট ট্র্যাকিং এবং যোগাযোগ সুবিধা প্রদান করে।
                </p>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4 font-bengali">
                  ২. অ্যাকাউন্ট নিবন্ধন
                </h2>
                <p className="text-foreground/80 mb-4 font-bengali">
                  আমাদের পরিষেবা ব্যবহার করতে, সমিতি প্রতিষ্ঠানগুলিকে অবশ্যই একটি অ্যাকাউন্ট নিবন্ধন করতে হবে। 
                  আপনি সম্মত হচ্ছেন যে:
                </p>
                <ul className="list-disc pl-6 text-foreground/80 mb-4 font-bengali">
                  <li>সঠিক এবং সম্পূর্ণ তথ্য প্রদান করবেন</li>
                  <li>আপনার অ্যাকাউন্টের গোপনীয়তা বজায় রাখবেন</li>
                  <li>আপনার অ্যাকাউন্টের অধীনে সমস্ত কার্যকলাপের জন্য দায়ী থাকবেন</li>
                </ul>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4 font-bengali">
                  ৩. পেমেন্ট এবং সাবস্ক্রিপশন
                </h2>
                <p className="text-foreground/80 mb-4 font-bengali">
                  সমিতি সাবস্ক্রিপশন ভিত্তিক পরিষেবা প্রদান করে। সাবস্ক্রিপশন মূল্য এবং শর্তাবলী 
                  নিবন্ধনের সময় স্পষ্টভাবে উল্লেখ করা হবে। সাবস্ক্রিপশন মেয়াদ শেষ হলে 
                  পরিষেবা সাময়িকভাবে বন্ধ থাকতে পারে।
                </p>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4 font-bengali">
                  ৪. ডেটা গোপনীয়তা
                </h2>
                <p className="text-foreground/80 mb-4 font-bengali">
                  আমরা আপনার ডেটার গোপনীয়তা রক্ষায় প্রতিশ্রুতিবদ্ধ। আমাদের গোপনীয়তা নীতি দেখুন 
                  যেখানে আমরা কিভাবে আপনার তথ্য সংগ্রহ, ব্যবহার এবং সুরক্ষিত রাখি তা বিস্তারিতভাবে বর্ণনা করা হয়েছে।
                </p>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4 font-bengali">
                  ৫. SMS বিজ্ঞপ্তি
                </h2>
                <p className="text-foreground/80 mb-4 font-bengali">
                  আমাদের পরিষেবা ব্যবহার করে, আপনি গুরুত্বপূর্ণ বিজ্ঞপ্তি যেমন OTP, পেমেন্ট নিশ্চিতকরণ 
                  এবং রিমাইন্ডার SMS এর মাধ্যমে পেতে সম্মত হচ্ছেন। আপনি সেটিংস থেকে 
                  অপশনাল SMS বন্ধ করতে পারেন।
                </p>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4 font-bengali">
                  ৬. দায়বদ্ধতার সীমাবদ্ধতা
                </h2>
                <p className="text-foreground/80 mb-4 font-bengali">
                  সমিতি প্ল্যাটফর্ম "যেমন আছে" ভিত্তিতে প্রদান করা হয়। আমরা পরিষেবার 
                  নিরবচ্ছিন্ন বা ত্রুটিমুক্ত হওয়ার কোনো গ্যারান্টি দিই না। তবে আমরা সর্বোত্তম 
                  সেবা প্রদানে সচেষ্ট থাকব।
                </p>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4 font-bengali">
                  ৭. যোগাযোগ
                </h2>
                <p className="text-foreground/80 mb-4 font-bengali">
                  এই শর্তাবলী সম্পর্কে কোনো প্রশ্ন থাকলে, অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন: 
                  support@somitiapp.com
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-foreground mb-6">
                  Terms of Service
                </h1>
                <p className="text-muted-foreground text-sm mb-8">
                  Last updated: February 2026
                </p>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
                  1. Service Description
                </h2>
                <p className="text-foreground/80 mb-4">
                  Somiti is a cooperative society management platform that provides member management, 
                  payment tracking, and communication facilities for somiti organizations in Bangladesh.
                </p>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
                  2. Account Registration
                </h2>
                <p className="text-foreground/80 mb-4">
                  To use our service, somiti organizations must register an account. You agree to:
                </p>
                <ul className="list-disc pl-6 text-foreground/80 mb-4">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the confidentiality of your account</li>
                  <li>Be responsible for all activities under your account</li>
                </ul>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
                  3. Payments and Subscriptions
                </h2>
                <p className="text-foreground/80 mb-4">
                  Somiti provides subscription-based services. Subscription prices and terms will be 
                  clearly stated at the time of registration. Service may be temporarily suspended 
                  when subscription expires.
                </p>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
                  4. Data Privacy
                </h2>
                <p className="text-foreground/80 mb-4">
                  We are committed to protecting your data privacy. Please see our Privacy Policy 
                  which describes in detail how we collect, use, and protect your information.
                </p>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
                  5. SMS Notifications
                </h2>
                <p className="text-foreground/80 mb-4">
                  By using our service, you consent to receive important notifications such as OTP, 
                  payment confirmations, and reminders via SMS. You can turn off optional SMS 
                  from settings.
                </p>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
                  6. Limitation of Liability
                </h2>
                <p className="text-foreground/80 mb-4">
                  The Somiti platform is provided on an "as is" basis. We do not guarantee that 
                  the service will be uninterrupted or error-free. However, we will strive to 
                  provide the best service.
                </p>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
                  7. Contact
                </h2>
                <p className="text-foreground/80 mb-4">
                  If you have any questions about these terms, please contact us at: 
                  support@somitiapp.com
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Legal Footer Links */}
      <div className="container mx-auto px-4 py-4">
        <LegalFooterLinks />
      </div>
      
      {/* Developer Credit */}
      <DeveloperCredit />
    </div>
  );
}
