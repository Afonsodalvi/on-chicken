import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sword, Users, Clock, Trophy, Zap, Coins } from "lucide-react";
import { useBattleContext } from "@/contexts/BattleContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { EggCoinBetSelector } from "@/components/EggCoinBetSelector";
import chicken12 from "@/assets/12.png";

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
}

interface BattleLobbyProps {
  onJoinBattle: (battleId: string) => void;
  onCreateBattle: (battleId: string) => void;
  userNFTs: NFT[];
  currentUser: string;
}

export const BattleLobby = ({ onJoinBattle, onCreateBattle, userNFTs, currentUser }: BattleLobbyProps) => {
  const { t } = useLanguage();
  const { battles, createBattle, joinBattle } = useBattleContext();
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [betAmount, setBetAmount] = useState<number | null>(null);

  // Filtrar batalhas disponíveis (aguardando participantes)
  const availableBattles = battles.filter(battle => 
    battle.status === "waiting" && 
    !battle.participant
  );

  // Separar batalhas criadas pelo usuário atual das outras
  const myBattles = availableBattles.filter(battle => battle.creator === currentUser);
  const otherBattles = availableBattles.filter(battle => battle.creator !== currentUser);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "bg-gray-500";
      case "rare": return "bg-blue-500";
      case "epic": return "bg-purple-500";
      case "legendary": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting": return "bg-yellow-500";
      case "active": return "bg-green-500";
      case "finished": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "waiting": return t('battle.waiting');
      case "active": return t('battle.active');
      case "finished": return t('battle.finished');
      default: return t('common.error');
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Agora mesmo";
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d atrás`;
  };

  const handleCreateBattle = () => {
    if (selectedNFT) {
      const battleId = createBattle(currentUser, selectedNFT, betAmount || undefined);
      onCreateBattle(battleId);
    }
  };

  const handleJoinBattle = (battleId: string) => {
    if (selectedNFT) {
      console.log("Attempting to join battle:", battleId, "with NFT:", selectedNFT.name, "bet:", betAmount);
      const success = joinBattle(battleId, currentUser, selectedNFT, betAmount || undefined);
      console.log("Join battle success:", success);
      if (success) {
        console.log("Calling onJoinBattle with ID:", battleId);
        onJoinBattle(battleId);
      } else {
        console.error("Failed to join battle");
        // You could add a toast notification here
      }
    } else {
      console.warn("No NFT selected for joining battle");
      // You could add a toast notification here
    }
  };

  const NFTCard = ({ nft, isSelected, onSelect }: { 
    nft: NFT; 
    isSelected: boolean; 
    onSelect: () => void;
  }) => (
    <Card 
      className={`cursor-pointer transition-all duration-300 ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="relative">
          <img
            src={nft.image}
            alt={nft.name}
            className="w-full h-24 object-cover rounded-lg mb-3"
          />
          <Badge className={`absolute top-2 left-2 ${getRarityColor(nft.rarity)} text-white text-xs`}>
            {nft.rarity}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-bold text-sm">{nft.name}</h3>
          <p className="text-xs text-muted-foreground">{nft.collection}</p>
          
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex items-center gap-1">
              <Sword className="h-3 w-3 text-red-500" />
              <span>{nft.attack}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span>{nft.speed}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const BattleCard = ({ battle }: { battle: BattleRoom }) => (
    <Card className={`hover:shadow-lg transition-all duration-300 ${
      battle.creator === currentUser ? 'ring-2 ring-primary bg-primary/5' : ''
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src={battle.creatorNFT.image}
              alt={battle.creatorNFT.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div>
              <h3 className="font-bold text-lg">{battle.creatorNFT.name}</h3>
              <div className="flex items-center gap-2">
                <Badge className={getRarityColor(battle.creatorNFT.rarity)}>
                  {battle.creatorNFT.rarity}
                </Badge>
                <Badge className={getStatusColor(battle.status)}>
                  {getStatusText(battle.status)}
                </Badge>
                {battle.creator === currentUser && (
                  <Badge className="bg-primary text-primary-foreground">
                    Sua Batalha
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTimeAgo(battle.createdAt)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Sword className="h-4 w-4 text-red-500" />
              <span className="font-bold">{battle.creatorNFT.attack}</span>
            </div>
            <div className="text-xs text-muted-foreground">{t('battle.attack')}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="font-bold">{battle.creatorNFT.speed}</span>
            </div>
            <div className="text-xs text-muted-foreground">{t('battle.speed')}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="font-bold">{battle.participant ? "2/2" : "1/2"}</span>
            </div>
            <div className="text-xs text-muted-foreground">{t('battle.players')}</div>
          </div>
        </div>

        {/* EggCoin Bet Display */}
        {battle.eggCoinBet && (
          <div className="mb-4 p-3 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{t('battle.betting.pot')}</span>
              </div>
              <div className="text-lg font-bold text-primary">
                {battle.eggCoinBet.amount} 🥚
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {t('battle.betting.creator')}: {battle.eggCoinBet.creatorBet} 🥚
              {battle.eggCoinBet.participantBet > 0 && (
                <span> | {t('battle.betting.participant')}: {battle.eggCoinBet.participantBet} 🥚</span>
              )}
            </div>
          </div>
        )}

        {battle.status === "waiting" && !battle.participant && (
          <Button 
            onClick={() => {
              if (battle.creator === currentUser) {
                console.log("Creator joining own battle:", battle.id);
                onJoinBattle(battle.id);
              } else {
                console.log("Participant joining battle:", battle.id);
                handleJoinBattle(battle.id);
              }
            }}
            disabled={!selectedNFT && battle.creator !== currentUser}
            className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90 transition-all duration-300 hover:scale-105"
          >
            <Sword className="mr-2 h-4 w-4" />
            {battle.creator === currentUser ? t('battle.enter') : t('battle.join')}
          </Button>
        )}

        {battle.status === "active" && (
          <Alert>
            <AlertDescription>
              {t('battle.active')}
            </AlertDescription>
          </Alert>
        )}

        {battle.status === "finished" && battle.winner && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="font-bold">{t('battle.winner')}: {battle.winner.name}</span>
            </div>
            <Badge className="bg-yellow-500 text-white">
              {t('battle.finished')}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Seleção de NFT */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center">
          <span className="bg-gradient-hero bg-clip-text text-transparent">
            {t('battle.select')}
          </span>
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {userNFTs.map((nft) => (
            <NFTCard
              key={nft.id}
              nft={nft}
              isSelected={selectedNFT?.id === nft.id}
              onSelect={() => setSelectedNFT(nft)}
            />
          ))}
        </div>

        {selectedNFT && (
          <div className="space-y-6">
            {/* EggCoin Bet Selector */}
            <EggCoinBetSelector
              onBetChange={setBetAmount}
              maxAmount={1000}
            />
            
            <div className="text-center">
              <Button
                onClick={handleCreateBattle}
                size="lg"
                className="bg-gradient-hero text-primary-foreground hover:opacity-90"
              >
                <Sword className="mr-2 h-5 w-5" />
                {t('battle.create')}
                {betAmount && (
                  <span className="ml-2 text-sm">
                    (+{betAmount} 🥚)
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Suas Batalhas */}
      {myBattles.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              {t('battle.your')}
            </span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {myBattles.map((battle) => (
              <BattleCard key={battle.id} battle={battle} />
            ))}
          </div>
        </div>
      )}

      {/* Lista de Batalhas Disponíveis */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center">
          <span className="bg-gradient-hero bg-clip-text text-transparent">
            {t('battle.available')}
          </span>
        </h2>
        
        {otherBattles.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold mb-2">{t('battle.none')}</h3>
              <p className="text-muted-foreground">
                {t('battle.none.subtitle')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {otherBattles.map((battle) => (
              <BattleCard key={battle.id} battle={battle} />
            ))}
          </div>
        )}
      </div>

      {!selectedNFT && (
        <Alert>
          <AlertDescription>
            {t('battle.select.nft')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
