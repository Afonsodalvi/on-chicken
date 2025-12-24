import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Users, Zap, Coins, Shield, BookOpen, Globe, User, Award, Code, GraduationCap, Gift, Trophy, CheckCircle2, Users2, HandHeart, TrendingUp, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { usePublicClient, useChainId } from "wagmi";
import { getContractAddress } from "@/lib/contracts";
import { PUDGY_CHICKEN_ABI } from "@/lib/abi";
import { Address } from "viem";

const Details = () => {
  const { t } = useLanguage();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [totalMints, setTotalMints] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const TARGET_MINTS = 1800;

  // Função para buscar os supplies dos tokens 1-10
  const fetchTotalMints = useCallback(async () => {
    if (!publicClient) {
      console.warn("Public client not available");
      return;
    }

    setIsLoading(true);
    try {
      const collectionAddress = getContractAddress("PUDGY_CHICKEN_COLLECTION", chainId);
      
      if (!collectionAddress) {
        console.warn("Collection address not found for chain:", chainId);
        setIsLoading(false);
        return;
      }

      // Buscar supplies dos tokens 1-10 em paralelo
      const tokenIds = Array.from({ length: 10 }, (_, i) => i + 1);
      const supplyPromises = tokenIds.map((tokenId) =>
        publicClient.readContract({
          address: collectionAddress as Address,
          abi: PUDGY_CHICKEN_ABI,
          functionName: "getSupply",
          args: [BigInt(tokenId)],
        }).catch((error) => {
          console.error(`Error fetching supply for token ${tokenId}:`, error);
          return 0n;
        })
      );

      const supplies = await Promise.all(supplyPromises);
      
      // Somar todos os supplies
      const total = supplies.reduce((sum, supply) => {
        return sum + (typeof supply === 'bigint' ? Number(supply) : 0);
      }, 0);

      setTotalMints(total);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching total mints:", error);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, chainId]);

  // Buscar automaticamente quando a página carregar ou quando o chainId mudar
  useEffect(() => {
    if (publicClient && chainId) {
      fetchTotalMints();
    }
  }, [publicClient, chainId, fetchTotalMints]);

  // Calcular porcentagem
  const percentage = Math.min((totalMints / TARGET_MINTS) * 100, 100);

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

      {/* Educational Project Section */}
      <section className="py-16 bg-gradient-to-b from-primary/5 via-accent/5 to-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center p-3 bg-gradient-hero rounded-full mb-4">
                <GraduationCap className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  {t('details.education.title')}
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                {t('details.education.subtitle')}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 mb-12">
              {/* Left: Course Description */}
              <div className="bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold">{t('details.education.title')}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('details.education.description')}
                  </p>
                </div>
              </div>

              {/* Right: Goal Progress */}
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 rounded-2xl p-8 shadow-xl">
                <div className="space-y-6">
                  <div className="text-center">
                    <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">{t('details.education.goal.title')}</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      {t('details.education.goal.description')}
                    </p>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-muted-foreground">
                        {t('details.education.goal.current')}: {totalMints.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-2">
                        {lastUpdate && (
                          <span className="text-xs text-muted-foreground">
                            {lastUpdate.toLocaleTimeString()}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={fetchTotalMints}
                          disabled={isLoading}
                          className="h-7 w-7 p-0 hover:bg-primary/10"
                          title="Atualizar"
                        >
                          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-end text-sm mb-1">
                      <span className="font-semibold text-primary">
                        {t('details.education.goal.target')}: {TARGET_MINTS.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-gradient-hero h-full rounded-full transition-all duration-500 flex items-center justify-center"
                        style={{ width: `${percentage}%` }}
                      >
                        {percentage > 5 && (
                          <span className="text-xs font-semibold text-primary-foreground">
                            {percentage.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    {percentage < 5 && (
                      <div className="text-center">
                        <span className="text-xs font-semibold text-primary">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Collaborative Project Section */}
            <div className="bg-gradient-to-br from-accent/10 via-primary/5 to-accent/10 border-2 border-accent/30 rounded-2xl p-8 md:p-12 shadow-xl mb-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-accent to-primary rounded-full mb-4">
                  <HandHeart className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  <span className="bg-gradient-hero bg-clip-text text-transparent">
                    {t('details.education.collaborative.title')}
                  </span>
                </h3>
                <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                  {t('details.education.collaborative.description')}
                </p>
              </div>
            </div>

            {/* Funds Allocation Section */}
            <div className="bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm border border-border/50 rounded-2xl p-8 md:p-12 shadow-xl mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-hero rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{t('details.education.funds.title')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{t('details.education.funds.description')}</p>
                </div>
              </div>
              <ul className="space-y-3">
                {t('details.education.funds.list').split('\n').map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="p-1.5 bg-primary/10 rounded-full mt-0.5">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground flex-1">{item.replace('• ', '')}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Benefits Section */}
            <div className="bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-sm border border-border/50 rounded-2xl p-8 md:p-12 shadow-xl">
              <h3 className="text-2xl font-bold text-center mb-8">
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  {t('details.education.benefits.title')}
                </span>
              </h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Holders Benefits */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Gift className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-lg font-semibold">{t('details.education.benefits.holders')}</h4>
                  </div>
                  <ul className="space-y-2">
                    {t('details.education.benefits.holders.list').split('\n').map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted-foreground text-sm">{item.replace('• ', '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Players Benefits */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Trophy className="h-5 w-5 text-accent" />
                    </div>
                    <h4 className="text-lg font-semibold">{t('details.education.benefits.players')}</h4>
                  </div>
                  <ul className="space-y-2">
                    {t('details.education.benefits.players.list').split('\n').map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-muted-foreground text-sm">{item.replace('• ', '')}</span>
                      </li>
                    ))}
                  </ul>
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
              <p className="text-lg text-muted-foreground mb-2">
                {t('details.cta.description')}
              </p>
              <p className="text-base font-semibold text-primary mb-6">
                {t('details.education.cta')}
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

