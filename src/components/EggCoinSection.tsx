import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, MapPin, Gift, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const EggCoinSection = () => {
  const { t } = useLanguage();

  const handleBuyEggCoin = () => {
    // TODO: Implement EggCoin purchase logic
    console.log("Buy EggCoin clicked");
  };

  return (
    <section id="eggcoin" className="py-20 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-primary/20">
              <Coins className="w-4 h-4" />
              {t('eggcoin.badge')}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              {t('eggcoin.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('eggcoin.subtitle')}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="border shadow-sm bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{t('eggcoin.feature1.title')}</h3>
                <p className="text-muted-foreground">
                  {t('eggcoin.feature1.desc')}
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{t('eggcoin.feature2.title')}</h3>
                <p className="text-muted-foreground">
                  {t('eggcoin.feature2.desc')}
                </p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{t('eggcoin.feature3.title')}</h3>
                <p className="text-muted-foreground">
                  {t('eggcoin.feature3.desc')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="bg-muted/30 rounded-2xl p-8 border border-border/50">
            <h3 className="text-2xl font-bold mb-4 text-foreground">{t('eggcoin.how.title')}</h3>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div>
                <h4 className="font-semibold text-lg mb-2 text-foreground">{t('eggcoin.phase1.title')}</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>{t('eggcoin.phase1.item1')}</li>
                  <li>{t('eggcoin.phase1.item2')}</li>
                  <li>{t('eggcoin.phase1.item3')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2 text-foreground">{t('eggcoin.phase2.title')}</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>{t('eggcoin.phase2.item1')}</li>
                  <li>{t('eggcoin.phase2.item2')}</li>
                  <li>{t('eggcoin.phase2.item3')}</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center">
              <Button 
                onClick={handleBuyEggCoin}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3"
              >
                <Coins className="w-5 h-5 mr-2" />
                {t('eggcoin.cta.buy')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
