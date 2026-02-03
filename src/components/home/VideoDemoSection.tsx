import { useRef, useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ScrollAnimation } from '@/components/common/ScrollAnimation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export function VideoDemoSection() {
  const { language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection observer for auto-play when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (videoRef.current) {
          if (entry.isIntersecting) {
            videoRef.current.play().catch(() => {
              // Auto-play was prevented
              setIsPlaying(false);
            });
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <section className="py-16 md:py-24 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <ScrollAnimation animation="fade-up" className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 gap-1">
            <Play className="h-3 w-3" />
            {language === 'bn' ? 'ডেমো দেখুন' : 'Watch Demo'}
          </Badge>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            {language === 'bn' 
              ? 'দেখুন কিভাবে কাজ করে'
              : 'See How It Works'}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {language === 'bn' 
              ? 'Somiti App কিভাবে আপনার সমিতির ম্যানেজমেন্ট সহজ করে তোলে তা দেখুন। মাত্র কয়েক মিনিটে সব বুঝে নিন।'
              : 'Watch how Somiti App simplifies your organization management. Understand everything in just a few minutes.'}
          </p>
        </ScrollAnimation>

        <ScrollAnimation animation="zoom-in" delay={200}>
          <div 
            ref={containerRef}
            className="relative mx-auto max-w-5xl rounded-2xl overflow-hidden shadow-2xl ring-1 ring-foreground/5"
          >
            {/* Video container with gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 opacity-50 pointer-events-none z-10 rounded-2xl" />
            
            <AspectRatio ratio={16 / 9}>
              {/* Demo video - using a placeholder video URL for now */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted={isMuted}
                loop
                playsInline
                poster="/og-image.png"
              >
                {/* Using a sample demo video - replace with actual app demo */}
                <source 
                  src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" 
                  type="video/mp4" 
                />
                {language === 'bn' 
                  ? 'আপনার ব্রাউজার ভিডিও সাপোর্ট করে না।'
                  : 'Your browser does not support the video tag.'}
              </video>

              {/* Video overlay with controls */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4 md:p-6 z-20">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlay}
                    className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
                  >
                    {isMuted ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
                >
                  <Maximize2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Center play button when paused */}
              {!isPlaying && (
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer z-20"
                  onClick={togglePlay}
                >
                  <div className="h-20 w-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200">
                    <Play className="h-8 w-8 text-primary ml-1" />
                  </div>
                </div>
              )}
            </AspectRatio>

            {/* Decorative elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent/20 rounded-full blur-2xl pointer-events-none" />
          </div>
        </ScrollAnimation>

        {/* Feature highlights below video */}
        <ScrollAnimation animation="fade-up" delay={400} className="mt-12">
          <div className="grid gap-4 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              {
                title: language === 'bn' ? 'সহজ ইন্টারফেস' : 'Easy Interface',
                description: language === 'bn' 
                  ? 'কোনো টেকনিক্যাল জ্ঞান লাগে না'
                  : 'No technical knowledge required',
              },
              {
                title: language === 'bn' ? 'রিয়েল-টাইম ডেটা' : 'Real-time Data',
                description: language === 'bn' 
                  ? 'সব তথ্য সাথে সাথে আপডেট হয়'
                  : 'All information updates instantly',
              },
              {
                title: language === 'bn' ? 'মোবাইল ফ্রেন্ডলি' : 'Mobile Friendly',
                description: language === 'bn' 
                  ? 'যেকোনো ডিভাইসে ব্যবহার করুন'
                  : 'Use on any device',
              },
            ].map((feature, index) => (
              <div 
                key={index}
                className="text-center p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50"
              >
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
              </div>
            ))}
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}
