import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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

interface BattleRoom {
  id: string;
  creator: string;
  creatorNFT: NFT;
  status: "waiting" | "active" | "finished";
  createdAt: Date;
  winner?: NFT;
  participant?: {
    user: string;
    nft: NFT;
  };
  eggCoinBet?: {
    amount: number;
    creatorBet: number;
    participantBet: number;
  };
}

interface BattleContextType {
  battles: BattleRoom[];
  createBattle: (creator: string, nft: NFT, eggCoinBet?: number) => string;
  joinBattle: (battleId: string, participant: string, nft: NFT, eggCoinBet?: number) => boolean;
  startBattle: (battleId: string) => boolean;
  updateBattleStatus: (battleId: string, status: "waiting" | "active" | "finished", winner?: NFT) => void;
  getBattle: (battleId: string) => BattleRoom | undefined;
  removeBattle: (battleId: string) => void;
  getTotalEggCoinBet: (battleId: string) => number;
}

const BattleContext = createContext<BattleContextType | undefined>(undefined);

export const useBattleContext = () => {
  const context = useContext(BattleContext);
  if (!context) {
    throw new Error("useBattleContext must be used within a BattleProvider");
  }
  return context;
};

interface BattleProviderProps {
  children: ReactNode;
}

export const BattleProvider = ({ children }: BattleProviderProps) => {
  const [battles, setBattles] = useState<BattleRoom[]>([]);

  // Carregar batalhas do localStorage na inicialização
  useEffect(() => {
    const savedBattles = localStorage.getItem("pudgy-chicken-battles");
    if (savedBattles) {
      try {
        const parsedBattles = JSON.parse(savedBattles).map((battle: any) => ({
          ...battle,
          createdAt: new Date(battle.createdAt)
        }));
        setBattles(parsedBattles);
      } catch (error) {
        console.error("Error loading battles from localStorage:", error);
      }
    }
  }, []);

  // Salvar batalhas no localStorage sempre que houver mudanças
  useEffect(() => {
    localStorage.setItem("pudgy-chicken-battles", JSON.stringify(battles));
  }, [battles]);

  const createBattle = (creator: string, nft: NFT, eggCoinBet?: number): string => {
    const battleId = `battle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newBattle: BattleRoom = {
      id: battleId,
      creator,
      creatorNFT: nft,
      status: "waiting",
      createdAt: new Date(),
      ...(eggCoinBet && {
        eggCoinBet: {
          amount: eggCoinBet,
          creatorBet: eggCoinBet,
          participantBet: 0
        }
      })
    };

    setBattles(prev => [...prev, newBattle]);
    return battleId;
  };

  const joinBattle = (battleId: string, participant: string, nft: NFT, eggCoinBet?: number): boolean => {
    let success = false;
    
    setBattles(prev => prev.map(battle => {
      if (battle.id === battleId && battle.status === "waiting" && !battle.participant) {
        success = true;
        return {
          ...battle,
          participant: { user: participant, nft },
          status: "waiting", // Mantém como waiting até alguém iniciar
          ...(battle.eggCoinBet && eggCoinBet && {
            eggCoinBet: {
              ...battle.eggCoinBet,
              participantBet: eggCoinBet,
              amount: battle.eggCoinBet.creatorBet + eggCoinBet
            }
          })
        };
      }
      return battle;
    }));
    
    return success;
  };

  const startBattle = (battleId: string): boolean => {
    let success = false;
    
    setBattles(prev => prev.map(battle => {
      if (battle.id === battleId && battle.status === "waiting" && battle.participant) {
        success = true;
        return {
          ...battle,
          status: "active"
        };
      }
      return battle;
    }));

    return success;
  };

  const updateBattleStatus = (battleId: string, status: "waiting" | "active" | "finished", winner?: NFT) => {
    setBattles(prev => prev.map(battle => {
      if (battle.id === battleId) {
        return {
          ...battle,
          status,
          winner
        };
      }
      return battle;
    }));
  };

  const getBattle = (battleId: string): BattleRoom | undefined => {
    return battles.find(battle => battle.id === battleId);
  };

  const removeBattle = (battleId: string) => {
    setBattles(prev => prev.filter(battle => battle.id !== battleId));
  };

  const getTotalEggCoinBet = (battleId: string): number => {
    const battle = getBattle(battleId);
    return battle?.eggCoinBet?.amount || 0;
  };

  const value: BattleContextType = {
    battles,
    createBattle,
    joinBattle,
    startBattle,
    updateBattleStatus,
    getBattle,
    removeBattle,
    getTotalEggCoinBet
  };

  return (
    <BattleContext.Provider value={value}>
      {children}
    </BattleContext.Provider>
  );
};
