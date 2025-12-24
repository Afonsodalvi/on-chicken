import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Users, Zap, Coins, Shield, BookOpen, Globe, User, Award, Code } from "lucide-react";
import { Link } from "react-router-dom";

const Details = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Target,
      title: t('details.features.realAssets.title'),
      description: t('details.features.realAssets.description')
    },
    {
      icon: Users,
      title: t('details.features.community.title'),
      description: t('details.features.community.description')
    },
    {
      icon: Zap,
      title: t('details.features.battles.title'),
      description: t('details.features.battles.description')
    },
    {
      icon: Coins,
      title: t('details.features.eggcoin.title'),
      description: t('details.features.eggcoin.description')
    },
    {
      icon: Shield,
      title: t('details.features.reputation.title'),
      description: t('details.features.reputation.description')
    },
    {
      icon: BookOpen,
      title: t('details.features.education.title'),
      description: t('details.features.education.description')
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-16 pb-8 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('details.backToHome')}
                </Button>
              </Link>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold font-display mb-6">
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                {t('details.title')}
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {t('details.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Main Description */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm border border-border/50 rounded-3xl p-8 md:p-12 shadow-2xl">
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    <span className="bg-gradient-hero bg-clip-text text-transparent">
                      {t('details.vision.title')}
                    </span>
                  </h2>
                  <div className="w-24 h-1 bg-gradient-hero mx-auto rounded-full"></div>
                </div>
                
                <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4 min-h-[200px] flex flex-col">
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        {t('details.vision.ecosystem.title')}
                      </h3>
                      <p className="text-base leading-relaxed flex-grow">
                        {t('details.vision.ecosystem.description')}
                      </p>
                    </div>
                    
                    <div className="space-y-4 min-h-[200px] flex flex-col">
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        {t('details.vision.benefits.title')}
                      </h3>
                      <p className="text-base leading-relaxed flex-grow">
                        {t('details.vision.benefits.description')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl">
                    <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
                      {t('details.vision.conclusion.title')}
                    </h3>
                    <p className="text-base leading-relaxed text-center">
                      {t('details.vision.conclusion.description')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-gradient-to-b from-transparent to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  {t('details.features.title')}
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('details.features.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="group bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:bg-card/50 transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-gradient-hero rounded-xl mr-4 group-hover:scale-110 transition-transform">
                      <feature.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Overview */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-6">
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                {t('details.ecosystem.title')}
              </span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-8">
                <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">{t('details.ecosystem.tokenization.title')}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('details.ecosystem.tokenization.description')}
                </p>
              </div>
              
              <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-8">
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">{t('details.ecosystem.education.title')}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('details.ecosystem.education.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Creator Section */}
      <section className="py-16 bg-gradient-to-b from-transparent to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  {t('details.creator.title')}
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('details.creator.subtitle')}
              </p>
            </div>

            <div className="bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm border border-border/50 rounded-3xl p-8 md:p-12 shadow-2xl">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Photos Section */}
                <div className="space-y-6">
                  <div className="relative">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Childhood Photo */}
                      <div className="relative group">
                        <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 p-2">
                          <img 
                            src="/images/afonso-childhood.jpg" 
                            alt="Afonso criança com galinha"
                            className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              console.log('Childhood image failed, trying fallback');
                              (e.target as HTMLImageElement).src = '/src/assets/eu.jpeg';
                            }}
                          />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                          {t('details.creator.childhood')}
                        </div>
                      </div>

                      {/* Adult Photo */}
                      <div className="relative group">
                        <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-accent/20 to-primary/20 p-2">
                          <img 
                            src="/images/afonso-today.jpg" 
                            alt="Afonso adulto com galinha"
                            className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              console.log('Today image failed, trying fallback');
                              (e.target as HTMLImageElement).src = '/src/assets/eu2.jpeg';
                            }}
                          />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full font-medium">
                          {t('details.creator.today')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="space-y-6">
                  <div className="text-center lg:text-left">
                    <h3 className="text-2xl md:text-3xl font-bold mb-2">
                      <span className="bg-gradient-hero bg-clip-text text-transparent">
                        {t('details.creator.name')}
                      </span>
                    </h3>
                    <p className="text-lg text-primary font-semibold mb-4">
                      {t('details.creator.role')}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {t('details.creator.experience')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <Award className="h-5 w-5 text-accent" />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Pioneiro em Tokenização de Animais
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Code className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Desenvolvedor Full-Stack & Blockchain
                      </span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-2xl p-6">
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {t('details.creator.description')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-4">{t('details.cta.title')}</h3>
              <p className="text-lg text-muted-foreground mb-6">
                {t('details.cta.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/whitelist">
                  <Button size="lg" className="bg-gradient-hero text-primary-foreground hover:opacity-90">
                    {t('details.cta.mint')}
                  </Button>
                </Link>
                <Link to="/farm">
                  <Button variant="outline" size="lg" className="border-border hover:bg-secondary">
                    {t('details.cta.explore')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Details;
