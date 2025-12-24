import { useState } from "react";
import { Header } from "@/components/Header";
import { BattleArena } from "@/components/BattleArena";
import { BattleLobby } from "@/components/BattleLobby";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info, Zap, Shield, Heart, Sparkles, Egg } from "lucide-react";
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

interface NFT {
  id: number;
  name: string;
  image: string;
  attack: number;
  defense: number;
  speed: number;
  health: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  collection: string;
  owner: string;
}

const Battle = () => {
  const { t } = useLanguage();
  const [currentView, setCurrentView] = useState<"lobby" | "battle">("lobby");
  const [currentBattleId, setCurrentBattleId] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  // Mock NFTs do usuário atual (usando apenas tokens 1-10)
  const userNFTs: NFT[] = [
    {
      id: 1,
      name: "Pudgy Chicken #001",
      image: chicken1,
      attack: 85,
      defense: 70,
      speed: 60,
      health: 100,
      rarity: "legendary",
      collection: "Pudgy Chickens",
      owner: "currentUser"
    },
    {
      id: 2,
      name: "Pudgy Chicken #002",
      image: chicken2,
      attack: 90,
      defense: 50,
      speed: 80,
      health: 100,
      rarity: "epic",
      collection: "Pudgy Chickens",
      owner: "currentUser"
    },
    {
      id: 3,
      name: "Pudgy Chicken #003",
      image: chicken3,
      attack: 60,
      defense: 90,
      speed: 40,
      health: 100,
      rarity: "rare",
      collection: "Pudgy Chickens",
      owner: "currentUser"
    },
    {
      id: 4,
      name: "Pudgy Chicken #004",
      image: chicken4,
      attack: 75,
      defense: 60,
      speed: 95,
      health: 100,
      rarity: "epic",
      collection: "Pudgy Chickens",
      owner: "currentUser"
    },
    {
      id: 5,
      name: "Pudgy Chicken #005",
      image: chicken5,
      attack: 80,
      defense: 75,
      speed: 70,
      health: 100,
      rarity: "rare",
      collection: "Pudgy Chickens",
      owner: "currentUser"
    },
    {
      id: 6,
      name: "Pudgy Chicken #006",
      image: chicken6,
      attack: 95,
      defense: 55,
      speed: 85,
      health: 100,
      rarity: "legendary",
      collection: "Pudgy Chickens",
      owner: "currentUser"
    },
    {
      id: 7,
      name: "Pudgy Chicken #007",
      image: chicken7,
      attack: 70,
      defense: 85,
      speed: 50,
      health: 100,
      rarity: "epic",
      collection: "Pudgy Chickens",
      owner: "currentUser"
    },
    {
      id: 8,
      name: "Pudgy Chicken #008",
      image: chicken8,
      attack: 65,
      defense: 80,
      speed: 75,
      health: 100,
      rarity: "rare",
      collection: "Pudgy Chickens",
      owner: "currentUser"
    },
    {
      id: 9,
      name: "Pudgy Chicken #009",
      image: chicken9,
      attack: 88,
      defense: 65,
      speed: 90,
      health: 100,
      rarity: "legendary",
      collection: "Pudgy Chickens",
      owner: "currentUser"
    },
    {
      id: 10,
      name: "Pudgy Chicken #010",
      image: chicken10,
      attack: 72,
      defense: 78,
      speed: 65,
      health: 100,
      rarity: "epic",
      collection: "Pudgy Chickens",
      owner: "currentUser"
    }
  ];

  const handleCreateBattle = (battleId: string) => {
    console.log("Creating battle with ID:", battleId);
    setIsLoading(true);
    setCurrentBattleId(battleId);
    setIsCreator(true);
    
    // Small delay to show loading state
    setTimeout(() => {
      setCurrentView("battle");
      setIsLoading(false);
      // Scroll to top when entering battle
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  };

  const handleJoinBattle = (battleId: string) => {
    console.log("Joining battle with ID:", battleId);
    setIsLoading(true);
    setCurrentBattleId(battleId);
    setIsCreator(false);
    
    // Small delay to show loading state
    setTimeout(() => {
      setCurrentView("battle");
      setIsLoading(false);
      // Scroll to top when entering battle
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  };

  const handleBattleComplete = (winner: NFT) => {
    // Aqui você pode adicionar lógica para recompensas, estatísticas, etc.
    console.log("Batalha finalizada! Vencedor:", winner);
  };

  const handleLeaveBattle = () => {
    setCurrentView("lobby");
    setCurrentBattleId(null);
    setIsCreator(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {isLoading ? (
        <section className="py-20 bg-secondary/20 min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <h2 className="text-xl font-semibold">Entrando na Arena...</h2>
            <p className="text-muted-foreground">Preparando sua batalha</p>
          </div>
        </section>
      ) : currentView === "lobby" ? (
        <section className="py-20 bg-secondary/20 min-h-screen">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold">
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  {t('battle.title')}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('battle.subtitle')}
              </p>
              <Dialog open={isHowItWorksOpen} onOpenChange={setIsHowItWorksOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="mt-4 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary-foreground font-medium"
                  >
                    <Info className="mr-2 h-4 w-4" />
                    {t('battle.howItWorks.button')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                      {t('battle.howItWorks.title')}
                    </DialogTitle>
                    <DialogDescription className="pt-4 space-y-6">
                      {/* Raridade */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          {t('battle.howItWorks.rarity.title')}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {t('battle.howItWorks.rarity.description')}
                        </p>
                      </div>

                      {/* Skills */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Zap className="h-5 w-5 text-yellow-500" />
                          {t('battle.howItWorks.skills.title')}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {t('battle.howItWorks.skills.description')}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
                          <div className="p-3 bg-muted rounded-lg text-center">
                            <div className="text-xs text-muted-foreground mb-1">Power</div>
                            <div className="text-lg font-bold text-foreground">⚡</div>
                          </div>
                          <div className="p-3 bg-muted rounded-lg text-center">
                            <div className="text-xs text-muted-foreground mb-1">Speed</div>
                            <div className="text-lg font-bold text-foreground">🏃</div>
                          </div>
                          <div className="p-3 bg-muted rounded-lg text-center">
                            <div className="text-xs text-muted-foreground mb-1">Health</div>
                            <div className="text-lg font-bold text-foreground">❤️</div>
                          </div>
                          <div className="p-3 bg-muted rounded-lg text-center">
                            <div className="text-xs text-muted-foreground mb-1">Clucking</div>
                            <div className="text-lg font-bold text-foreground">🐔</div>
                          </div>
                          <div className="p-3 bg-muted rounded-lg text-center">
                            <div className="text-xs text-muted-foreground mb-1">Brood Power</div>
                            <div className="text-lg font-bold text-foreground">🥚</div>
                          </div>
                        </div>
                      </div>

                      {/* VRF */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Shield className="h-5 w-5 text-blue-500" />
                          {t('battle.howItWorks.vrf.title')}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {t('battle.howItWorks.vrf.description')}
                        </p>
                      </div>

                      {/* Gameplay */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Heart className="h-5 w-5 text-red-500" />
                          {t('battle.howItWorks.gameplay.title')}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {t('battle.howItWorks.gameplay.description')}
                        </p>
                      </div>

                      {/* Dica */}
                      <div className="p-4 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/20 rounded-lg space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {t('battle.howItWorks.tip.title')}
                        </h3>
                        <p className="text-sm leading-relaxed text-foreground">
                          {t('battle.howItWorks.tip.description')}
                        </p>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
            
            <BattleLobby
              onJoinBattle={handleJoinBattle}
              onCreateBattle={handleCreateBattle}
              userNFTs={userNFTs}
              currentUser="currentUser"
            />
          </div>
        </section>
      ) : (
        <BattleArena
          battleId={currentBattleId || undefined}
          isCreator={isCreator}
          onBattleComplete={handleBattleComplete}
          onLeaveBattle={handleLeaveBattle}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default Battle;
