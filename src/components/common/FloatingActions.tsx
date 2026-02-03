import { useState, useEffect } from 'react';
import { ArrowUp, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const WHATSAPP_NUMBER = '8801833876434';

export function FloatingActions() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent('Hello! I have a question about Somiti.');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* Back to Top Button */}
      <Button
        onClick={scrollToTop}
        size="icon"
        className={cn(
          "h-12 w-12 rounded-full shadow-lg transition-all duration-300",
          "bg-primary hover:bg-primary/90",
          showBackToTop 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>

      {/* WhatsApp Button */}
      <Button
        onClick={openWhatsApp}
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg bg-[#25D366] hover:bg-[#20BD5A] text-white"
        aria-label="Contact on WhatsApp"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
    </div>
  );
}
