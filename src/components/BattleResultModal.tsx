import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, XCircle, Zap, Heart, Wind, Volume2, Shield, Loader2, User, Users, Copy, CheckCircle, AlertTriangle } from "lucide-react";
import { useAccount, usePublicClient } from "wagmi";
import { Address } from "viem";
import { PUDGY_CHICKEN_FIGHT_ABI } from "@/lib/abi";
import { CONTRACTS } from "@/lib/contracts";
import { getTokenAsset } from "@/lib/token-assets";
import { toast } from "sonner";

interface MatchInfo {
  player1: Address;
  collection1: Address;
  tokenId1: bigint;
  instanceId1: bigint;
  player2: Address;
  collection2: Address;
  tokenId2: bigint;
  instanceId2: bigint;
  status: number; // MatchStatus enum
  requestId: bigint;
  winner: Address;
  loser: Address;
  winningAttribute: number;
  battleType: number; // BattleType enum
  betAmount: bigint;
  paymentType: number; // PaymentType enum
}

interface BattleResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: bigint;
  userAddress: Address;
}

export const BattleResultModal: React.FC<BattleResultModalProps> = ({
  open,
  onOpenChange,
  matchId,
  userAddress,
}) => {
  const publicClient = usePublicClient();
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [nftTransferEnabled, setNftTransferEnabled] = useState<boolean | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    if (open && matchId && publicClient) {
      fetchMatchInfo();
    }
  }, [open, matchId, publicClient]);

  const fetchMatchInfo = async () => {
    if (!publicClient) return;

    setIsLoading(true);
    try {
      const fightAddress = CONTRACTS.PUDGY_CHICKEN_FIGHT.baseSepolia;
      if (!fightAddress || fightAddress === "0x") {
        throw new Error("Contrato não encontrado");
      }

      // Buscar informações do match e nftTransferEnabled em paralelo
      const [matchResult, nftTransfer] = await Promise.all([
        publicClient.readContract({
          address: fightAddress,
          abi: PUDGY_CHICKEN_FIGHT_ABI,
          functionName: "matches",
          args: [matchId],
        }) as Promise<any>,
        publicClient.readContract({
          address: fightAddress,
          abi: PUDGY_CHICKEN_FIGHT_ABI,
          functionName: "nftTransferEnabled",
        }) as Promise<boolean>
      ]);

      // Normalizar o retorno: se for array, converter para objeto
      const match: MatchInfo = Array.isArray(matchResult) ? {
        player1: matchResult[0],
        collection1: matchResult[1],
        tokenId1: matchResult[2],
        instanceId1: matchResult[3],
        player2: matchResult[4],
        collection2: matchResult[5],
        tokenId2: matchResult[6],
        instanceId2: matchResult[7],
        status: Number(matchResult[8]),
        requestId: matchResult[9],
        winner: matchResult[10],
        loser: matchResult[11],
        winningAttribute: Number(matchResult[12]),
        battleType: Number(matchResult[13]),
        betAmount: matchResult[14],
        paymentType: Number(matchResult[15]),
      } : {
        ...matchResult,
        status: Number(matchResult.status),
        winningAttribute: Number(matchResult.winningAttribute),
        battleType: Number(matchResult.battleType),
        paymentType: Number(matchResult.paymentType),
      };

      console.log("📊 Match info normalizado:", match);
      setMatchInfo(match);
      setNftTransferEnabled(nftTransfer);
    } catch (err) {
      console.error("Erro ao buscar informações da batalha:", err);
      toast.error("Erro ao carregar informações da batalha");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(label);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  if (!matchInfo || isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Validação adicional: garantir que todas as propriedades necessárias existem
  if (!matchInfo.player1 || !matchInfo.player2 || !matchInfo.winner || !matchInfo.loser) {
    console.error("Match info incompleto:", matchInfo);
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p className="text-center text-muted-foreground">
              Erro ao carregar informações da batalha. Alguns dados estão faltando.
            </p>
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Verificações seguras com validação de undefined
  const isUserPlayer1 = matchInfo.player1 && userAddress && matchInfo.player1.toLowerCase() === userAddress.toLowerCase();
  const isUserPlayer2 = matchInfo.player2 && userAddress && matchInfo.player2.toLowerCase() === userAddress.toLowerCase();
  const isUserWinner = matchInfo.winner && userAddress && matchInfo.winner.toLowerCase() === userAddress.toLowerCase();
  const isUserLoser = matchInfo.loser && userAddress && matchInfo.loser.toLowerCase() === userAddress.toLowerCase();

  const userTokenId = isUserPlayer1 ? matchInfo.tokenId1 : matchInfo.tokenId2;
  const opponentTokenId = isUserPlayer1 ? matchInfo.tokenId2 : matchInfo.tokenId1;
  const userInstanceId = isUserPlayer1 ? matchInfo.instanceId1 : matchInfo.instanceId2;
  const opponentInstanceId = isUserPlayer1 ? matchInfo.instanceId2 : matchInfo.instanceId1;

  const userTokenAsset = getTokenAsset(Number(userTokenId));
  const opponentTokenAsset = getTokenAsset(Number(opponentTokenId));

  const statusLabels: Record<number, string> = {
    0: "Aguardando",
    1: "Em Batalha",
    2: "Em Batalha",
    3: "Finalizada",
  };

  const attributeLabels: Record<number, string> = {
    0: "Power",
    1: "Speed",
    2: "Health",
    3: "Clucking",
    4: "Brood Power",
  };

  const attributeIcons: Record<number, typeof Zap> = {
    0: Zap,
    1: Wind,
    2: Heart,
    3: Volume2,
    4: Shield,
  };

  const WinningAttributeIcon = attributeIcons[matchInfo.winningAttribute] || Zap;

  // Determinar winner/loser com validação segura
  const winnerTokenId = matchInfo.winner && matchInfo.player1 && matchInfo.winner.toLowerCase() === matchInfo.player1.toLowerCase() 
    ? matchInfo.tokenId1 
    : matchInfo.tokenId2;
  const loserTokenId = matchInfo.loser && matchInfo.player1 && matchInfo.loser.toLowerCase() === matchInfo.player1.toLowerCase() 
    ? matchInfo.tokenId1 
    : matchInfo.tokenId2;
  const winnerInstanceId = matchInfo.winner && matchInfo.player1 && matchInfo.winner.toLowerCase() === matchInfo.player1.toLowerCase() 
    ? matchInfo.instanceId1 
    : matchInfo.instanceId2;
  const loserInstanceId = matchInfo.loser && matchInfo.player1 && matchInfo.loser.toLowerCase() === matchInfo.player1.toLowerCase() 
    ? matchInfo.instanceId1 
    : matchInfo.instanceId2;

  const winnerTokenAsset = getTokenAsset(Number(winnerTokenId));
  const loserTokenAsset = getTokenAsset(Number(loserTokenId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col scrollbar-custom">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl flex items-center gap-2">
            {isUserWinner ? (
              <>
                <Trophy className="h-6 w-6 text-yellow-500" />
                <span className="text-green-600 dark:text-green-400">🎉 Você Venceu!</span>
              </>
            ) : isUserLoser ? (
              <>
                <XCircle className="h-6 w-6 text-red-500" />
                <span className="text-red-600 dark:text-red-400">Você Perdeu</span>
              </>
            ) : (
              <>
                <Trophy className="h-6 w-6 text-primary" />
                Resultado da Batalha
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Match ID: {matchId.toString()} • Status: {statusLabels[matchInfo.status] || "Desconhecido"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-200px)] pr-2 scrollbar-custom">

          {/* NFT Transfer Warning */}
          {nftTransferEnabled && (
            <Alert className="bg-amber-500/10 border-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>⚠️ NFT em Jogo</strong>
                <p className="mt-1">
                  Esta batalha envolvia transferência de NFT. {isUserLoser 
                    ? "Seu colecionável foi transferido para o vencedor." 
                    : isUserWinner 
                    ? "Você recebeu o colecionável do oponente!" 
                    : "O perdedor teve seu NFT transferido para o vencedor."}
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Winner and Loser Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Winner Card */}
            <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <div>
                    <h3 className="font-bold text-lg text-yellow-700 dark:text-yellow-400">
                      🏆 Vencedor
                    </h3>
                    {isUserWinner && (
                      <Badge className="bg-green-500 text-white mt-1">Você!</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {winnerTokenAsset?.image && (
                    <img
                      src={winnerTokenAsset.image}
                      alt={winnerTokenAsset.metadata.name}
                      className="w-full h-48 rounded-lg object-cover border-2 border-yellow-500"
                    />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Token ID</p>
                    <p className="font-bold text-lg">#{winnerTokenId.toString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Instance ID</p>
                    <p className="font-mono text-xs break-all">{winnerInstanceId.toString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs break-all">{matchInfo.winner}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(matchInfo.winner, "Endereço do vencedor")}
                      >
                        {copiedAddress === "Endereço do vencedor" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-semibold">{winnerTokenAsset?.metadata.name || "Desconhecido"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loser Card */}
            <Card className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <XCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <h3 className="font-bold text-lg text-red-700 dark:text-red-400">
                      ❌ Perdedor
                    </h3>
                    {isUserLoser && (
                      <Badge className="bg-red-500 text-white mt-1">Você</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {loserTokenAsset?.image && (
                    <img
                      src={loserTokenAsset.image}
                      alt={loserTokenAsset.metadata.name}
                      className="w-full h-48 rounded-lg object-cover border-2 border-red-500 opacity-75"
                    />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Token ID</p>
                    <p className="font-bold text-lg">#{loserTokenId.toString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Instance ID</p>
                    <p className="font-mono text-xs break-all">{loserInstanceId.toString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs break-all">{matchInfo.loser}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(matchInfo.loser, "Endereço do perdedor")}
                      >
                        {copiedAddress === "Endereço do perdedor" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-semibold">{loserTokenAsset?.metadata.name || "Desconhecido"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Battle Participants Info */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participantes da Batalha
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Player 1 */}
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Player 1</span>
                    {isUserPlayer1 && (
                      <Badge variant="outline" className="text-xs">Você</Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span className="font-mono break-all">{matchInfo.player1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => copyToClipboard(matchInfo.player1, "Player 1")}
                      >
                        {copiedAddress === "Player 1" ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Token ID: </span>
                      <span className="font-semibold">#{matchInfo.tokenId1.toString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Instance ID: </span>
                      <span className="font-mono text-xs">{matchInfo.instanceId1.toString().slice(0, 20)}...</span>
                    </div>
                  </div>
                </div>

                {/* Player 2 */}
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Player 2</span>
                    {isUserPlayer2 && (
                      <Badge variant="outline" className="text-xs">Você</Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span className="font-mono break-all">{matchInfo.player2}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => copyToClipboard(matchInfo.player2, "Player 2")}
                      >
                        {copiedAddress === "Player 2" ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Token ID: </span>
                      <span className="font-semibold">#{matchInfo.tokenId2.toString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Instance ID: </span>
                      <span className="font-mono text-xs">{matchInfo.instanceId2.toString().slice(0, 20)}...</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Winning Attribute */}
          {matchInfo.winner !== "0x0000000000000000000000000000000000000000" && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-3">
                  <WinningAttributeIcon className="h-6 w-6 text-primary" />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Atributo Vencedor</p>
                    <p className="text-xl font-bold">
                      {attributeLabels[matchInfo.winningAttribute] || "Desconhecido"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Battle Details */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tipo de Batalha</p>
                  <p className="font-semibold">
                    {matchInfo.battleType === 0 ? "Gratuita" : "Paga"}
                  </p>
                </div>
                {matchInfo.betAmount > 0n && (
                  <div>
                    <p className="text-muted-foreground">Valor da Aposta</p>
                    <p className="font-semibold">{matchInfo.betAmount.toString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Forma de Pagamento</p>
                  <p className="font-semibold">
                    {matchInfo.paymentType === 0 ? "ETH" : "USDC"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Request ID</p>
                  <p className="font-semibold font-mono text-xs">
                    {matchInfo.requestId.toString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        <div className="flex-shrink-0 flex justify-center mt-4 border-t pt-4">
          <Button onClick={() => onOpenChange(false)} size="lg" className="bg-gradient-hero text-primary-foreground hover:opacity-90">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

