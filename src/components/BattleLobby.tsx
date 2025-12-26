import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sword, Users, Clock, Trophy, Zap, Coins, Wallet, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ConnectWallet } from "@/components/ConnectWallet";
import { useUserNFTs, UserNFT } from "@/hooks/useUserNFTs";
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { Address, parseUnits, formatUnits } from "viem";
import { CHAIN_IDS, CONTRACTS } from "@/lib/contracts";
import { CHICKEN_MANAGER_FARM_ABI, PUDGY_CHICKEN_FIGHT_ABI, PUDGY_CHICKEN_ABI, ERC20_ABI } from "@/lib/abi";
import { getManagerFarmAddress, getPudgyChickenCollectionAddress, getERC20Balance, getERC20Allowance, PaymentType } from "@/lib/contracts-helpers";
import { toast } from "sonner";

// Battle Types
enum BattleType {
  FREE = 0,
  PAID = 1,
}

interface BattleLobbyProps {
  onJoinBattle: (battleId: string) => void;
  onCreateBattle: (battleId: string) => void;
}

export const BattleLobby = ({ onJoinBattle, onCreateBattle }: BattleLobbyProps) => {
  const { t } = useLanguage();
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const { switchChain } = useSwitchChain();
  const { nfts, isLoading: isLoadingNFTs, error: nftError } = useUserNFTs();

  const [selectedNFT, setSelectedNFT] = useState<UserNFT | null>(null);
  const [battleType, setBattleType] = useState<BattleType>(BattleType.FREE);
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.ETH);
  const [betAmount, setBetAmount] = useState<string>("0");

  // Se mudar para batalha paga, forçar USDC
  useEffect(() => {
    if (battleType === BattleType.PAID && paymentType === PaymentType.ETH) {
      setPaymentType(PaymentType.USDC);
    }
  }, [battleType, paymentType]);
  const [platformFeeETH, setPlatformFeeETH] = useState<bigint | null>(null);
  const [platformFeeUSDC, setPlatformFeeUSDC] = useState<bigint | null>(null);
  const [ethBalance, setEthBalance] = useState<bigint | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<bigint | null>(null);
  const [usdcAllowance, setUsdcAllowance] = useState<bigint | null>(null);
  const [nftApproved, setNftApproved] = useState<boolean | null>(null);
  const [isLoadingFees, setIsLoadingFees] = useState(false);
  const [isApprovingNFT, setIsApprovingNFT] = useState(false);
  const [isApprovingUSDC, setIsApprovingUSDC] = useState(false);
  const [isCreatingBattle, setIsCreatingBattle] = useState(false);
  const [activeMatches, setActiveMatches] = useState<any[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  
  // Rastrear qual operação está em andamento
  type OperationType = "none" | "approveNFT" | "approveUSDC" | "createBattle";
  const [currentOperation, setCurrentOperation] = useState<OperationType>("none");

  // Verificar se está na rede correta
  const isCorrectNetwork = chainId === CHAIN_IDS.baseSepolia;

  // Carregar taxas da plataforma e saldos
  useEffect(() => {
    async function loadFeesAndBalances() {
      if (!isConnected || !address || !publicClient || !chainId || !isCorrectNetwork) {
        return;
      }

      setIsLoadingFees(true);
      try {
        const fightAddress = CONTRACTS.PUDGY_CHICKEN_FIGHT.baseSepolia;
        if (!fightAddress || fightAddress === "0x") {
          return;
        }

        // Carregar taxas da plataforma
        const [feeETH, feeUSDC] = await Promise.all([
          publicClient.readContract({
            address: fightAddress,
            abi: PUDGY_CHICKEN_FIGHT_ABI,
            functionName: "getPlatformFeeETH",
          }),
          publicClient.readContract({
            address: fightAddress,
            abi: PUDGY_CHICKEN_FIGHT_ABI,
            functionName: "getPlatformFeeUSDC",
          }),
        ]);

        setPlatformFeeETH(feeETH as bigint);
        setPlatformFeeUSDC(feeUSDC as bigint);

        // Carregar saldos
        const [ethBal, usdcBal, usdcAllow] = await Promise.all([
          publicClient.getBalance({ address: address as Address }),
          (async () => {
            const usdcAddress = CONTRACTS.USDC.baseSepolia;
            if (!usdcAddress || usdcAddress === "0x") return 0n;
            return getERC20Balance(usdcAddress, address as Address, publicClient);
          })(),
          (async () => {
            const usdcAddress = CONTRACTS.USDC.baseSepolia;
            const fightAddr = CONTRACTS.PUDGY_CHICKEN_FIGHT.baseSepolia;
            if (!usdcAddress || usdcAddress === "0x" || !fightAddr || fightAddr === "0x") return 0n;
            return getERC20Allowance(usdcAddress, address as Address, fightAddr, publicClient);
          })(),
        ]);

        setEthBalance(ethBal);
        setUsdcBalance(usdcBal);
        setUsdcAllowance(usdcAllow);
      } catch (err) {
        console.error("Erro ao carregar taxas e saldos:", err);
      } finally {
        setIsLoadingFees(false);
      }
    }

    loadFeesAndBalances();
  }, [isConnected, address, publicClient, chainId, isCorrectNetwork]);

  // Verificar aprovação do NFT quando selecionar um NFT
  useEffect(() => {
    async function checkNFTApproval() {
      if (!selectedNFT || !address || !publicClient || !chainId || !isCorrectNetwork) {
        setNftApproved(null);
        return;
      }

      try {
        const collectionAddress = getPudgyChickenCollectionAddress(chainId);
        const fightAddress = CONTRACTS.PUDGY_CHICKEN_FIGHT.baseSepolia;
        
        if (!collectionAddress || !fightAddress || fightAddress === "0x") {
          setNftApproved(null);
          return;
        }

        const approved = await publicClient.readContract({
          address: collectionAddress,
          abi: PUDGY_CHICKEN_ABI,
          functionName: "isApprovedForAll",
          args: [address as Address, fightAddress],
        });

        setNftApproved(approved as boolean);
      } catch (err) {
        console.error("Erro ao verificar aprovação do NFT:", err);
        setNftApproved(null);
      }
    }

    checkNFTApproval();
  }, [selectedNFT, address, publicClient, chainId, isCorrectNetwork]);

  // Trocar para a rede correta se necessário
  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: CHAIN_IDS.baseSepolia });
    } catch (err) {
      console.error("Erro ao trocar rede:", err);
      toast.error("Erro ao trocar para Base Sepolia");
    }
  };

  // Aprovar NFT para o contrato Fight
  const handleApproveNFT = async () => {
    if (!address || !chainId || !publicClient || !selectedNFT) return;

    const collectionAddress = getPudgyChickenCollectionAddress(chainId);
    const fightAddress = CONTRACTS.PUDGY_CHICKEN_FIGHT.baseSepolia;
    
    if (!collectionAddress || !fightAddress || fightAddress === "0x") {
      toast.error("Endereços de contrato não configurados");
      return;
    }

    setIsApprovingNFT(true);
    setCurrentOperation("approveNFT");
    try {
      writeContract({
        address: collectionAddress,
        abi: PUDGY_CHICKEN_ABI,
        functionName: "setApprovalForAll",
        args: [fightAddress, true],
      });
    } catch (err) {
      console.error("Erro ao aprovar NFT:", err);
      toast.error("Erro ao aprovar NFT");
      setIsApprovingNFT(false);
      setCurrentOperation("none");
    }
  };

  // Aprovar USDC se necessário
  const handleApproveUSDC = async () => {
    if (!address || !chainId || !publicClient) return;

    const usdcAddress = CONTRACTS.USDC.baseSepolia;
    const fightAddress = CONTRACTS.PUDGY_CHICKEN_FIGHT.baseSepolia;
    if (!usdcAddress || usdcAddress === "0x" || !fightAddress || fightAddress === "0x") {
      toast.error("Endereços de contrato não configurados");
      return;
    }

    const betAmountBigInt = parseUnits(betAmount || "0", 6);
    const totalNeeded = (platformFeeUSDC || 0n) + (battleType === BattleType.PAID ? betAmountBigInt : 0n);

    setIsApprovingUSDC(true);
    setCurrentOperation("approveUSDC");
    try {
      writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [fightAddress, totalNeeded],
      });
    } catch (err) {
      console.error("Erro ao aprovar USDC:", err);
      toast.error("Erro ao aprovar USDC");
      setIsApprovingUSDC(false);
      setCurrentOperation("none");
    }
  };

  // Criar batalha
  const handleCreateBattle = async () => {
    if (!selectedNFT || !address || !chainId || !publicClient || !isCorrectNetwork) {
      toast.error("Por favor, conecte sua carteira e selecione um NFT");
      return;
    }

      // Validações
      if (!selectedNFT.isAlive) {
        toast.error("Este NFT expirou e não pode participar de batalhas");
        return;
      }

      if (battleType === BattleType.PAID && (!betAmount || betAmount === "0")) {
        toast.error("Batalha paga requer valor de aposta maior que 0");
        return;
      }

      // Verificar aprovação do NFT
      if (nftApproved === false) {
        toast.error("Por favor, aprove o NFT primeiro");
        return;
      }

    try {
      const managerAddress = getManagerFarmAddress(chainId);
      if (!managerAddress) {
        toast.error("Contrato não encontrado para esta rede");
        return;
      }

      // Obter collectionId (assumindo que é 1 para a primeira coleção)
      const collectionId = 1n;
      const tokenId = BigInt(selectedNFT.tokenId);
      const betAmountBigInt = battleType === BattleType.PAID ? parseUnits(betAmount, 6) : 0n;

      // Verificar saldo e approval se necessário
      if (paymentType === PaymentType.USDC) {
        const totalNeeded = (platformFeeUSDC || 0n) + betAmountBigInt;
        if ((usdcBalance || 0n) < totalNeeded) {
          toast.error(`Saldo USDC insuficiente. Necessário: ${formatUnits(totalNeeded, 6)} USDC`);
          return;
        }
        if ((usdcAllowance || 0n) < totalNeeded) {
          toast.error("Aprovação USDC insuficiente. Aprove primeiro.");
          return;
        }
      } else {
        // ETH payment
        const totalNeeded = (platformFeeETH || 0n) + (battleType === BattleType.PAID ? betAmountBigInt : 0n);
        if ((ethBalance || 0n) < totalNeeded) {
          toast.error(`Saldo ETH insuficiente. Necessário: ${formatUnits(totalNeeded, 18)} ETH`);
          return;
        }
      }

      // Criar batalha
      // Para batalhas pagas, sempre usar USDC (o contrato faz a conversão ETH se necessário)
      // Para batalhas gratuitas, pode usar ETH ou USDC
      const value = paymentType === PaymentType.ETH 
        ? (platformFeeETH || 0n) // Apenas taxa da plataforma para batalhas gratuitas em ETH
        : 0n; // USDC não precisa enviar ETH

      setIsCreatingBattle(true);
      setCurrentOperation("createBattle");
      writeContract({
        address: managerAddress,
        abi: CHICKEN_MANAGER_FARM_ABI,
        functionName: "createMatchById",
        args: [
          collectionId,
          address,
          tokenId,
          battleType,
          betAmountBigInt,
          paymentType,
        ],
        value,
      });
    } catch (err: any) {
      console.error("Erro ao criar batalha:", err);
      toast.error(err.message || "Erro ao criar batalha");
      setIsCreatingBattle(false);
      setCurrentOperation("none");
    }
  };

  // Buscar batalhas ativas do contrato
  const fetchActiveMatches = async () => {
    if (!publicClient || !chainId || !isCorrectNetwork) return;

    setIsLoadingMatches(true);
    try {
      const fightAddress = CONTRACTS.PUDGY_CHICKEN_FIGHT.baseSepolia;
      if (!fightAddress || fightAddress === "0x") return;

      const matches = await publicClient.readContract({
        address: fightAddress,
        abi: PUDGY_CHICKEN_FIGHT_ABI,
        functionName: "getActiveMatches",
      });

      setActiveMatches(matches as any[]);
    } catch (err) {
      console.error("Erro ao buscar batalhas:", err);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  // Carregar batalhas ao montar componente
  useEffect(() => {
    if (isConnected && isCorrectNetwork && publicClient && chainId) {
      fetchActiveMatches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, isCorrectNetwork]);

  // Monitorar confirmação da transação - separar por tipo de operação
  useEffect(() => {
    if (isConfirmed && hash && currentOperation !== "none") {
      if (currentOperation === "approveNFT") {
        setIsApprovingNFT(false);
        setCurrentOperation("none");
        // Recarregar aprovação do NFT
        if (selectedNFT && address && publicClient && chainId && isCorrectNetwork) {
          const collectionAddress = getPudgyChickenCollectionAddress(chainId);
          const fightAddress = CONTRACTS.PUDGY_CHICKEN_FIGHT.baseSepolia;
          if (collectionAddress && fightAddress && fightAddress !== "0x") {
            publicClient.readContract({
              address: collectionAddress,
              abi: PUDGY_CHICKEN_ABI,
              functionName: "isApprovedForAll",
              args: [address as Address, fightAddress],
            }).then((approved) => {
              setNftApproved(approved as boolean);
              toast.success("NFT aprovado com sucesso!");
            }).catch(() => {});
          }
        }
      } else if (currentOperation === "approveUSDC") {
        setIsApprovingUSDC(false);
        setCurrentOperation("none");
        // Recarregar allowance de USDC
        if (address && publicClient && chainId && isCorrectNetwork) {
          const usdcAddress = CONTRACTS.USDC.baseSepolia;
          const fightAddress = CONTRACTS.PUDGY_CHICKEN_FIGHT.baseSepolia;
          if (usdcAddress && usdcAddress !== "0x" && fightAddress && fightAddress !== "0x") {
            getERC20Allowance(usdcAddress, address as Address, fightAddress, publicClient)
              .then((allowance) => {
                setUsdcAllowance(allowance);
                toast.success("USDC aprovado com sucesso!");
              })
              .catch(() => {});
          }
        }
      } else if (currentOperation === "createBattle") {
        setIsCreatingBattle(false);
        setCurrentOperation("none");
        toast.success("Batalha criada com sucesso!");
        
        // Buscar batalhas atualizadas
        setTimeout(() => {
          fetchActiveMatches();
        }, 2000); // Aguardar 2s para garantir que a batalha foi indexada
        
        // Não redirecionar automaticamente - deixar usuário ver as batalhas
      }
    }
  }, [isConfirmed, hash, currentOperation, selectedNFT, address, publicClient, chainId, isCorrectNetwork]);

  // Monitorar erros
  useEffect(() => {
    if (error) {
      const errorMessage = error.message || "Erro desconhecido";
      if (errorMessage.includes("Insufficient")) {
        toast.error("Saldo insuficiente");
      } else if (errorMessage.includes("allowance") || errorMessage.includes("approval")) {
        toast.error("Aprovação insuficiente. Aprove o contrato primeiro.");
      } else {
        toast.error(errorMessage);
      }
    }
  }, [error]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "bg-gray-500";
      case "rare": return "bg-blue-500";
      case "epic": return "bg-purple-500";
      case "legendary": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const NFTCard = ({ nft, isSelected, onSelect }: { 
    nft: UserNFT; 
    isSelected: boolean; 
    onSelect: () => void;
  }) => (
    <Card 
      className={`cursor-pointer transition-all duration-300 ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
      } ${!nft.isAlive ? 'opacity-50' : ''}`}
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
          {!nft.isAlive && (
            <Badge className="absolute top-2 right-2 bg-red-500 text-white text-xs">
              Expirado
            </Badge>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-bold text-sm">{nft.name}</h3>
          <p className="text-xs text-muted-foreground">{nft.collection}</p>
        </div>
      </CardContent>
    </Card>
  );

  // Se não estiver conectado, mostrar botão de conexão
  if (!isConnected) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              {t('battle.select')}
            </span>
          </h2>
          
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-bold">Conecte sua carteira</h3>
              <p className="text-muted-foreground mb-4">
                Conecte sua carteira para ver seus NFTs e criar batalhas
              </p>
              <ConnectWallet size="lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Se não estiver na rede correta
  if (!isCorrectNetwork) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              {t('battle.select')}
            </span>
          </h2>
          
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <Alert>
                <AlertDescription>
                  Por favor, troque para a rede Base Sepolia para participar de batalhas
                </AlertDescription>
              </Alert>
              <Button onClick={handleSwitchNetwork} size="lg">
                Trocar para Base Sepolia
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Seleção de NFT */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center">
          <span className="bg-gradient-hero bg-clip-text text-transparent">
            {t('battle.select')}
          </span>
        </h2>
        
        {isLoadingNFTs ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando seus NFTs...</p>
            </CardContent>
          </Card>
        ) : nftError ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Alert variant="destructive">
                <AlertDescription>{nftError}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : nfts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold mb-2">Nenhum NFT encontrado</h3>
              <p className="text-muted-foreground">
                Você não possui nenhum Pudgy Chicken NFT. Adquira um na loja primeiro!
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {nfts.map((nft) => (
                <NFTCard
                  key={nft.id}
                  nft={nft}
                  isSelected={selectedNFT?.id === nft.id}
                  onSelect={() => setSelectedNFT(nft)}
                />
              ))}
            </div>

            {selectedNFT && (
              <Card>
                <CardContent className="p-6 space-y-6">
                  {/* Tipo de Batalha */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Tipo de Batalha</Label>
                    <RadioGroup
                      value={battleType.toString()}
                      onValueChange={(value) => setBattleType(Number(value) as BattleType)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={BattleType.FREE.toString()} id="free" />
                        <Label htmlFor="free" className="cursor-pointer">
                          Gratuita (Apenas taxa de $2 USD)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={BattleType.PAID.toString()} id="paid" />
                        <Label htmlFor="paid" className="cursor-pointer">
                          Paga (Taxa + Aposta)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Valor da Aposta (se PAID) */}
                  {battleType === BattleType.PAID && (
                    <div className="space-y-2">
                      <Label htmlFor="betAmount">Valor da Aposta (USDC)</Label>
                      <Input
                        id="betAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-background text-foreground"
                      />
                      <p className="text-xs text-muted-foreground">
                        O vencedor receberá o dobro da aposta (2x)
                      </p>
                    </div>
                  )}

                  {/* Tipo de Pagamento */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Forma de Pagamento</Label>
                    <RadioGroup
                      value={paymentType.toString()}
                      onValueChange={(value) => setPaymentType(Number(value) as PaymentType)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value={PaymentType.ETH.toString()} 
                          id="eth"
                          disabled={battleType === BattleType.PAID}
                        />
                        <Label htmlFor="eth" className={`cursor-pointer ${battleType === BattleType.PAID ? 'opacity-50' : ''}`}>
                          ETH {battleType === BattleType.PAID && '(Apenas para batalhas gratuitas)'}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={PaymentType.USDC.toString()} id="usdc" />
                        <Label htmlFor="usdc" className="cursor-pointer">
                          USDC
                        </Label>
                      </div>
                    </RadioGroup>
                    {battleType === BattleType.PAID && paymentType === PaymentType.ETH && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        Batalhas pagas devem ser feitas em USDC. Alterando para USDC...
                      </p>
                    )}
                  </div>

                  {/* Informações de Pagamento */}
                  {isLoadingFees ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando informações...
                    </div>
                  ) : (
                    <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Taxa da Plataforma:</span>
                        <span className="font-semibold">
                          {paymentType === PaymentType.ETH
                            ? platformFeeETH
                              ? `${formatUnits(platformFeeETH, 18)} ETH (~$2 USD)`
                              : "-"
                            : platformFeeUSDC
                            ? `${formatUnits(platformFeeUSDC, 6)} USDC ($2 USD)`
                            : "-"}
                        </span>
                      </div>
                      {battleType === BattleType.PAID && (
                        <div className="flex justify-between">
                          <span>Aposta:</span>
                          <span className="font-semibold">
                            {betAmount ? `${betAmount} USDC` : "0 USDC"}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>Total:</span>
                        <span>
                          {paymentType === PaymentType.ETH
                            ? platformFeeETH
                              ? `${formatUnits(platformFeeETH, 18)} ETH (~$2 USD)`
                              : "-"
                            : platformFeeUSDC
                            ? `${formatUnits((platformFeeUSDC || 0n) + (battleType === BattleType.PAID ? parseUnits(betAmount || "0", 6) : 0n), 6)} USDC`
                            : "-"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Aprovar NFT se necessário */}
                  {nftApproved === false && (
                    <Alert>
                      <AlertDescription className="flex items-center justify-between">
                        <span>É necessário aprovar o NFT para participar de batalhas</span>
                        <Button
                          onClick={handleApproveNFT}
                          variant="outline"
                          size="sm"
                          disabled={isPending || isApprovingNFT}
                          className="ml-4"
                        >
                          {isPending || isApprovingNFT ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Aprovando...
                            </>
                          ) : (
                            "Aprovar NFT"
                          )}
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Status de aprovação do NFT */}
                  {nftApproved === true && (
                    <Alert className="bg-green-500/10 border-green-500/20">
                      <AlertDescription className="text-green-600 dark:text-green-400">
                        ✓ NFT aprovado e pronto para batalhas
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Aprovar USDC se necessário */}
                  {paymentType === PaymentType.USDC && usdcAllowance !== null && (
                    (() => {
                      const totalNeeded = (platformFeeUSDC || 0n) + (battleType === BattleType.PAID ? parseUnits(betAmount || "0", 6) : 0n);
                      if (usdcAllowance < totalNeeded) {
                        return (
                          <Button
                            onClick={handleApproveUSDC}
                            variant="outline"
                            className="w-full"
                            disabled={isPending || isApprovingNFT || isApprovingUSDC}
                          >
                            {isPending || isApprovingUSDC ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Aprovando USDC...
                              </>
                            ) : (
                              "Aprovar USDC"
                            )}
                          </Button>
                        );
                      }
                      return null;
                    })()
                  )}

                  {/* Botão Criar Batalha */}
                  <Button
                    onClick={handleCreateBattle}
                    size="lg"
                    className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90"
                    disabled={
                      isPending || 
                      isConfirming || 
                      isApprovingNFT || 
                      isApprovingUSDC ||
                      isCreatingBattle ||
                      !selectedNFT?.isAlive || 
                      nftApproved === false || 
                      (battleType === BattleType.PAID && (!betAmount || betAmount === "0")) ||
                      (paymentType === PaymentType.USDC && usdcAllowance !== null && (() => {
                        const totalNeeded = (platformFeeUSDC || 0n) + (battleType === BattleType.PAID ? parseUnits(betAmount || "0", 6) : 0n);
                        return usdcAllowance < totalNeeded;
                      })())
                    }
                  >
                    {isPending || isConfirming || isCreatingBattle ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {isPending ? "Aguardando confirmação..." : "Criando batalha..."}
                      </>
                    ) : (
                      <>
                        <Sword className="mr-2 h-5 w-5" />
                        {t('battle.create')}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Batalhas Ativas do Contrato */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Batalhas Ativas
            </span>
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchActiveMatches}
            disabled={isLoadingMatches}
          >
            {isLoadingMatches ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              "Atualizar"
            )}
          </Button>
        </div>

        {isLoadingMatches ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando batalhas...</p>
            </CardContent>
          </Card>
        ) : activeMatches.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold mb-2">Nenhuma batalha ativa</h3>
              <p className="text-muted-foreground">
                Seja o primeiro a criar uma batalha!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {activeMatches.map((match: any) => {
              const matchId = match.matchId.toString();
              const isMyBattle = match.player1.toLowerCase() === address?.toLowerCase();
              const battleTypeText = match.battleType === 0 ? "Gratuita" : "Paga";
              const paymentTypeText = match.paymentType === 0 ? "ETH" : "USDC";
              const betAmountFormatted = match.betAmount ? formatUnits(match.betAmount, 6) : "0";

              return (
                <Card key={matchId} className={isMyBattle ? 'ring-2 ring-primary bg-primary/5' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">Batalha #{matchId}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={match.battleType === 0 ? "bg-green-500" : "bg-yellow-500"}>
                            {battleTypeText}
                          </Badge>
                          <Badge variant="outline">
                            {paymentTypeText}
                          </Badge>
                          {isMyBattle && (
                            <Badge className="bg-primary text-primary-foreground">
                              Minha Batalha
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Jogador 1:</span>
                        <span className="font-mono text-xs">
                          {match.player1.slice(0, 6)}...{match.player1.slice(-4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Token ID:</span>
                        <span className="font-semibold">#{match.tokenId1.toString()}</span>
                      </div>
                      {match.battleType === 1 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Aposta:</span>
                          <span className="font-semibold">{betAmountFormatted} USDC</span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => {
                        // Aqui você pode implementar joinMatchById
                        toast.info("Funcionalidade de entrar em batalha em desenvolvimento");
                      }}
                      className="w-full mt-4 bg-gradient-hero text-primary-foreground hover:opacity-90"
                      disabled={isMyBattle}
                    >
                      <Sword className="mr-2 h-4 w-4" />
                      {isMyBattle ? "Sua Batalha" : "Entrar na Batalha"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
