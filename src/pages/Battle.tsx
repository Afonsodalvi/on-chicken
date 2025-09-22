import { useState } from "react";
import { Header } from "@/components/Header";
import { BattleArena } from "@/components/BattleArena";
import { BattleLobby } from "@/components/BattleLobby";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import chicken12 from "@/assets/12.png";
import chicken13 from "@/assets/13.png";
import chicken14 from "@/assets/14.png";
import chicken15 from "@/assets/15.png";
import chicken16 from "@/assets/16.png";
import chicken17 from "@/assets/17.png";
import chicken18 from "@/assets/18.png";
import chicken19 from "@/assets/19.png";
import chicken20 from "@/assets/20.png";
import chicken21 from "@/assets/21.png";
import chicken22 from "@/assets/22.png";
import chicken23 from "@/assets/23.png";

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

  // Mock NFTs do usuário atual
  const userNFTs: NFT[] = [
    {
      id: 1,
      name: "Pudgy Chicken #012",
      image: chicken12,
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
      name: "Pudgy Chicken #013",
      image: chicken13,
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
      name: "Pudgy Chicken #014",
      image: chicken14,
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
      name: "Pudgy Chicken #015",
      image: chicken15,
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
      name: "Pudgy Chicken #016",
      image: chicken16,
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
      name: "Pudgy Chicken #017",
      image: chicken17,
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
      name: "Pudgy Chicken #018",
      image: chicken18,
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
      name: "Pudgy Chicken #019",
      image: chicken19,
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
      name: "Pudgy Chicken #020",
      image: chicken20,
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
      name: "Pudgy Chicken #021",
      image: chicken21,
      attack: 72,
      defense: 78,
      speed: 65,
      health: 100,
      rarity: "epic",
      collection: "Pudgy Chickens",
      owner: "currentUser"
    },
    {
      id: 11,
      name: "Pudgy Chicken #022",
      image: chicken22,
      attack: 82,
      defense: 72,
      speed: 80,
      health: 100,
      rarity: "rare",
      collection: "Pudgy Chickens",
      owner: "currentUser"
    },
    {
      id: 12,
      name: "Pudgy Chicken #023",
      image: chicken23,
      attack: 92,
      defense: 68,
      speed: 95,
      health: 100,
      rarity: "legendary",
      collection: "Pudgy Chickens",
      owner: "currentUser"
    }
  ];

  const handleCreateBattle = (battleId: string) => {
    setCurrentBattleId(battleId);
    setIsCreator(true);
    setCurrentView("battle");
  };

  const handleJoinBattle = (battleId: string) => {
    setCurrentBattleId(battleId);
    setIsCreator(false);
    setCurrentView("battle");
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
      
      {currentView === "lobby" ? (
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
