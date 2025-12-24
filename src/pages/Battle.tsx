import { useState } from "react";
import { Header } from "@/components/Header";
import { BattleArena } from "@/components/BattleArena";
import { BattleLobby } from "@/components/BattleLobby";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
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
