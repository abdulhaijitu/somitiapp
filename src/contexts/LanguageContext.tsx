import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type Language = 'en' | 'bn';

interface Translations {
  [key: string]: {
    en: string;
    bn: string;
  };
}

// Core translations for the platform
const translations: Translations = {
  // Navigation
  'nav.dashboard': { en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
  'nav.members': { en: 'Members', bn: 'সদস্য' },
  'nav.payments': { en: 'Payments', bn: 'পেমেন্ট' },
  'nav.dues': { en: 'Dues', bn: 'বকেয়া' },
  'nav.reports': { en: 'Reports', bn: 'রিপোর্ট' },
  'nav.notices': { en: 'Notice Board', bn: 'নোটিশ বোর্ড' },
  'nav.constitution': { en: 'Constitution', bn: 'সংবিধান' },
  'nav.settings': { en: 'Settings', bn: 'সেটিংস' },

  // Common
  'common.search': { en: 'Search...', bn: 'অনুসন্ধান...' },
  'common.add': { en: 'Add', bn: 'যোগ করুন' },
  'common.edit': { en: 'Edit', bn: 'সম্পাদনা' },
  'common.delete': { en: 'Delete', bn: 'মুছুন' },
  'common.save': { en: 'Save', bn: 'সংরক্ষণ' },
  'common.cancel': { en: 'Cancel', bn: 'বাতিল' },
  'common.loading': { en: 'Loading...', bn: 'লোড হচ্ছে...' },
  'common.viewAll': { en: 'View All', bn: 'সব দেখুন' },
  'common.export': { en: 'Export', bn: 'রপ্তানি' },
  'common.total': { en: 'Total', bn: 'মোট' },

  // Dashboard
  'dashboard.title': { en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
  'dashboard.welcome': { en: 'Welcome back', bn: 'স্বাগতম' },
  'dashboard.totalMembers': { en: 'Total Members', bn: 'মোট সদস্য' },
  'dashboard.totalCollection': { en: 'Total Collection', bn: 'মোট সংগ্রহ' },
  'dashboard.monthlyPayments': { en: 'Monthly Payments', bn: 'মাসিক পেমেন্ট' },
  'dashboard.outstandingDues': { en: 'Outstanding Dues', bn: 'বকেয়া বাকি' },
  'dashboard.recentActivity': { en: 'Recent Activity', bn: 'সাম্প্রতিক কার্যকলাপ' },
  'dashboard.paymentTrends': { en: 'Payment Trends', bn: 'পেমেন্ট প্রবণতা' },

  // Members
  'members.title': { en: 'Members', bn: 'সদস্য তালিকা' },
  'members.addMember': { en: 'Add Member', bn: 'সদস্য যোগ করুন' },
  'members.name': { en: 'Name', bn: 'নাম' },
  'members.mobile': { en: 'Mobile', bn: 'মোবাইল' },
  'members.status': { en: 'Status', bn: 'অবস্থা' },
  'members.active': { en: 'Active', bn: 'সক্রিয়' },
  'members.inactive': { en: 'Inactive', bn: 'নিষ্ক্রিয়' },
  'members.role': { en: 'Role', bn: 'ভূমিকা' },
  'members.joinDate': { en: 'Join Date', bn: 'যোগদানের তারিখ' },

  // Payments
  'payments.title': { en: 'Payments', bn: 'পেমেন্ট' },
  'payments.addPayment': { en: 'Record Payment', bn: 'পেমেন্ট রেকর্ড' },
  'payments.amount': { en: 'Amount', bn: 'পরিমাণ' },
  'payments.date': { en: 'Date', bn: 'তারিখ' },
  'payments.method': { en: 'Method', bn: 'পদ্ধতি' },
  'payments.online': { en: 'Online', bn: 'অনলাইন' },
  'payments.offline': { en: 'Offline', bn: 'অফলাইন' },
  'payments.paid': { en: 'Paid', bn: 'পরিশোধিত' },
  'payments.pending': { en: 'Pending', bn: 'বাকি' },

  // Auth
  'auth.login': { en: 'Login', bn: 'লগইন' },
  'auth.signup': { en: 'Sign Up', bn: 'নিবন্ধন' },
  'auth.logout': { en: 'Logout', bn: 'লগআউট' },
  'auth.mobile': { en: 'Mobile Number', bn: 'মোবাইল নম্বর' },
  'auth.otp': { en: 'OTP', bn: 'ওটিপি' },
  'auth.sendOtp': { en: 'Send OTP', bn: 'ওটিপি পাঠান' },
  'auth.verifyOtp': { en: 'Verify OTP', bn: 'ওটিপি যাচাই' },

  // Landing
  'landing.hero.title': { en: 'Manage Your Somiti with Ease', bn: 'সহজে আপনার সমিতি পরিচালনা করুন' },
  'landing.hero.subtitle': { en: 'Modern association management platform for Bangladesh', bn: 'বাংলাদেশের জন্য আধুনিক সমিতি ব্যবস্থাপনা প্ল্যাটফর্ম' },
  'landing.hero.cta': { en: 'Get Started Free', bn: 'বিনামূল্যে শুরু করুন' },
  'landing.features.title': { en: 'Everything You Need', bn: 'আপনার যা দরকার সব' },
  'landing.features.members': { en: 'Member Management', bn: 'সদস্য ব্যবস্থাপনা' },
  'landing.features.payments': { en: 'Payment Tracking', bn: 'পেমেন্ট ট্র্যাকিং' },
  'landing.features.reports': { en: 'Financial Reports', bn: 'আর্থিক রিপোর্ট' },
  'landing.features.notices': { en: 'Notice Board', bn: 'নোটিশ বোর্ড' },

  // Currency
  'currency.bdt': { en: 'BDT', bn: '৳' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = useCallback((key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language];
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'en' ? 'bn' : 'en'));
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
