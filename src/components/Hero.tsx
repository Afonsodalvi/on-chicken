import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import chicken1 from "@/assets/1.png";
import chicken2 from "@/assets/2.png";
import chicken3 from "@/assets/3.png";
import chicken4 from "@/assets/4.png";
import chicken5 from "@/assets/5.png";
import chicken6 from "@/assets/6.png";
import chicken7 from "@/assets/7.png";
import chicken8 from "@/assets/8.png";
import chicken9 from "@/assets/9.png";
import chicken10 from "@/assets/10.png";

export const Hero = () => {
  const { t } = useLanguage();
  const chickenImages = [
    chicken1, chicken2, chicken3, chicken4, chicken5,
    chicken6, chicken7, chicken8, chicken9, chicken10
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % chickenImages.length
      );
    }, 3000); // 3 segundos

    return () => clearInterval(interval);
  }, [chickenImages.length]);

  return (
    <section id="home" className="min-h-screen pt-16 flex items-center justify-center overflow-hidden relative">
      {/* Simple falling feathers */}
      <div aria-hidden className="feather-container">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="feather"
            style={{
              left: `${(i * 12 + 5) % 100}%`,
              animationDuration: `${12 + (i % 4) * 2}s`,
              animationDelay: `${i * 1.2}s`,
              transform: `rotate(${(-15 + i * 8)}deg)`
            }}
          />
        ))}
      </div>
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-slide-up">
            <div className="space-y-4">
              <h1 className="font-display text-5xl md:text-7xl font-semibold leading-tight tracking-tight">
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  {t('hero.title')}
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                {t('hero.subtitle')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center sm:justify-start">
              <Link to="/farm" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90 transition-opacity">
                  {t('hero.cta.primary')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto border-border hover:bg-secondary"
                onClick={() => window.open('https://youtube.com/watch?v=HHwmYjLl8S8', '_blank')}
              >
                <Play className="mr-2 h-5 w-5" />
                {t('hero.cta.secondary')}
              </Button>
            </div>

            <div className="flex items-center gap-8 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">🐔</div>
                <div className="text-muted-foreground">{t('hero.stats.chickens')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">⚡</div>
                <div className="text-muted-foreground">{t('hero.stats.tokenized')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">🎓</div>
                <div className="text-muted-foreground">{t('hero.stats.farms')}</div>
              </div>
            </div>

            {/* Botões Saiba Mais e Mint alinhados */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
              <Link to="/details">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-accent to-accent/80 text-accent-foreground hover:from-accent/90 hover:to-accent/70 transition-all shadow-lg hover:shadow-xl"
                >
                  {t('hero.cta.learnMore')}
                </Button>
              </Link>
              <Link to="/whitelist">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl border-0"
                >
                  🐔 {t('hero.cta.mint')}
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md lg:max-w-lg">
              {/* Subtle background glow */}
              <div className="absolute -inset-8 bg-gradient-hero blur-2xl opacity-15 animate-breath" />
              
              {/* Minimal border frame */}
              <div className="absolute inset-0 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="absolute inset-1 rounded-xl border border-accent/10" />
              
              {/* Main image with subtle shadow and smooth transition */}
              <img
                src={chickenImages[currentImageIndex]}
                alt="Pudgy Chicken destaque"
                className="relative z-10 w-full h-auto object-contain rounded-xl animate-float transition-opacity duration-500"
                style={{ 
                  filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.3)) drop-shadow(0 0 20px rgba(265, 92%, 68%, 0.1))",
                  maxHeight: "500px"
                }}
                key={currentImageIndex} // Force re-render for smooth transition
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};