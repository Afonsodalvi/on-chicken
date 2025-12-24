import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, Trophy, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import chickenPromo from "@/assets/10.png";

export const Community = () => {
  const { t } = useLanguage();
  const stats = [
    {
      icon: Users,
      number: "🌱",
      label: t('community.stats.farmers'),
      description: t('community.stats.farmers.desc'),
    },
    {
      icon: MessageCircle,
      number: "💬",
      label: t('community.stats.messages'),
      description: t('community.stats.messages.desc'),
    },
    {
      icon: Trophy,
      number: "🏆",
      label: t('community.stats.events'),
      description: t('community.stats.events.desc'),
    },
    {
      icon: Heart,
      number: "♾️",
      label: t('community.stats.sustainability'),
      description: t('community.stats.sustainability.desc'),
    },
  ];

  return (
    <section id="community" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-6xl font-semibold font-display">
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              {t('community.title')}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('community.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className="surface hover:shadow-lg transition-all duration-300 text-center group"
            >
              <CardContent className="p-6 space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">{stat.number}</div>
                  <div className="font-semibold mb-2">{stat.label}</div>
                  <div className="text-sm text-muted-foreground">{stat.description}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl font-semibold font-display">{t('community.innovate')}</h3>
            <p className="text-muted-foreground text-lg">
              {t('community.description')}
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>{t('community.features.workshops')}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>{t('community.features.decisions')}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>{t('community.features.projects')}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>{t('community.features.connect')}</span>
              </li>
            </ul>
            <div className="flex justify-start">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl border-0 font-semibold px-8 py-3"
                asChild
              >
                <a 
                  href="https://x.com/PudgyFarms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Follow on X"
                  className="flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.548 11.142H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  {t('community.cta.twitter')}
                </a>
              </Button>
            </div>
          </div>

          <div className="relative">
            <Card className="surface p-8 overflow-hidden">
              <CardContent className="p-0 space-y-6">
                <div className="text-center">
                  <h4 className="text-2xl font-bold mb-2">{t('community.media.title')}</h4>
                  <p className="text-muted-foreground">
                    {t('community.media.subtitle')}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="relative h-40 rounded-lg overflow-hidden border border-border">
                    <img src={chickenPromo} alt="Promoção" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg">
                    <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center text-primary-foreground font-bold">
                      P
                    </div>
                    <div>
                      <div className="font-semibold">{t('community.media.tokenization')}</div>
                      <div className="text-sm text-muted-foreground">{t('community.media.hoursAgo')}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg">
                    <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center text-primary-foreground font-bold">
                      L
                    </div>
                    <div>
                      <div className="font-semibold">{t('community.media.workshop')}</div>
                      <div className="text-sm text-muted-foreground">{t('community.media.hoursAgo2')}</div>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90"
                  onClick={() => window.open('https://br.cointelegraph.com/news/brazilian-tokenizes-chicken-coop-and-pays-holders-with-the-sale-of-eggs-and-chickens', '_blank')}
                >
                  {t('community.media.view')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};