import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DeveloperCredit } from '@/components/common/DeveloperCredit';
import { FloatingActions } from '@/components/common/FloatingActions';
import { MobileBottomNav, BottomNavItem } from '@/components/common/MobileBottomNav';
import { defaultBrandConfig } from '@/lib/seo';
import appLogo from '@/assets/logo.png';
import {
  Menu,
  Home,
  DollarSign,
  Users,
  Mail,
  LogIn,
  Facebook,
  Twitter,
  Linkedin,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Home', labelBn: 'হোম', href: '/', icon: Home },
  { label: 'Pricing', labelBn: 'মূল্য', href: '/pricing', icon: DollarSign },
  { label: 'About Us', labelBn: 'আমাদের সম্পর্কে', href: '/about', icon: Users },
  { label: 'Contact Us', labelBn: 'যোগাযোগ', href: '/contact', icon: Mail },
];

// Bottom nav items for public pages
const publicBottomNavItems: BottomNavItem[] = [
  { key: 'home', label: 'Home', labelBn: 'হোম', icon: Home, href: '/', end: true },
  { key: 'pricing', label: 'Pricing', labelBn: 'মূল্য', icon: DollarSign, href: '/pricing' },
  { key: 'about', label: 'About', labelBn: 'সম্পর্কে', icon: Users, href: '/about' },
  { key: 'contact', label: 'Contact', labelBn: 'যোগাযোগ', icon: Mail, href: '/contact' },
  { key: 'login', label: 'Login', labelBn: 'লগইন', icon: LogIn, href: '/login' },
];

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const { t, language } = useLanguage();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll for sticky header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActiveLink = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Header */}
      <header 
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-300",
          isScrolled 
            ? "border-border/50 bg-background/95 backdrop-blur-xl shadow-sm" 
            : "border-transparent bg-background/80 backdrop-blur-md"
        )}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img 
              src={appLogo} 
              alt={`${defaultBrandConfig.appName} Logo`} 
              className="h-10 w-auto object-contain"
            />
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                to={link.href} 
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActiveLink(link.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {language === 'bn' ? link.labelBn : link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <LanguageToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm" className="font-medium">
                {t('auth.login')}
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="sm" className="bg-gradient-primary font-medium shadow-glow hover:opacity-90 gap-1">
                {language === 'bn' ? 'শুরু করুন' : 'Get Started'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageToggle />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header */}
                  <div className="flex items-center justify-between border-b border-border p-4">
                    <img 
                      src={appLogo} 
                      alt={`${defaultBrandConfig.appName} Logo`} 
                      className="h-8 w-auto object-contain"
                    />
                  </div>
                  
                  {/* Mobile Navigation Links */}
                  <nav className="flex-1 p-4">
                    <div className="space-y-1">
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          to={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors",
                            isActiveLink(link.href)
                              ? "text-primary bg-primary/10"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          <link.icon className="h-5 w-5" />
                          {language === 'bn' ? link.labelBn : link.label}
                        </Link>
                      ))}
                    </div>
                  </nav>
                  
                  {/* Mobile Menu Footer */}
                  <div className="border-t border-border p-4 space-y-3">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full font-medium">
                        {t('auth.login')}
                      </Button>
                    </Link>
                    <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full bg-gradient-primary font-medium shadow-glow hover:opacity-90">
                        {language === 'bn' ? 'শুরু করুন' : 'Get Started'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <Link to="/" className="inline-block">
                <img 
                  src={appLogo} 
                  alt={`${defaultBrandConfig.appName} Logo`} 
                  className="h-10 w-auto object-contain"
                />
              </Link>
              <p className="mt-4 text-sm text-muted-foreground max-w-xs">
                {language === 'bn' 
                  ? 'বাংলাদেশের সমিতি ও সংগঠন পরিচালনার জন্য আধুনিক প্ল্যাটফর্ম।'
                  : 'Modern platform for managing somitis and associations in Bangladesh.'}
              </p>
              {/* Social Media Icons */}
              <div className="mt-6 flex items-center gap-3">
                <a 
                  href="https://facebook.com/somitiapp" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a 
                  href="https://twitter.com/somitiapp" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a 
                  href="https://linkedin.com/company/somitiapp" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {language === 'bn' ? 'দ্রুত লিংক' : 'Quick Links'}
              </h3>
              <ul className="space-y-3 text-sm">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link 
                      to={link.href} 
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {language === 'bn' ? link.labelBn : link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {language === 'bn' ? 'রিসোর্স' : 'Resources'}
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    {language === 'bn' ? 'অ্যাডমিন লগইন' : 'Admin Login'}
                  </Link>
                </li>
                <li>
                  <Link to="/member/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    {language === 'bn' ? 'সদস্য পোর্টাল' : 'Member Portal'}
                  </Link>
                </li>
                <li>
                  <Link to="/pitch" className="text-muted-foreground hover:text-foreground transition-colors">
                    {language === 'bn' ? 'বিনিয়োগকারী' : 'Investors'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {language === 'bn' ? 'আইনি' : 'Legal'}
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                    {language === 'bn' ? 'সেবার শর্তাবলী' : 'Terms of Service'}
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                    {language === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-border flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
            <p>© {new Date().getFullYear()} {defaultBrandConfig.appName}. All rights reserved.</p>
            <DeveloperCredit className="hidden md:block" />
          </div>
        </div>
      </footer>

      {/* Floating Actions & Mobile Nav */}
      <FloatingActions />
      <MobileBottomNav items={publicBottomNavItems} />
    </div>
  );
}
