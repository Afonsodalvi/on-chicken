import { useState } from "react";
import { Header } from "@/components/Header";
import { BattleArena } from "@/components/BattleArena";
import { BattleLobby } from "@/components/BattleLobby";
import { Footer } from "@/components/Footer";
import chickenCollection from "@/assets/4.png";

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
  const [currentView, setCurrentView] = useState<"lobby" | "battle">("lobby");
  const [currentBattleId, setCurrentBattleId] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);

  // Mock NFTs do usuário atual
  const userNFTs: NFT[] = [
    {
      id: 1,
      name: "Golden Rooster",
      image: chickenCollection,
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
      name: "Fire Chicken",
      image: chickenCollection,
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
      name: "Ice Hen",
      image: chickenCollection,
      attack: 60,
      defense: 90,
      speed: 40,
      health: 100,
      rarity: "rare",
      collection: "Lil Chicks",
      owner: "currentUser"
    },
    {
      id: 4,
      name: "Thunder Bird",
      image: chickenCollection,
      attack: 75,
      defense: 60,
      speed: 95,
      health: 100,
      rarity: "epic",
      collection: "Lil Chicks",
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
                  Arena de Batalha
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Escolha seus NFTs favoritos e participe de batalhas épicas na arena. 
                Crie uma batalha ou participe de uma existente!
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
