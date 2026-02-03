import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollAnimation } from '@/components/common/ScrollAnimation';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { Star, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
  language: string;
}

export function TestimonialsCarousel({ testimonials, language }: TestimonialsCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  
  const autoplayPlugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })
  );

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollTo = useCallback((index: number) => {
    api?.scrollTo(index);
  }, [api]);

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <ScrollAnimation animation="fade-up" className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 gap-1">
            <Star className="h-3 w-3" />
            {language === 'bn' ? '১০০+ সমিতির বিশ্বাস' : 'Trusted by 100+ Somitis'}
          </Badge>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            {language === 'bn' ? 'আমাদের ব্যবহারকারীরা কি বলেন' : 'What Our Users Say'}
          </h2>
        </ScrollAnimation>
        
        <ScrollAnimation animation="fade-up" delay={100}>
          <div className="relative max-w-5xl mx-auto">
            <Carousel
              setApi={setApi}
              opts={{
                align: 'start',
                loop: true,
              }}
              plugins={[autoplayPlugin.current]}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                    <Card className="relative h-full border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-1 mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                          ))}
                        </div>
                        <Quote className="h-8 w-8 text-primary/20 mb-3" />
                        <p className="text-muted-foreground mb-6 italic leading-relaxed">
                          "{testimonial.quote}"
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                            {testimonial.author.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{testimonial.author}</p>
                            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              <CarouselPrevious className="hidden md:flex -left-12 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background" />
              <CarouselNext className="hidden md:flex -right-12 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background" />
            </Carousel>
            
            {/* Dot indicators */}
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: count }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    current === index 
                      ? "w-6 bg-primary" 
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}
