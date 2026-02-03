import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SEO } from '@/components/common/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  Loader2,
  Globe,
} from 'lucide-react';

// Validation schema
const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().trim().email('Please enter a valid email address').max(255, 'Email is too long'),
  phone: z.string().trim().regex(/^(\+?880)?[0-9]{10,11}$/, 'Please enter a valid phone number').optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(1000, 'Message is too long'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof ContactFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof ContactFormData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Call edge function to submit contact form
      const { error } = await supabase.functions.invoke('submit-contact', {
        body: {
          name: result.data.name,
          email: result.data.email,
          phone: result.data.phone || null,
          message: result.data.message,
        },
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: language === 'bn' ? 'বার্তা পাঠানো হয়েছে!' : 'Message sent!',
        description: language === 'bn' 
          ? 'আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।'
          : 'We\'ll get back to you soon.',
      });
    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        title: language === 'bn' ? 'ত্রুটি!' : 'Error!',
        description: language === 'bn' 
          ? 'বার্তা পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
          : 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      label: language === 'bn' ? 'ইমেইল' : 'Email',
      value: 'hello@somitiapp.com',
      href: 'mailto:hello@somitiapp.com',
    },
    {
      icon: Phone,
      label: language === 'bn' ? 'ফোন' : 'Phone',
      value: '+880 1833-876434',
      href: 'tel:+8801833876434',
    },
    {
      icon: Globe,
      label: language === 'bn' ? 'ওয়েবসাইট' : 'Website',
      value: 'somitiapp.com',
      href: 'https://somitiapp.com',
    },
    {
      icon: Clock,
      label: language === 'bn' ? 'কাজের সময়' : 'Business Hours',
      value: language === 'bn' ? 'শনি-বৃহঃ ৯টা-৬টা' : 'Sat-Thu 9AM-6PM',
      href: null,
    },
  ];

  return (
    <>
      <SEO 
        title="Contact Us"
        description="Get in touch with us for demos, support, or any questions about Somiti management. We're here to help your organization thrive."
        keywords={['contact somiti', 'somiti support', 'bangladesh association help', 'সমিতি যোগাযোগ']}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container relative mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">
            {language === 'bn' ? 'যোগাযোগ' : 'Get in Touch'}
          </Badge>
          <h1 className="text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
            {language === 'bn' ? 'আমাদের সাথে যোগাযোগ করুন' : 'Contact Us'}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            {language === 'bn' 
              ? 'ডেমো, সাপোর্ট, বা যেকোনো প্রশ্নের জন্য আমাদের সাথে যোগাযোগ করুন। আমরা আপনার সমিতিকে সাহায্য করতে প্রস্তুত।'
              : 'Reach out for demos, support, or any questions. We\'re here to help your somiti succeed.'}
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  {language === 'bn' ? 'বার্তা পাঠান' : 'Send a Message'}
                </CardTitle>
                <CardDescription>
                  {language === 'bn' 
                    ? 'নিচের ফর্মটি পূরণ করুন এবং আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।'
                    : 'Fill out the form below and we\'ll get back to you shortly.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                      <CheckCircle2 className="h-8 w-8 text-success" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">
                      {language === 'bn' ? 'ধন্যবাদ!' : 'Thank You!'}
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      {language === 'bn' 
                        ? 'আপনার বার্তা পেয়েছি। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।'
                        : 'We\'ve received your message and will be in touch soon.'}
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-6"
                      onClick={() => {
                        setIsSubmitted(false);
                        setFormData({ name: '', email: '', phone: '', message: '' });
                      }}
                    >
                      {language === 'bn' ? 'আরেকটি বার্তা পাঠান' : 'Send Another Message'}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        {language === 'bn' ? 'নাম' : 'Name'} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder={language === 'bn' ? 'আপনার নাম' : 'Your name'}
                        value={formData.name}
                        onChange={handleChange}
                        className={errors.name ? 'border-destructive' : ''}
                        disabled={isSubmitting}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        {language === 'bn' ? 'ইমেইল' : 'Email'} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder={language === 'bn' ? 'আপনার ইমেইল' : 'your@email.com'}
                        value={formData.email}
                        onChange={handleChange}
                        className={errors.email ? 'border-destructive' : ''}
                        disabled={isSubmitting}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        {language === 'bn' ? 'ফোন' : 'Phone'} <span className="text-muted-foreground text-sm">({language === 'bn' ? 'ঐচ্ছিক' : 'optional'})</span>
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder={language === 'bn' ? '+৮৮০ ১৮৩৩-৮৭৬৪৩৪' : '+880 1XXX-XXXXXX'}
                        value={formData.phone}
                        onChange={handleChange}
                        className={errors.phone ? 'border-destructive' : ''}
                        disabled={isSubmitting}
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">
                        {language === 'bn' ? 'বার্তা' : 'Message'} <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder={language === 'bn' 
                          ? 'আপনার বার্তা লিখুন...' 
                          : 'Tell us about your somiti and how we can help...'}
                        value={formData.message}
                        onChange={handleChange}
                        rows={5}
                        className={errors.message ? 'border-destructive' : ''}
                        disabled={isSubmitting}
                      />
                      {errors.message && (
                        <p className="text-sm text-destructive">{errors.message}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-primary shadow-glow gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {language === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...'}
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          {language === 'bn' ? 'বার্তা পাঠান' : 'Send Message'}
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  {language === 'bn' ? 'যোগাযোগের তথ্য' : 'Contact Information'}
                </h2>
                <p className="text-muted-foreground">
                  {language === 'bn' 
                    ? 'সরাসরি যোগাযোগের জন্য নিচের তথ্য ব্যবহার করুন।'
                    : 'Use the following information to reach us directly.'}
                </p>
              </div>

              <div className="space-y-4">
                {contactInfo.map((item, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow duration-300">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <item.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{item.label}</p>
                        {item.href ? (
                          <a 
                            href={item.href}
                            className="font-medium text-foreground hover:text-primary transition-colors"
                            target={item.href.startsWith('http') ? '_blank' : undefined}
                            rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="font-medium text-foreground">{item.value}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Contact via WhatsApp */}
              <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {language === 'bn' ? 'দ্রুত সাহায্য প্রয়োজন?' : 'Need Quick Help?'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {language === 'bn' 
                      ? 'আমাদের সাথে WhatsApp-এ চ্যাট করুন এবং তাৎক্ষণিক সাহায্য পান।'
                      : 'Chat with us on WhatsApp for instant support.'}
                  </p>
                  <a
                    href="https://wa.me/8801833876434?text=Hi,%20I'm%20interested%20in%20Somiti%20App"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-success hover:bg-success/90 gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {language === 'bn' ? 'WhatsApp-এ চ্যাট করুন' : 'Chat on WhatsApp'}
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
