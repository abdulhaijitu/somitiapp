import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollAnimation } from '@/components/common/ScrollAnimation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Smartphone, Download, CheckCircle2, ArrowRight } from 'lucide-react';
import memberDashboardMobile from '@/assets/mobile/member-dashboard-mobile.png';
import paymentHistoryMobile from '@/assets/mobile/payment-history-mobile.png';
import duesListMobile from '@/assets/mobile/dues-list-mobile.png';

export function MobileAppSection() {
  const { language } = useLanguage();

  const mobileFeatures = [
    {
      text: language === 'bn' ? 'পেমেন্ট হিস্টোরি দেখুন' : 'View payment history',
    },
    {
      text: language === 'bn' ? 'বকেয়া ও বিল চেক করুন' : 'Check dues & bills',
    },
    {
      text: language === 'bn' ? 'অনলাইনে পেমেন্ট করুন' : 'Pay online instantly',
    },
    {
      text: language === 'bn' ? 'নোটিশ পান রিয়েল-টাইমে' : 'Get real-time notices',
    },
  ];

  return (
    <section className="py-16 md:py-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Content */}
          <ScrollAnimation animation="fade-right" className="order-2 lg:order-1">
            <Badge variant="secondary" className="mb-4 gap-1">
              <Smartphone className="h-3 w-3" />
              {language === 'bn' ? 'মোবাইল অ্যাপ' : 'Mobile App'}
            </Badge>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl mb-4">
              {language === 'bn' 
                ? 'হাতের মুঠোয় আপনার সমিতি' 
                : 'Your Somiti in Your Pocket'}
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              {language === 'bn' 
                ? 'সদস্যরা তাদের মোবাইল থেকে সবকিছু দেখতে ও পরিচালনা করতে পারে। কোনো অ্যাপ ডাউনলোড করার দরকার নেই - ব্রাউজার থেকেই কাজ করে!'
                : 'Members can view and manage everything from their mobile. No app download needed - works right from the browser!'}
            </p>
            
            <ul className="space-y-3 mb-8">
              {mobileFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-foreground">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/contact">
                <Button size="lg" className="bg-gradient-primary shadow-glow gap-2">
                  {language === 'bn' ? 'এখনই শুরু করুন' : 'Get Started Now'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                {language === 'bn' ? 'অ্যাপ ইনস্টল করুন' : 'Install App'}
              </Button>
            </div>
          </ScrollAnimation>

          {/* Phone Mockups */}
          <ScrollAnimation animation="fade-left" className="order-1 lg:order-2">
            <div className="relative flex justify-center items-center min-h-[500px] md:min-h-[600px]">
              {/* Background glow */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-80 h-80 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full blur-3xl opacity-50 animate-glow-pulse" />
              </div>

              {/* Left phone - Payment History */}
              <div className="absolute left-0 md:left-4 lg:left-0 top-1/2 -translate-y-1/2 z-10 animate-float-delayed">
                <div className="relative">
                  {/* Phone frame */}
                  <div className="w-40 md:w-48 rounded-[2rem] border-4 border-foreground/10 bg-background shadow-2xl overflow-hidden">
                    <div className="relative">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-5 bg-foreground/10 rounded-b-xl z-10" />
                      <img 
                        src={paymentHistoryMobile} 
                        alt="Payment History" 
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Center phone - Member Dashboard (Main) */}
              <div className="relative z-20 animate-float-slow">
                <div className="relative">
                  {/* Phone frame */}
                  <div className="w-52 md:w-64 rounded-[2.5rem] border-4 border-foreground/10 bg-background shadow-2xl overflow-hidden">
                    <div className="relative">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-foreground/10 rounded-b-xl z-10" />
                      <img 
                        src={memberDashboardMobile} 
                        alt="Member Dashboard" 
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                  {/* Reflection */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-[2.5rem] pointer-events-none" />
                </div>
              </div>

              {/* Right phone - Dues List */}
              <div className="absolute right-0 md:right-4 lg:right-0 top-1/2 -translate-y-1/2 z-10 animate-float">
                <div className="relative">
                  {/* Phone frame */}
                  <div className="w-40 md:w-48 rounded-[2rem] border-4 border-foreground/10 bg-background shadow-2xl overflow-hidden">
                    <div className="relative">
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-5 bg-foreground/10 rounded-b-xl z-10" />
                      <img 
                        src={duesListMobile} 
                        alt="Dues List" 
                        className="w-full h-auto"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-2 right-8 md:right-16 z-30 animate-float">
                <div className="bg-success text-success-foreground px-3 py-1.5 rounded-full text-sm font-medium shadow-lg flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {language === 'bn' ? 'পেমেন্ট সফল' : 'Payment Success'}
                </div>
              </div>

              <div className="absolute -bottom-2 left-8 md:left-16 z-30 animate-float-delayed">
                <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium shadow-lg flex items-center gap-1">
                  <Smartphone className="h-3.5 w-3.5" />
                  {language === 'bn' ? 'মোবাইল ফ্রেন্ডলি' : 'Mobile Friendly'}
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </div>
    </section>
  );
}
