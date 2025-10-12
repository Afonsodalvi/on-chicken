import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sword, Shield, Zap, Heart, Trophy, RotateCcw, Users, Clock, Coins } from "lucide-react";
import { useBattleContext } from "@/contexts/BattleContext";
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

interface BattleState {
  player1: NFT | null;
  player2: NFT | null;
  isBattling: boolean;
  battleLog: string[];
  winner: NFT | null;
  currentTurn: "player1" | "player2";
  battleId: string | null;
  isWaitingForOpponent: boolean;
  battleStatus: "waiting" | "active" | "finished";
}

interface BattleArenaProps {
  battleId?: string;
  isCreator?: boolean;
  onBattleComplete?: (winner: NFT) => void;
  onLeaveBattle?: () => void;
}

export const BattleArena = ({ battleId, isCreator = false, onBattleComplete, onLeaveBattle }: BattleArenaProps) => {
  const { t } = useLanguage();
  const { getBattle, updateBattleStatus, startBattle: startBattleInContext, battles, getTotalEggCoinBet } = useBattleContext();
  const [battleState, setBattleState] = useState<BattleState>({
    player1: null,
    player2: null,
    isBattling: false,
    battleLog: [],
    winner: null,
    currentTurn: "player1",
    battleId: battleId || null,
    isWaitingForOpponent: false,
    battleStatus: "waiting"
  });

  // Mock NFTs para demonstração
  const availableNFTs: NFT[] = [
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

  // Atualizar estado quando a batalha muda no contexto
  useEffect(() => {
    if (battleId) {
      console.log("BattleArena: Loading battle with ID:", battleId);
      const battle = getBattle(battleId);
      console.log("BattleArena: Found battle:", battle);
      
      if (battle) {
        setBattleState(prev => ({
          ...prev,
          player1: battle.creatorNFT,
          // Só atualiza player2 se não estiver batalhando/finalizada e se há participante
          player2: (prev.isBattling || prev.battleStatus === "finished") ? prev.player2 : (battle.participant?.nft || null),
          battleStatus: battle.status,
          isWaitingForOpponent: !battle.participant,
          battleLog: !battle.participant 
            ? [`Batalha criada! Aguardando oponente para ${battle.creatorNFT.name}...`]
            : battle.participant && battle.status === "waiting"
            ? [`${battle.participant.nft.name} entrou na batalha! Ambos estão prontos.`]
            : prev.battleLog
        }));
        console.log("BattleArena: Battle state updated");
      } else {
        console.warn("BattleArena: Battle not found with ID:", battleId);
      }
    }
  }, [battleId, battles]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "bg-gray-500";
      case "rare": return "bg-blue-500";
      case "epic": return "bg-purple-500";
      case "legendary": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const selectNFT = (nft: NFT, player: "player1" | "player2") => {
    setBattleState(prev => ({
      ...prev,
      [player]: nft,
      winner: null,
      battleLog: []
    }));
  };

  const startBattle = () => {
    if (!battleState.player1 || !battleState.player2 || !battleId) return;

    // Atualizar status no contexto
    const success = startBattleInContext(battleId);
    if (!success) {
      // Continuar mesmo se o contexto falhar
    }

    setBattleState(prev => ({
      ...prev,
      isBattling: true,
      battleStatus: "active",
      battleLog: [`Batalha iniciada entre ${prev.player1?.name} e ${prev.player2?.name}!`],
      currentTurn: "player1"
    }));

    // Simular batalha
    simulateBattle();
  };

  const createBattle = (nft: NFT) => {
    setBattleState(prev => ({
      ...prev,
      player1: nft,
      isWaitingForOpponent: true,
      battleStatus: "waiting",
      battleLog: [`Batalha criada! Aguardando oponente para ${nft.name}...`]
    }));
  };

  const joinBattle = (nft: NFT) => {
    setBattleState(prev => ({
      ...prev,
      player2: nft,
      isWaitingForOpponent: false,
      battleStatus: "active"
    }));
  };

  const simulateBattle = () => {
    if (!battleState.player1 || !battleState.player2) return;

    // Simular batalha on-chain - aguardar resultado
    setTimeout(() => {
      // Determinar vencedor baseado nos atributos (simulação)
      const p1Power = battleState.player1.attack + battleState.player1.defense + battleState.player1.speed + battleState.player1.health;
      const p2Power = battleState.player2.attack + battleState.player2.defense + battleState.player2.speed + battleState.player2.health;
      
      // Adicionar fator aleatório
      const p1Final = p1Power + Math.floor(Math.random() * 50);
      const p2Final = p2Power + Math.floor(Math.random() * 50);
      
      const winner = p1Final > p2Final ? battleState.player1 : battleState.player2;
      
      setBattleState(prev => ({
        ...prev,
        isBattling: false,
        battleStatus: "finished",
        winner
      }));
      
      // Atualizar status da batalha no contexto
      if (battleId && winner) {
        updateBattleStatus(battleId, "finished", winner);
      }
      
      if (onBattleComplete && winner) {
        onBattleComplete(winner);
      }
    }, 3000); // 3 segundos de "batalha"
  };

  const resetBattle = () => {
    setBattleState({
      player1: null,
      player2: null,
      isBattling: false,
      battleLog: [],
      winner: null,
      currentTurn: "player1",
      battleId: null,
      isWaitingForOpponent: false,
      battleStatus: "waiting"
    });
  };

  const leaveBattle = () => {
    if (onLeaveBattle) {
      onLeaveBattle();
    } else {
      resetBattle();
    }
  };

  const NFTCard = ({ nft, isSelected, onSelect, disabled }: { 
    nft: NFT; 
    isSelected: boolean; 
    onSelect: () => void; 
    disabled: boolean;
  }) => (
    <Card 
      className={`cursor-pointer transition-all duration-300 ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={disabled ? undefined : onSelect}
    >
      <CardContent className="p-4">
        <div className="relative">
          <img
            src={nft.image}
            alt={nft.name}
            className="w-full h-32 object-cover rounded-lg mb-3"
          />
          <Badge className={`absolute top-2 left-2 ${getRarityColor(nft.rarity)} text-white`}>
            {nft.rarity}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-bold text-lg">{nft.name}</h3>
          <p className="text-sm text-muted-foreground">{nft.collection}</p>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Sword className="h-3 w-3 text-red-500" />
              <span>{nft.attack}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-blue-500" />
              <span>{nft.defense}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span>{nft.speed}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3 text-green-500" />
              <span>{nft.health}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const BattleField = () => (
    <div className="grid grid-cols-3 gap-8 items-center">
      {/* Player 1 */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-center">{t('battle.players')} 1</h3>
        {battleState.player1 ? (
          <Card className={`bg-gradient-card transition-all duration-300 ${
            battleState.winner?.id === battleState.player1.id ? 'ring-4 ring-yellow-400 shadow-2xl' : ''
          }`}>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="relative">
                  <img
                    src={battleState.player1.image}
                    alt={battleState.player1.name}
                    className="w-32 h-32 object-cover rounded-full mx-auto"
                  />
                  {battleState.winner?.id === battleState.player1.id && (
                    <div className="absolute -top-2 -right-2">
                      <Trophy className="h-8 w-8 text-yellow-500 animate-bounce" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{battleState.player1.name}</h4>
                  <Badge className={getRarityColor(battleState.player1.rarity)}>
                    {battleState.player1.rarity}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Sword className="h-4 w-4 text-red-500" />
                    <span>{battleState.player1.attack}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span>{battleState.player1.defense}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span>{battleState.player1.speed}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-green-500" />
                    <span>{battleState.player1.health}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-2 border-muted-foreground/25">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">{t('battle.select.player1')}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* VS */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="text-6xl font-bold text-primary animate-pulse">VS</div>
        {battleState.isBattling && (
          <div className="flex items-center space-x-2">
            <Sword className="h-6 w-6 text-primary animate-spin" />
            <span className="text-sm font-bold text-primary">{t('battle.battling')}</span>
            <Sword className="h-6 w-6 text-primary animate-spin" />
          </div>
        )}
        {battleState.winner && (
          <div className="text-center space-y-2">
            <Trophy className="h-12 w-12 mx-auto text-yellow-500 animate-bounce" />
            <p className="text-lg font-bold text-yellow-600">{t('battle.winner')}!</p>
          </div>
        )}
      </div>

      {/* Player 2 */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-center">{t('battle.players')} 2</h3>
        {battleState.player2 ? (
          <Card className={`bg-gradient-card transition-all duration-300 ${
            battleState.winner?.id === battleState.player2.id ? 'ring-4 ring-yellow-400 shadow-2xl' : ''
          }`}>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="relative">
                  <img
                    src={battleState.player2.image}
                    alt={battleState.player2.name}
                    className="w-32 h-32 object-cover rounded-full mx-auto"
                  />
                  {battleState.winner?.id === battleState.player2.id && (
                    <div className="absolute -top-2 -right-2">
                      <Trophy className="h-8 w-8 text-yellow-500 animate-bounce" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{battleState.player2.name}</h4>
                  <Badge className={getRarityColor(battleState.player2.rarity)}>
                    {battleState.player2.rarity}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Sword className="h-4 w-4 text-red-500" />
                    <span>{battleState.player2.attack}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span>{battleState.player2.defense}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span>{battleState.player2.speed}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-green-500" />
                    <span>{battleState.player2.health}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-2 border-muted-foreground/25">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Selecione um NFT para o Jogador 2</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  return (
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


        {/* Battle Field */}
        <div className="mb-12">
          <BattleField />
        </div>

        {/* EggCoin Bet Display */}
        {battleState.battleId && (
          <div className="mb-8">
            <div className="max-w-2xl mx-auto">
              <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      <Coins className="h-6 w-6 text-primary" />
                      <h3 className="text-xl font-bold">{t('battle.betting.arena.title')}</h3>
                    </div>
                    
                    <div className="bg-primary/20 border border-primary/30 rounded-lg p-4">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {getTotalEggCoinBet(battleState.battleId)} 🥚
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {t('battle.betting.arena.pot')}
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {t('battle.betting.arena.winner')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}



        {/* Battle Controls */}
        <div className="flex flex-col items-center gap-4 mb-8">
          {/* Ambos jogadores prontos - pode iniciar */}
          {battleState.player1 && battleState.player2 && !battleState.isBattling && (
            <div className="text-center space-y-4">
              <Alert className="max-w-md">
                <Users className="h-4 w-4" />
                <AlertDescription>
                  Ambos os jogadores estão prontos! Alguém pode iniciar a batalha.
                </AlertDescription>
              </Alert>
              <div className="flex gap-4">
                <Button
                  onClick={startBattle}
                  size="lg"
                  className="bg-gradient-hero text-primary-foreground hover:opacity-90"
                >
                  <Sword className="mr-2 h-5 w-5" />
                  Iniciar Batalha
                </Button>
                <Button
                  onClick={leaveBattle}
                  variant="outline"
                  size="lg"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Voltar ao Lobby
                </Button>
              </div>
            </div>
          )}
          
          {/* Aguardando oponente - só quando não tem player2 */}
          {battleState.player1 && !battleState.player2 && !battleState.isBattling && (
            <div className="text-center space-y-4">
              <Alert className="max-w-md">
                <Users className="h-4 w-4" />
                <AlertDescription>
                  {t('battle.waiting.opponent')}
                </AlertDescription>
              </Alert>
              <Button
                onClick={leaveBattle}
                variant="outline"
                size="lg"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                {t('common.back')}
              </Button>
            </div>
          )}
          
          {/* Batalha finalizada */}
          {battleState.battleStatus === "finished" && (
            <div className="text-center space-y-6">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl p-8 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <Trophy className="h-12 w-12 text-white animate-bounce" />
                    <span className="text-3xl font-bold text-white">
                      {t('battle.victory')}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {battleState.winner?.name} {t('battle.winner.is')}
                  </div>
                  <div className="text-lg text-yellow-100">
                    {t('battle.congratulations')}
                  </div>
                  
                  {/* EggCoin Rewards */}
                  {battleState.battleId && getTotalEggCoinBet(battleState.battleId) > 0 && (
                    <div className="bg-white/20 border border-white/30 rounded-lg p-4 mt-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Coins className="h-6 w-6 text-yellow-200" />
                        <span className="text-lg font-bold text-white">
                          {t('battle.betting.rewards')}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-yellow-200">
                        +{getTotalEggCoinBet(battleState.battleId)} 🥚
                      </div>
                      <div className="text-sm text-yellow-100">
                        {t('battle.betting.rewards.description')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Button
                onClick={leaveBattle}
                size="lg"
                className="bg-gradient-hero text-primary-foreground hover:opacity-90"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                {t('common.back')}
              </Button>
            </div>
          )}
          
          {/* Batalha ativa mas não iniciada */}
          {battleState.battleStatus === "active" && !battleState.isBattling && (
            <div className="text-center space-y-4">
              <Alert className="max-w-md">
                <Sword className="h-4 w-4" />
                <AlertDescription>
                  Batalha pronta para começar!
                </AlertDescription>
              </Alert>
              <div className="flex gap-4">
                <Button
                  onClick={startBattle}
                  size="lg"
                  className="bg-gradient-hero text-primary-foreground hover:opacity-90"
                >
                  <Sword className="mr-2 h-5 w-5" />
                  Iniciar Batalha
                </Button>
                <Button
                  onClick={leaveBattle}
                  variant="outline"
                  size="lg"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Voltar ao Lobby
                </Button>
              </div>
            </div>
          )}
          
          {/* Batalha em andamento */}
          {battleState.isBattling && (
            <div className="text-center space-y-4">
              <Alert className="max-w-md">
                <Sword className="h-4 w-4 animate-pulse" />
                <AlertDescription>
                  Batalha em andamento...
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {/* Fallback - sempre mostrar botão de voltar */}
          {!battleState.isWaitingForOpponent && (!battleState.player1 || !battleState.player2) && (
            <div className="text-center space-y-4">
              <Alert className="max-w-md">
                <Users className="h-4 w-4" />
                <AlertDescription>
                  Configurando batalha...
                </AlertDescription>
              </Alert>
              <Button
                onClick={leaveBattle}
                variant="outline"
                size="lg"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                {t('common.back')}
              </Button>
            </div>
          )}
        </div>

        {/* NFT Selection */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-center">
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Selecione seus NFTs
            </span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {availableNFTs.map((nft) => (
              <NFTCard
                key={nft.id}
                nft={nft}
                isSelected={battleState.player1?.id === nft.id || battleState.player2?.id === nft.id}
                onSelect={() => {
                  if (battleState.player1?.id === nft.id) {
                    selectNFT(nft, "player1");
                  } else if (battleState.player2?.id === nft.id) {
                    selectNFT(nft, "player2");
                  } else if (!battleState.player1) {
                    selectNFT(nft, "player1");
                  } else if (!battleState.player2) {
                    selectNFT(nft, "player2");
                  }
                }}
                disabled={battleState.isBattling}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
