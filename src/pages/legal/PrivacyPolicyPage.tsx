import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/common/SEO';
import { pageConfigs } from '@/lib/seo';

export function PrivacyPolicyPage() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <SEO {...pageConfigs.privacy} />
      
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary">
                <Shield className="h-5 w-5 text-primary-foreground" />
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
                  গোপনীয়তা নীতি
                </h1>
                <p className="text-muted-foreground text-sm mb-8">
                  সর্বশেষ আপডেট: ফেব্রুয়ারি ২০২৬
                </p>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4 font-bengali">
                  ১. আমরা কী তথ্য সংগ্রহ করি
                </h2>
                <p className="text-foreground/80 mb-4 font-bengali">
                  সমিতি প্ল্যাটফর্ম নিম্নলিখিত তথ্য সংগ্রহ করে:
                </p>
                <ul className="list-disc pl-6 text-foreground/80 mb-4 font-bengali">
                  <li>সমিতি প্রতিষ্ঠানের তথ্য (নাম, ঠিকানা)</li>
                  <li>সদস্যদের তথ্য (নাম, ফোন নম্বর, ঠিকানা)</li>
                  <li>পেমেন্ট সম্পর্কিত তথ্য</li>
                  <li>ব্যবহারের পরিসংখ্যান</li>
                </ul>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4 font-bengali">
                  ২. তথ্য ব্যবহারের উদ্দেশ্য
                </h2>
                <p className="text-foreground/80 mb-4 font-bengali">
                  আমরা সংগৃহীত তথ্য নিম্নলিখিত উদ্দেশ্যে ব্যবহার করি:
                </p>
                <ul className="list-disc pl-6 text-foreground/80 mb-4 font-bengali">
                  <li>সমিতি পরিচালনা সেবা প্রদান</li>
                  <li>পেমেন্ট প্রক্রিয়াকরণ ও ট্র্যাকিং</li>
                  <li>SMS বিজ্ঞপ্তি প্রেরণ</li>
                  <li>প্ল্যাটফর্ম উন্নতি ও বিশ্লেষণ</li>
                </ul>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4 font-bengali">
                  ৩. তথ্য সুরক্ষা
                </h2>
                <p className="text-foreground/80 mb-4 font-bengali">
                  আমরা আপনার তথ্য সুরক্ষিত রাখতে নিম্নলিখিত ব্যবস্থা গ্রহণ করি:
                </p>
                <ul className="list-disc pl-6 text-foreground/80 mb-4 font-bengali">
                  <li>এনক্রিপটেড ডেটা সংরক্ষণ</li>
                  <li>নিরাপদ সার্ভার ইনফ্রাস্ট্রাকচার</li>
                  <li>নিয়মিত নিরাপত্তা অডিট</li>
                  <li>সীমিত অ্যাক্সেস নিয়ন্ত্রণ</li>
                </ul>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4 font-bengali">
                  ৪. তৃতীয় পক্ষের সাথে তথ্য ভাগাভাগি
                </h2>
                <p className="text-foreground/80 mb-4 font-bengali">
                  আমরা শুধুমাত্র নিম্নলিখিত ক্ষেত্রে তৃতীয় পক্ষের সাথে তথ্য ভাগ করি:
                </p>
                <ul className="list-disc pl-6 text-foreground/80 mb-4 font-bengali">
                  <li>পেমেন্ট প্রসেসর (UddoktaPay) - পেমেন্ট প্রক্রিয়াকরণের জন্য</li>
                  <li>SMS প্রদানকারী - বিজ্ঞপ্তি প্রেরণের জন্য</li>
                  <li>আইন প্রয়োগকারী সংস্থা - আইনি বাধ্যবাধকতায়</li>
                </ul>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4 font-bengali">
                  ৫. SMS সম্মতি
                </h2>
                <p className="text-foreground/80 mb-4 font-bengali">
                  আমাদের প্ল্যাটফর্ম ব্যবহার করে আপনি নিম্নলিখিত SMS পেতে সম্মত হচ্ছেন:
                </p>
                <ul className="list-disc pl-6 text-foreground/80 mb-4 font-bengali">
                  <li>লগইন OTP (বাধ্যতামূলক)</li>
                  <li>পেমেন্ট নিশ্চিতকরণ</li>
                  <li>বকেয়া রিমাইন্ডার (সেটিংস থেকে বন্ধ করা যায়)</li>
                </ul>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4 font-bengali">
                  ৬. ডেটা সংরক্ষণ
                </h2>
                <p className="text-foreground/80 mb-4 font-bengali">
                  আমরা আপনার তথ্য সক্রিয় সাবস্ক্রিপশন চলাকালীন এবং তার পরে যুক্তিসঙ্গত সময়ের জন্য 
                  সংরক্ষণ করি। অ্যাকাউন্ট মুছে ফেলার অনুরোধ করলে, আমরা আইনি বাধ্যবাধকতা অনুযায়ী 
                  প্রয়োজনীয় তথ্য ব্যতীত সব তথ্য মুছে ফেলব।
                </p>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4 font-bengali">
                  ৭. আপনার অধিকার
                </h2>
                <p className="text-foreground/80 mb-4 font-bengali">
                  আপনার নিম্নলিখিত অধিকার রয়েছে:
                </p>
                <ul className="list-disc pl-6 text-foreground/80 mb-4 font-bengali">
                  <li>আপনার তথ্য দেখার অধিকার</li>
                  <li>ভুল তথ্য সংশোধনের অধিকার</li>
                  <li>অপ্রয়োজনীয় SMS বন্ধ করার অধিকার</li>
                  <li>অ্যাকাউন্ট মুছে ফেলার অধিকার</li>
                </ul>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4 font-bengali">
                  ৮. যোগাযোগ
                </h2>
                <p className="text-foreground/80 mb-4 font-bengali">
                  গোপনীয়তা সম্পর্কিত প্রশ্নের জন্য যোগাযোগ করুন: privacy@somitiapp.com
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-foreground mb-6">
                  Privacy Policy
                </h1>
                <p className="text-muted-foreground text-sm mb-8">
                  Last updated: February 2026
                </p>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
                  1. Information We Collect
                </h2>
                <p className="text-foreground/80 mb-4">
                  The Somiti platform collects the following information:
                </p>
                <ul className="list-disc pl-6 text-foreground/80 mb-4">
                  <li>Organization information (name, address)</li>
                  <li>Member information (name, phone number, address)</li>
                  <li>Payment-related information</li>
                  <li>Usage statistics</li>
                </ul>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
                  2. Purpose of Information Use
                </h2>
                <p className="text-foreground/80 mb-4">
                  We use collected information for the following purposes:
                </p>
                <ul className="list-disc pl-6 text-foreground/80 mb-4">
                  <li>Providing somiti management services</li>
                  <li>Payment processing and tracking</li>
                  <li>Sending SMS notifications</li>
                  <li>Platform improvement and analytics</li>
                </ul>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
                  3. Data Security
                </h2>
                <p className="text-foreground/80 mb-4">
                  We take the following measures to protect your information:
                </p>
                <ul className="list-disc pl-6 text-foreground/80 mb-4">
                  <li>Encrypted data storage</li>
                  <li>Secure server infrastructure</li>
                  <li>Regular security audits</li>
                  <li>Limited access controls</li>
                </ul>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
                  4. Information Sharing with Third Parties
                </h2>
                <p className="text-foreground/80 mb-4">
                  We only share information with third parties in the following cases:
                </p>
                <ul className="list-disc pl-6 text-foreground/80 mb-4">
                  <li>Payment processor (UddoktaPay) - for payment processing</li>
                  <li>SMS provider - for sending notifications</li>
                  <li>Law enforcement - as legally required</li>
                </ul>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
                  5. SMS Consent
                </h2>
                <p className="text-foreground/80 mb-4">
                  By using our platform, you consent to receive the following SMS:
                </p>
                <ul className="list-disc pl-6 text-foreground/80 mb-4">
                  <li>Login OTP (mandatory)</li>
                  <li>Payment confirmations</li>
                  <li>Due reminders (can be disabled from settings)</li>
                </ul>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
                  6. Data Retention
                </h2>
                <p className="text-foreground/80 mb-4">
                  We retain your information during active subscription and for a reasonable period 
                  thereafter. Upon account deletion request, we will delete all information except 
                  what is required by legal obligations.
                </p>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
                  7. Your Rights
                </h2>
                <p className="text-foreground/80 mb-4">
                  You have the following rights:
                </p>
                <ul className="list-disc pl-6 text-foreground/80 mb-4">
                  <li>Right to view your information</li>
                  <li>Right to correct inaccurate information</li>
                  <li>Right to stop optional SMS</li>
                  <li>Right to delete your account</li>
                </ul>

                <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
                  8. Contact
                </h2>
                <p className="text-foreground/80 mb-4">
                  For privacy-related questions, contact us at: privacy@somitiapp.com
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
