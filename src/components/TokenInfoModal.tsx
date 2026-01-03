import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Zap,
  Heart,
  Wind,
  Volume2,
  Shield,
  Users,
  Clock,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAccount, usePublicClient } from "wagmi";
import { Address, formatUnits } from "viem";
import { PUDGY_CHICKEN_ABI } from "@/lib/abi";
import { getPudgyChickenCollectionAddress } from "@/lib/contracts-helpers";
import { CONTRACTS } from "@/lib/contracts";
import { getTokenAsset } from "@/lib/token-assets";
import { toast } from "sonner";

interface InstanceSkills {
  power: bigint;
  speed: bigint;
  health: bigint;
  clucking: bigint;
  broodPower: bigint;
}

interface InstanceInfo {
  tokenId: bigint;
  instanceId: bigint;
  instanceIndex: bigint;
  instanceSkills: InstanceSkills;
  battleWins: bigint;
  isIncubating: boolean;
}

interface TokenUserInfo {
  tokenId: bigint;
  balance: bigint;
  instances: InstanceInfo[];
  battleWins: bigint;
  isIncubating: boolean;
  isAlive: boolean;
  remainingLifespan: bigint;
}

interface TokenInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAddress?: string;
  defaultTokenId?: number;
}

export const TokenInfoModal: React.FC<TokenInfoModalProps> = ({
  open,
  onOpenChange,
  defaultAddress,
  defaultTokenId,
}) => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [searchAddress, setSearchAddress] = useState<string>(defaultAddress || address || "");
  const [selectedTokenId, setSelectedTokenId] = useState<number>(defaultTokenId || 1);
  const [tokenInfo, setTokenInfo] = useState<TokenUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultAddress) {
      setSearchAddress(defaultAddress);
    }
    if (defaultTokenId) {
      setSelectedTokenId(defaultTokenId);
    }
  }, [defaultAddress, defaultTokenId]);

  useEffect(() => {
    if (open && searchAddress && selectedTokenId && publicClient) {
      fetchTokenInfo();
    }
  }, [open, searchAddress, selectedTokenId, publicClient]);

  const fetchTokenInfo = async () => {
    if (!searchAddress || !publicClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const collectionAddress = getPudgyChickenCollectionAddress(84532); // Base Sepolia
      if (!collectionAddress) {
        throw new Error("Contrato não encontrado");
      }

      const info = await publicClient.readContract({
        address: collectionAddress,
        abi: PUDGY_CHICKEN_ABI,
        functionName: "getUserTokenCompleteInfo",
        args: [searchAddress as Address, BigInt(selectedTokenId)],
      }) as TokenUserInfo;

      setTokenInfo(info);
    } catch (err: any) {
      console.error("Erro ao buscar informações do token:", err);
      setError(err.message || "Erro ao buscar informações");
      toast.error("Erro ao buscar informações do token");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchAddress) {
      toast.error("Por favor, insira um endereço");
      return;
    }
    fetchTokenInfo();
  };

  const formatLifespan = (seconds: bigint) => {
    const days = Number(seconds) / 86400;
    const hours = (Number(seconds) % 86400) / 3600;
    if (days >= 1) {
      return `${Math.floor(days)}d ${Math.floor(hours)}h`;
    }
    return `${Math.floor(hours)}h`;
  };

  const tokenAsset = selectedTokenId ? getTokenAsset(selectedTokenId) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Informações Completas do Colecionável
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações sobre seus colecionáveis ou de outros usuários
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Section */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="address">Endereço da Carteira</Label>
                  <Input
                    id="address"
                    placeholder="0x..."
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                  />
                </div>
                <div className="w-32 space-y-2">
                  <Label htmlFor="tokenId">Token ID</Label>
                  <Input
                    id="tokenId"
                    type="number"
                    min="1"
                    max="10"
                    value={selectedTokenId}
                    onChange={(e) => setSelectedTokenId(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando informações...</p>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Token Info */}
          {tokenInfo && !isLoading && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="instances">
                  Instâncias ({tokenInfo.instances.length})
                </TabsTrigger>
                <TabsTrigger value="battles">Batalhas</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      {tokenAsset?.image && (
                        <img
                          src={tokenAsset.image}
                          alt={tokenAsset.metadata.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <CardTitle>
                          {tokenAsset?.metadata.name || `Token #${tokenInfo.tokenId.toString()}`}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Token ID: {tokenInfo.tokenId.toString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Balance</p>
                        <p className="text-2xl font-bold">{tokenInfo.balance.toString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Vitórias Totais</p>
                        <p className="text-2xl font-bold flex items-center gap-1">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                          {tokenInfo.battleWins.toString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge
                          className={tokenInfo.isAlive ? "bg-green-500" : "bg-red-500"}
                        >
                          {tokenInfo.isAlive ? "Vivo" : "Expirado"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Incubação</p>
                        <Badge
                          variant={tokenInfo.isIncubating ? "default" : "outline"}
                        >
                          {tokenInfo.isIncubating ? "Sim" : "Não"}
                        </Badge>
                      </div>
                    </div>

                    {tokenInfo.isAlive && (
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm font-semibold">Tempo de Vida Restante</p>
                              <p className="text-lg">{formatLifespan(tokenInfo.remainingLifespan)}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Instances Tab */}
              <TabsContent value="instances" className="space-y-4">
                {tokenInfo.instances.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">Nenhuma instância encontrada</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {tokenInfo.instances.map((instance, index) => {
                      const totalStats =
                        Number(instance.instanceSkills.power) +
                        Number(instance.instanceSkills.speed) +
                        Number(instance.instanceSkills.health) +
                        Number(instance.instanceSkills.clucking) +
                        Number(instance.instanceSkills.broodPower);

                      return (
                        <Card key={index}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">
                                Instância #{instance.instanceIndex.toString()}
                              </CardTitle>
                              <Badge variant="outline">
                                Instance ID: {instance.instanceId.toString()}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              {[
                                { name: "Power", value: instance.instanceSkills.power, icon: Zap, color: "text-yellow-500" },
                                { name: "Speed", value: instance.instanceSkills.speed, icon: Wind, color: "text-blue-500" },
                                { name: "Health", value: instance.instanceSkills.health, icon: Heart, color: "text-red-500" },
                                { name: "Clucking", value: instance.instanceSkills.clucking, icon: Volume2, color: "text-purple-500" },
                                { name: "Brood Power", value: instance.instanceSkills.broodPower, icon: Shield, color: "text-green-500" },
                              ].map((skill) => {
                                const Icon = skill.icon;
                                const value = Number(skill.value);
                                return (
                                  <div key={skill.name} className="text-center">
                                    <Icon className={`h-5 w-5 ${skill.color} mx-auto mb-1`} />
                                    <p className="text-xs text-muted-foreground">{skill.name}</p>
                                    <p className="text-xl font-bold">{value}</p>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                              <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm">
                                  Vitórias: <strong>{instance.battleWins.toString()}</strong>
                                </span>
                              </div>
                              <Badge variant={instance.isIncubating ? "default" : "outline"}>
                                {instance.isIncubating ? "Incubando" : "Disponível"}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Battles Tab */}
              <TabsContent value="battles" className="space-y-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                    <h3 className="text-xl font-bold mb-2">
                      Total de Vitórias: {tokenInfo.battleWins.toString()}
                    </h3>
                    <p className="text-muted-foreground">
                      Este token venceu {tokenInfo.battleWins.toString()} batalha(s)
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

