import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sword, Users, Clock, Trophy, Zap, Coins, Wallet, Loader2, AlertTriangle, Shield, Info, CheckCircle, XCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { ConnectWallet } from "@/components/ConnectWallet";
import { useUserNFTs, UserNFT } from "@/hooks/useUserNFTs";
import { TokenInfoModal } from "./TokenInfoModal";
import { BattleResultModal } from "./BattleResultModal";
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { Address, parseUnits, formatUnits, encodeFunctionData } from "viem";
import { CHAIN_IDS, CONTRACTS } from "@/lib/contracts";
import { CHICKEN_MANAGER_FARM_ABI, PUDGY_CHICKEN_FIGHT_ABI, PUDGY_CHICKEN_ABI, ERC20_ABI } from "@/lib/abi";
import { getManagerFarmAddress, getPudgyChickenCollectionAddress, getTokenBalance, isTokenAlive, getERC20Balance, getERC20Allowance, PaymentType } from "@/lib/contracts-helpers";
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
  const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isTransactionError, error: transactionError } = useWaitForTransactionReceipt({ hash });
  const { switchChain } = useSwitchChain();
  const { nfts, isLoading: isLoadingNFTs, error: nftError } = useUserNFTs();

  const [selectedNFT, setSelectedNFT] = useState<UserNFT | null>(null);
  const [tokenInstances, setTokenInstances] = useState<any[]>([]);
  const [selectedInstanceIndex, setSelectedInstanceIndex] = useState<bigint | null>(null);
  const [isLoadingInstances, setIsLoadingInstances] = useState(false);

  // Verificar se está na rede correta (definir antes de usar nos useEffect)
  const isCorrectNetwork = chainId === CHAIN_IDS.baseSepolia;

  // Selecionar automaticamente o primeiro NFT válido quando os NFTs carregarem
  useEffect(() => {
    if (nfts.length > 0 && !selectedNFT) {
      // Priorizar NFTs vivos
      const aliveNFT = nfts.find(nft => nft.isAlive);
      if (aliveNFT) {
        setSelectedNFT(aliveNFT);
      } else if (nfts.length > 0) {
        // Se não houver NFTs vivos, selecionar o primeiro mesmo assim
        setSelectedNFT(nfts[0]);
      }
    }
  }, [nfts, selectedNFT]);

  // Buscar instâncias do token selecionado
  useEffect(() => {
    async function fetchTokenInstances() {
      if (!selectedNFT || !address || !publicClient || !chainId || !isCorrectNetwork) {
        setTokenInstances([]);
        setSelectedInstanceIndex(null);
        return;
      }

      setIsLoadingInstances(true);
      try {
        const collectionAddress = getPudgyChickenCollectionAddress(chainId);
        if (!collectionAddress) {
          console.warn("Collection address não encontrado para chainId:", chainId);
          setTokenInstances([]);
          setSelectedInstanceIndex(null);
          return;
        }

        console.log("Buscando instâncias para tokenId:", selectedNFT.tokenId, "address:", address);
        
        const tokenInfo = await publicClient.readContract({
          address: collectionAddress,
          abi: PUDGY_CHICKEN_ABI,
          functionName: "getUserTokenCompleteInfo",
          args: [address as Address, BigInt(selectedNFT.tokenId)],
        }) as any;

        console.log("Token info recebido:", tokenInfo);

        if (tokenInfo && tokenInfo.instances && Array.isArray(tokenInfo.instances)) {
          // Filtrar apenas instâncias não incubando
          const availableInstances = tokenInfo.instances.filter((inst: any) => {
            return !inst.isIncubating;
          });
          
          console.log("Instâncias disponíveis:", availableInstances);
          
          setTokenInstances(availableInstances);
          
          // Selecionar automaticamente a primeira instância disponível
          if (availableInstances.length > 0) {
            const firstInstanceIndex = availableInstances[0].instanceIndex;
            console.log("Selecionando primeira instância:", firstInstanceIndex.toString());
            setSelectedInstanceIndex(firstInstanceIndex);
          } else {
            console.warn("Nenhuma instância disponível para o token");
            setSelectedInstanceIndex(null);
          }
        } else {
          console.warn("Token info inválido ou sem instâncias:", tokenInfo);
          setTokenInstances([]);
          setSelectedInstanceIndex(null);
        }
      } catch (err) {
        console.error("Erro ao buscar instâncias do token:", err);
        toast.error("Erro ao carregar instâncias do token. Tente novamente.");
        setTokenInstances([]);
        setSelectedInstanceIndex(null);
      } finally {
        setIsLoadingInstances(false);
      }
    }

    fetchTokenInstances();
  }, [selectedNFT, address, publicClient, chainId, isCorrectNetwork]);
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
  const [finishedMatches, setFinishedMatches] = useState<any[]>([]);
  const [isLoadingFinishedMatches, setIsLoadingFinishedMatches] = useState(false);
  const [showFinishedMatches, setShowFinishedMatches] = useState(false);
  const [matchInstanceIndexes, setMatchInstanceIndexes] = useState<Map<string, number>>(new Map());
  const [showTokenInfoModal, setShowTokenInfoModal] = useState(false);
  const [showBattleResultModal, setShowBattleResultModal] = useState(false);
  const [battleResultMatchId, setBattleResultMatchId] = useState<bigint | null>(null);
  const [monitoredMatches, setMonitoredMatches] = useState<Set<string>>(new Set());
  
  // Rastrear qual operação está em andamento
  type OperationType = "none" | "approveNFT" | "approveUSDC" | "createBattle" | "joinBattle";
  const [currentOperation, setCurrentOperation] = useState<OperationType>("none");
  
  // Estados para join battle
  const [selectedMatchToJoin, setSelectedMatchToJoin] = useState<any | null>(null);
  const [selectedNFTForJoin, setSelectedNFTForJoin] = useState<UserNFT | null>(null);
  const [tokenInstancesForJoin, setTokenInstancesForJoin] = useState<any[]>([]);
  const [selectedInstanceIndexForJoin, setSelectedInstanceIndexForJoin] = useState<bigint | null>(null);
  const [isLoadingInstancesForJoin, setIsLoadingInstancesForJoin] = useState(false);
  const [isJoinBattleModalOpen, setIsJoinBattleModalOpen] = useState(false);
  const [isJoiningBattle, setIsJoiningBattle] = useState(false);
  const [nftApprovedForJoin, setNftApprovedForJoin] = useState<boolean | null>(null);
  const [skillsComparison, setSkillsComparison] = useState<{
    isBalanced: boolean;
    riskLevel: string;
    player1PowerLevel: number;
    player2PowerLevel: number;
    differencePercent: number;
    threshold: number;
    isTie: boolean;
    player1Skills: any;
    player2Skills: any;
  } | null>(null);
  const [isLoadingSkillsComparison, setIsLoadingSkillsComparison] = useState(false);
  const [isApprovingNFTForJoin, setIsApprovingNFTForJoin] = useState(false);
  const [isCreateBattleModalOpen, setIsCreateBattleModalOpen] = useState(false);
  const [nftTransferEnabled, setNftTransferEnabled] = useState<boolean | null>(null);

  // Buscar instâncias do token selecionado para join battle e filtrar apenas as justas
  useEffect(() => {
    async function fetchTokenInstancesForJoin() {
      if (!selectedNFTForJoin || !selectedMatchToJoin || !address || !publicClient || !chainId || !isCorrectNetwork) {
        setTokenInstancesForJoin([]);
        setSelectedInstanceIndexForJoin(null);
        return;
      }

      setIsLoadingInstancesForJoin(true);
      try {
        const collectionAddress = getPudgyChickenCollectionAddress(chainId);
        const fightAddress = CONTRACTS.PUDGY_CHICKEN_FIGHT.baseSepolia;
        
        if (!collectionAddress || !fightAddress || fightAddress === "0x") {
          setTokenInstancesForJoin([]);
          setSelectedInstanceIndexForJoin(null);
          return;
        }

        // Buscar informações do match para obter skills do oponente
        const matchId = BigInt(selectedMatchToJoin.matchId);
        const matchInfo = await publicClient.readContract({
          address: fightAddress,
          abi: PUDGY_CHICKEN_FIGHT_ABI,
          functionName: "matches",
          args: [matchId],
        }) as any;

        console.log("Match info recebido:", matchInfo);
        console.log("Match info keys:", matchInfo ? Object.keys(matchInfo) : "matchInfo is null");

        // Validar matchInfo - pode ser um array ou objeto
        let player1: any, tokenId1: any, instanceId1: any;
        
        // Se for array (retorno direto da função)
        if (Array.isArray(matchInfo)) {
          player1 = matchInfo[0];
          tokenId1 = matchInfo[2];
          instanceId1 = matchInfo[3];
        } else if (matchInfo && typeof matchInfo === 'object') {
          // Se for objeto
          player1 = matchInfo.player1;
          tokenId1 = matchInfo.tokenId1;
          instanceId1 = matchInfo.instanceId1;
        }

        // Validar matchInfo
        if (!matchInfo || !player1 || tokenId1 === undefined || instanceId1 === undefined) {
          console.warn("Informações do match incompletas, mostrando todas as instâncias", {
            matchInfo,
            player1,
            tokenId1,
            instanceId1
          });
          // Fallback: mostrar todas as instâncias
          const tokenInfo = await publicClient.readContract({
            address: collectionAddress,
            abi: PUDGY_CHICKEN_ABI,
            functionName: "getUserTokenCompleteInfo",
            args: [address as Address, BigInt(selectedNFTForJoin.tokenId)],
          }) as any;

          if (tokenInfo && tokenInfo.instances && Array.isArray(tokenInfo.instances)) {
            const availableInstances = tokenInfo.instances.filter((inst: any) => !inst.isIncubating);
            setTokenInstancesForJoin(availableInstances);
            if (availableInstances.length > 0) {
              setSelectedInstanceIndexForJoin(availableInstances[0].instanceIndex);
            }
          }
          return;
        }

        // Buscar threshold do contrato em tempo real
        const maxDifferencePercent = await publicClient.readContract({
          address: fightAddress,
          abi: PUDGY_CHICKEN_FIGHT_ABI,
          functionName: "maxPowerLevelDifferencePercent",
        }) as bigint;

        const threshold = Number(maxDifferencePercent);
        
        console.log("Threshold do contrato (on-chain):", threshold);
        
        if (isNaN(threshold)) {
          console.error("❌ Erro ao buscar threshold do contrato: valor inválido");
          throw new Error("Não foi possível buscar o threshold do contrato");
        }
        
        if (threshold === 0) {
          console.warn("⚠️ Threshold ainda não foi configurado pelo owner do contrato");
          toast.warning(
            "O threshold de diferença de Power Level ainda não foi configurado pelo owner do contrato. Por favor, aguarde a configuração antes de participar de batalhas.",
            { duration: 10000 }
          );
          setTokenInstancesForJoin([]);
          setSelectedInstanceIndexForJoin(null);
          return;
        }

        // Validar endereço do player1 antes de usar
        const player1Address = player1;
        if (!player1Address || typeof player1Address !== 'string' || player1Address === '0x' || player1Address.length !== 42) {
          console.warn("Endereço do player1 inválido:", player1Address);
          // Fallback: mostrar todas as instâncias
          const tokenInfo = await publicClient.readContract({
            address: collectionAddress,
            abi: PUDGY_CHICKEN_ABI,
            functionName: "getUserTokenCompleteInfo",
            args: [address as Address, BigInt(selectedNFTForJoin.tokenId)],
          }) as any;

          if (tokenInfo && tokenInfo.instances && Array.isArray(tokenInfo.instances)) {
            const availableInstances = tokenInfo.instances.filter((inst: any) => !inst.isIncubating);
            setTokenInstancesForJoin(availableInstances);
            if (availableInstances.length > 0) {
              setSelectedInstanceIndexForJoin(availableInstances[0].instanceIndex);
            }
          }
          return;
        }

        // Validar tokenId1 antes de usar
        const player1TokenId = tokenId1;
        if (player1TokenId === undefined || player1TokenId === null) {
          console.warn("tokenId1 do match não encontrado, mostrando todas as instâncias", {
            matchInfo,
            tokenId1,
            player1TokenId
          });
          // Fallback: mostrar todas as instâncias
          const tokenInfo = await publicClient.readContract({
            address: collectionAddress,
            abi: PUDGY_CHICKEN_ABI,
            functionName: "getUserTokenCompleteInfo",
            args: [address as Address, BigInt(selectedNFTForJoin.tokenId)],
          }) as any;

          if (tokenInfo && tokenInfo.instances && Array.isArray(tokenInfo.instances)) {
            const availableInstances = tokenInfo.instances.filter((inst: any) => !inst.isIncubating);
            setTokenInstancesForJoin(availableInstances);
            if (availableInstances.length > 0) {
              setSelectedInstanceIndexForJoin(availableInstances[0].instanceIndex);
            }
          }
          return;
        }

        // Validar instanceId1 antes de usar
        const player1InstanceId = instanceId1;
        if (player1InstanceId === undefined || player1InstanceId === null) {
          console.warn("instanceId1 do match não encontrado, mostrando todas as instâncias", {
            matchInfo,
            instanceId1,
            player1InstanceId
          });
          // Fallback: mostrar todas as instâncias
          const tokenInfo = await publicClient.readContract({
            address: collectionAddress,
            abi: PUDGY_CHICKEN_ABI,
            functionName: "getUserTokenCompleteInfo",
            args: [address as Address, BigInt(selectedNFTForJoin.tokenId)],
          }) as any;

          if (tokenInfo && tokenInfo.instances && Array.isArray(tokenInfo.instances)) {
            const availableInstances = tokenInfo.instances.filter((inst: any) => !inst.isIncubating);
            setTokenInstancesForJoin(availableInstances);
            if (availableInstances.length > 0) {
              setSelectedInstanceIndexForJoin(availableInstances[0].instanceIndex);
            }
          }
          return;
        }

        // Buscar skills do oponente usando getInstanceIdByIndex + getInstanceSkills diretamente
        // Este é o método mais confiável, pois funciona independente de onde o NFT está
        console.log("Buscando skills do oponente usando getInstanceIdByIndex:", {
          player1TokenId: player1TokenId.toString(),
          player1InstanceId: player1InstanceId.toString()
        });

        let opponentPowerLevel = 0;
        let foundInstanceIndex: number | null = null;

        try {
          // Iterar pelos instanceIndex possíveis do tokenId1 para encontrar o que corresponde ao instanceId1
          // Tentar buscar até 100 instâncias (limite razoável)
          for (let i = 0; i < 100; i++) {
            try {
              const instanceIdFromIndex = await publicClient.readContract({
                address: collectionAddress,
                abi: PUDGY_CHICKEN_ABI,
                functionName: "getInstanceIdByIndex",
                args: [BigInt(player1TokenId.toString()), BigInt(i)],
              }) as bigint;

              if (instanceIdFromIndex.toString() === player1InstanceId.toString()) {
                foundInstanceIndex = i;
                console.log(`✅ Encontrado! InstanceIndex ${i} corresponde ao InstanceId ${player1InstanceId.toString()} para tokenId ${player1TokenId.toString()}`);
                break;
              }
            } catch (err: any) {
              // Se der erro, pode ser que não exista mais instâncias
              const errorMsg = err?.message || String(err);
              if (errorMsg.includes("revert") || errorMsg.includes("execution reverted")) {
                // Erro de contrato - provavelmente não existe mais instâncias
                console.log(`InstanceIndex ${i} não existe (revert) para tokenId ${player1TokenId.toString()}`);
                break;
              } else {
                // Outro tipo de erro - continuar tentando
                console.log(`Erro ao buscar InstanceIndex ${i} para tokenId ${player1TokenId.toString()}:`, errorMsg);
              }
            }
          }

          // Se encontramos o instanceIndex, buscar as skills usando getInstanceSkills diretamente
          if (foundInstanceIndex !== null) {
            try {
              const opponentSkills = await publicClient.readContract({
                address: collectionAddress,
                abi: PUDGY_CHICKEN_ABI,
                functionName: "getInstanceSkills",
                args: [BigInt(player1TokenId.toString()), BigInt(foundInstanceIndex)],
              }) as any;

              opponentPowerLevel = calculatePowerLevel(opponentSkills);
              console.log("✅ Skills do oponente encontradas via getInstanceSkills:", {
                tokenId: player1TokenId.toString(),
                instanceIndex: foundInstanceIndex,
                instanceId: player1InstanceId.toString(),
                skills: opponentSkills,
                powerLevel: opponentPowerLevel,
                power: opponentSkills.power?.toString(),
                speed: opponentSkills.speed?.toString(),
                health: opponentSkills.health?.toString(),
                clucking: opponentSkills.clucking?.toString()
              });
            } catch (err) {
              console.error("Erro ao buscar skills via getInstanceSkills:", err);
            }
          } else {
            console.warn("❌ Não foi possível encontrar instanceIndex correspondente ao instanceId:", {
              tokenId: player1TokenId.toString(),
              instanceId: player1InstanceId.toString()
            });
          }
        } catch (err) {
          console.error("Erro ao buscar skills do oponente:", err);
        }

        // Se ainda não encontrou, usar fallback
        if (opponentPowerLevel === 0) {
          console.warn("Não foi possível encontrar skills do oponente, mostrando todas as instâncias");
          // Fallback: mostrar todas as instâncias
          const tokenInfo = await publicClient.readContract({
            address: collectionAddress,
            abi: PUDGY_CHICKEN_ABI,
            functionName: "getUserTokenCompleteInfo",
            args: [address as Address, BigInt(selectedNFTForJoin.tokenId)],
          }) as any;

          if (tokenInfo && tokenInfo.instances && Array.isArray(tokenInfo.instances)) {
            const availableInstances = tokenInfo.instances.filter((inst: any) => !inst.isIncubating);
            setTokenInstancesForJoin(availableInstances);
            if (availableInstances.length > 0) {
              setSelectedInstanceIndexForJoin(availableInstances[0].instanceIndex);
            }
          }
          return;
        }

        // Buscar instâncias do usuário
        const userTokenInfo = await publicClient.readContract({
          address: collectionAddress,
          abi: PUDGY_CHICKEN_ABI,
          functionName: "getUserTokenCompleteInfo",
          args: [address as Address, BigInt(selectedNFTForJoin.tokenId)],
        }) as any;

        if (userTokenInfo && userTokenInfo.instances && Array.isArray(userTokenInfo.instances)) {
          console.log("📊 Comparando instâncias do usuário com oponente:", {
            opponentPowerLevel,
            threshold,
            userInstancesCount: userTokenInfo.instances.length
          });
          
          // Filtrar apenas instâncias não incubando - mostrar TODAS, não apenas as "justas"
          // A filtragem de "justas" será feita apenas para bloquear o botão, não para esconder instâncias
          const availableInstances = userTokenInfo.instances.filter((inst: any) => {
            if (inst.isIncubating) {
              console.log(`InstanceIndex ${inst.instanceIndex.toString()} está incubando, ignorando`);
              return false;
            }
            
            const userPowerLevel = calculatePowerLevel(inst.instanceSkills);
            const isFair = checkFairness(opponentPowerLevel, userPowerLevel, threshold);
            
            // Calcular diferença para log
            const maxLevel = Math.max(opponentPowerLevel, userPowerLevel);
            const minLevel = Math.min(opponentPowerLevel, userPowerLevel);
            const differencePercent = minLevel > 0 
              ? ((maxLevel - minLevel) * 100) / minLevel 
              : 0;
            
            // Verificar se o player2 (usuário) tem mais Power Level
            const player2HasMorePower = userPowerLevel > opponentPowerLevel;
            
            console.log(`InstanceIndex ${inst.instanceIndex.toString()}:`, {
              userPowerLevel,
              opponentPowerLevel,
              differencePercent: differencePercent.toFixed(2) + "%",
              isFair,
              threshold,
              player2HasMorePower
            });
            
            // Adicionar flag isFair para uso na UI
            inst._isFair = isFair;
            inst._differencePercent = differencePercent;
            inst._player2HasMorePower = player2HasMorePower;
            
            return true; // Mostrar todas as instâncias não incubando
          });
          
          console.log("✅ Instâncias disponíveis encontradas:", availableInstances.length);
          
          setTokenInstancesForJoin(availableInstances);
          
          // Selecionar automaticamente a primeira instância disponível
          if (availableInstances.length > 0) {
            setSelectedInstanceIndexForJoin(availableInstances[0].instanceIndex);
            console.log("✅ Primeira instância selecionada:", availableInstances[0].instanceIndex.toString());
          } else {
            setSelectedInstanceIndexForJoin(null);
            toast.warning(
              `Nenhuma instância disponível para este token. Todas as instâncias estão incubando.`,
              { duration: 5000 }
            );
          }
        } else {
          setTokenInstancesForJoin([]);
          setSelectedInstanceIndexForJoin(null);
        }
      } catch (err) {
        console.error("Erro ao buscar instâncias do token para join:", err);
        setTokenInstancesForJoin([]);
        setSelectedInstanceIndexForJoin(null);
      } finally {
        setIsLoadingInstancesForJoin(false);
      }
    }

    if (isJoinBattleModalOpen && selectedNFTForJoin && selectedMatchToJoin) {
      fetchTokenInstancesForJoin();
    }
  }, [selectedNFTForJoin, selectedMatchToJoin, address, publicClient, chainId, isCorrectNetwork, isJoinBattleModalOpen]);

  // Comparar skills quando instância é selecionada ou modal abre
  useEffect(() => {
    async function compareSkills() {
      if (
        !isJoinBattleModalOpen ||
        !selectedMatchToJoin ||
        !selectedNFTForJoin ||
        selectedInstanceIndexForJoin === null ||
        !address ||
        !publicClient ||
        !chainId ||
        !isCorrectNetwork
      ) {
        setSkillsComparison(null);
        return;
      }

      setIsLoadingSkillsComparison(true);
      try {
        const fightAddress = CONTRACTS.PUDGY_CHICKEN_FIGHT.baseSepolia;
        if (!fightAddress || fightAddress === "0x") {
          return;
        }

        const matchId = BigInt(selectedMatchToJoin.matchId);
        const matchInfo = await publicClient.readContract({
          address: fightAddress,
          abi: PUDGY_CHICKEN_FIGHT_ABI,
          functionName: "matches",
          args: [matchId],
        }) as any;

        console.log("Match info para comparação de skills:", matchInfo);

        // Extrair dados do matchInfo (pode ser array ou objeto)
        let player1: any, tokenId1: any, instanceId1: any;
        
        if (Array.isArray(matchInfo)) {
          player1 = matchInfo[0];
          tokenId1 = matchInfo[2];
          instanceId1 = matchInfo[3];
        } else if (matchInfo && typeof matchInfo === 'object') {
          player1 = matchInfo.player1;
          tokenId1 = matchInfo.tokenId1;
          instanceId1 = matchInfo.instanceId1;
        }

        // Validar matchInfo antes de usar
        if (!matchInfo || !player1 || tokenId1 === undefined || instanceId1 === undefined) {
          console.warn("Informações do match incompletas para comparação de skills", {
            matchInfo,
            player1,
            tokenId1,
            instanceId1
          });
          setSkillsComparison(null);
          return;
        }

        // Validar endereço do player1
        const player1Address = player1;
        if (!player1Address || typeof player1Address !== 'string' || player1Address === '0x' || player1Address.length !== 42) {
          console.warn("Endereço do player1 inválido para comparação:", player1Address);
          setSkillsComparison(null);
          return;
        }

        const comparison = await compareSkillsAndCheckBalance(
          matchId,
          player1Address as Address,
          BigInt(tokenId1.toString()),
          BigInt(instanceId1.toString()),
          BigInt(selectedNFTForJoin.tokenId),
          selectedInstanceIndexForJoin
        );

        setSkillsComparison(comparison);
      } catch (err) {
        console.error("Erro ao comparar skills:", err);
        setSkillsComparison(null);
      } finally {
        setIsLoadingSkillsComparison(false);
      }
    }

    compareSkills();
  }, [isJoinBattleModalOpen, selectedMatchToJoin, selectedNFTForJoin, selectedInstanceIndexForJoin, address, publicClient, chainId, isCorrectNetwork]);

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

  // Verificar aprovação do NFT para join battle
  useEffect(() => {
    async function checkNFTApprovalForJoin() {
      if (!selectedNFTForJoin || !address || !publicClient || !chainId || !isCorrectNetwork) {
        setNftApprovedForJoin(null);
        return;
      }

      try {
        const collectionAddress = getPudgyChickenCollectionAddress(chainId);
        const fightAddress = CONTRACTS.PUDGY_CHICKEN_FIGHT.baseSepolia;
        
        if (!collectionAddress || !fightAddress || fightAddress === "0x") {
          setNftApprovedForJoin(null);
          return;
        }

        const approved = await publicClient.readContract({
          address: collectionAddress,
          abi: PUDGY_CHICKEN_ABI,
          functionName: "isApprovedForAll",
          args: [address as Address, fightAddress],
        });

        setNftApprovedForJoin(approved as boolean);
      } catch (err) {
        console.error("Erro ao verificar aprovação do NFT:", err);
        setNftApprovedForJoin(null);
      }
    }

    if (isJoinBattleModalOpen && selectedNFTForJoin) {
      checkNFTApprovalForJoin();
    }
  }, [selectedNFTForJoin, address, publicClient, chainId, isCorrectNetwork, isJoinBattleModalOpen]);

  // Função helper para formatar mensagens de erro de forma profissional
  const formatErrorMessage = (error: any): string => {
    if (!error) return "Erro desconhecido ao processar transação";
    
    const errorMessage = error.message || error.toString() || "Erro desconhecido";
    const errorLower = errorMessage.toLowerCase();
    
    // Rejeição do usuário
    if (errorLower.includes("user rejected") || 
        errorLower.includes("user denied") || 
        errorLower.includes("rejected") ||
        errorLower.includes("denied transaction") ||
        errorLower.includes("user cancelled")) {
      return "Transação cancelada pelo usuário";
    }
    
    // Erro VRF - Consumer não autorizado ou configuração incorreta
    if (errorLower.includes("function does not exist") || 
        errorLower.includes("vrf") ||
        errorLower.includes("coordinator") ||
        errorLower.includes("subscription") ||
        errorLower.includes("consumer") ||
        errorLower.includes("invalidconsumer") ||
        errorLower.includes("not authorized") ||
        errorLower.includes("invalid subscription") ||
        errorLower.includes("caller is not")) {
      const fightAddress = CONTRACTS.PUDGY_CHICKEN_FIGHT.baseSepolia;
      const subscriptionId = "21389456745401240734773929798092537115406826755591078326000898398765197969080";
      return `Erro VRF: O consumer não está autorizado ou há problema na configuração. Verifique: 1) Acesse https://vrf.chain.link/base-sepolia 2) Encontre a subscription ${subscriptionId} 3) Verifique se o consumer ${fightAddress} está na lista 4) Se não estiver, adicione-o 5) Verifique se a subscription tem saldo suficiente (LINK e ETH). O erro "function does not exist" geralmente significa que o consumer não está autorizado.`;
    }
    
    // Saldo insuficiente
    if (errorLower.includes("insufficient") || 
        errorLower.includes("balance too low") ||
        errorLower.includes("insufficient funds")) {
      return "Saldo insuficiente para completar a transação";
    }
    
    // Aprovação insuficiente
    if (errorLower.includes("allowance") || 
        errorLower.includes("approval") ||
        errorLower.includes("insufficient allowance")) {
      return "Aprovação insuficiente. Por favor, aprove o contrato primeiro";
    }
    
    // Rede incorreta
    if (errorLower.includes("network") || 
        errorLower.includes("chain") ||
        errorLower.includes("wrong network")) {
      return "Rede incorreta. Por favor, conecte-se à Base Sepolia";
    }
    
    // Gas/transação falhou
    if (errorLower.includes("gas") || 
        errorLower.includes("transaction failed") ||
        errorLower.includes("execution reverted") ||
        errorLower.includes("revert")) {
      return "Transação falhou. Verifique se você tem saldo suficiente e tente novamente";
    }
    
    // Timeout
    if (errorLower.includes("timeout") || 
        errorLower.includes("deadline")) {
      return "Tempo de espera esgotado. Por favor, tente novamente";
    }
    
    // Retornar mensagem original se não corresponder a nenhum padrão conhecido
    return errorMessage.length > 100 
      ? `${errorMessage.substring(0, 100)}...` 
      : errorMessage;
  };

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
    } catch (err: any) {
      console.error("Erro ao aprovar NFT:", err);
      const formattedError = formatErrorMessage(err);
      toast.error(`Erro ao aprovar NFT: ${formattedError}`, {
        duration: 5000,
      });
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
    } catch (err: any) {
      console.error("Erro ao aprovar USDC:", err);
      const formattedError = formatErrorMessage(err);
      toast.error(`Erro ao aprovar USDC: ${formattedError}`, {
        duration: 5000,
      });
      setIsApprovingUSDC(false);
      setCurrentOperation("none");
    }
  };

  // Verificar se usuário tem NFT da coleção e abrir modal de confirmação
  const handleJoinBattleClick = async (match: any) => {
    if (!address || !publicClient || !chainId || !isCorrectNetwork) {
      toast.error("Por favor, conecte sua carteira");
      return;
    }

    // Verificar se usuário tem NFTs da coleção
    if (nfts.length === 0) {
      toast.error("Você não possui NFTs. Adquira um na loja primeiro!", {
        duration: 5000,
      });
      // Sugerir ir para loja
      setTimeout(() => {
        if (confirm("Deseja ir para a loja para adquirir um NFT?")) {
          window.location.href = "/#shop";
        }
      }, 1000);
      return;
    }

    // Verificar se tem NFT vivo
    const aliveNFTs = nfts.filter(nft => nft.isAlive);
    if (aliveNFTs.length === 0) {
      toast.error("Você não possui NFTs válidos (todos expirados)");
      return;
    }

    // Buscar informações completas do match para obter instanceId1 e buscar instanceIndex1
    try {
      const fightAddress = CONTRACTS.PUDGY_CHICKEN_FIGHT.baseSepolia;
      const collectionAddress = getPudgyChickenCollectionAddress(chainId);
      
      if (fightAddress && fightAddress !== "0x" && collectionAddress) {
        const fullMatch = await publicClient.readContract({
          address: fightAddress,
          abi: PUDGY_CHICKEN_FIGHT_ABI,
          functionName: "matches",
          args: [BigInt(match.matchId)],
        }) as any;
        
        const tokenId1 = Array.isArray(fullMatch) ? fullMatch[2] : fullMatch.tokenId1;
        const instanceId1 = Array.isArray(fullMatch) ? fullMatch[3] : fullMatch.instanceId1;
        
        let instanceIndex1: number | undefined = undefined;
        
        // Buscar instanceIndex1 se ainda não estiver no cache
        if (!matchInstanceIndexes.has(match.matchId.toString()) && tokenId1 && instanceId1) {
          for (let i = 0; i < 100; i++) {
            try {
              const instanceIdFromIndex = await publicClient.readContract({
                address: collectionAddress,
                abi: PUDGY_CHICKEN_ABI,
                functionName: "getInstanceIdByIndex",
                args: [BigInt(tokenId1.toString()), BigInt(i)],
              }) as bigint;
              
              if (instanceIdFromIndex.toString() === instanceId1.toString()) {
                instanceIndex1 = i;
                setMatchInstanceIndexes(prev => new Map(prev).set(match.matchId.toString(), i));
                break;
              }
            } catch {
              break;
            }
          }
        } else if (matchInstanceIndexes.has(match.matchId.toString())) {
          instanceIndex1 = matchInstanceIndexes.get(match.matchId.toString());
        }
        
        // Adicionar instanceIndex1 ao match
        const matchWithInstanceIndex = {
          ...match,
          instanceIndex1: instanceIndex1 !== undefined ? BigInt(instanceIndex1) : undefined
        };
        
        // Não selecionar NFT automaticamente - deixar o usuário escolher no modal
        // Selecionar o primeiro apenas como padrão inicial, mas permitir mudança
        setSelectedNFTForJoin(aliveNFTs[0]);
        setSelectedMatchToJoin(matchWithInstanceIndex);
        setIsJoinBattleModalOpen(true);
      } else {
        // Fallback se não conseguir buscar
        setSelectedNFTForJoin(aliveNFTs[0]);
        setSelectedMatchToJoin(match);
        setIsJoinBattleModalOpen(true);
      }
    } catch (err) {
      console.error("Erro ao buscar instanceIndex do oponente:", err);
      // Fallback se der erro
      setSelectedNFTForJoin(aliveNFTs[0]);
      setSelectedMatchToJoin(match);
      setIsJoinBattleModalOpen(true);
    }
  };

  // Aprovar NFT para join battle
  const handleApproveNFTForJoin = async () => {
    if (!address || !chainId || !publicClient || !selectedNFTForJoin) return;

    const collectionAddress = getPudgyChickenCollectionAddress(chainId);
    const fightAddress = CONTRACTS.PUDGY_CHICKEN_FIGHT.baseSepolia;
    
    if (!collectionAddress || !fightAddress || fightAddress === "0x") {
      toast.error("Endereços de contrato não configurados");
      return;
    }

    setIsApprovingNFTForJoin(true);
    setCurrentOperation("approveNFT");
    try {
      writeContract({
        address: collectionAddress,
        abi: PUDGY_CHICKEN_ABI,
        functionName: "setApprovalForAll",
        args: [fightAddress, true],
      });
    } catch (err: any) {
      console.error("Erro ao aprovar NFT:", err);
      const formattedError = formatErrorMessage(err);
      toast.error(`Erro ao aprovar NFT: ${formattedError}`, {
        duration: 5000,
      });
      setIsApprovingNFTForJoin(false);
      setCurrentOperation("none");
    }
  };

  // Função para calcular Power Level (sem broodPower, conforme especificação)
  const calculatePowerLevel = (instanceSkills: any): number => {
    return Number(instanceSkills.power || 0) +
           Number(instanceSkills.speed || 0) +
           Number(instanceSkills.health || 0) +
           Number(instanceSkills.clucking || 0);
  };

  // Função para calcular pontos totais (incluindo broodPower para display)
  const calculateTotalPoints = (instanceSkills: any): number => {
    return calculatePowerLevel(instanceSkills) +
           Number(instanceSkills.broodPower || 0);
  };

  // Função para verificar fairness usando a fórmula do contrato
  const checkFairness = (
    powerLevel1: number,
    powerLevel2: number,
    maxDifferencePercent: number
  ): boolean => {
    if (powerLevel1 === 0 || powerLevel2 === 0) return false;
    
    const maxLevel = Math.max(powerLevel1, powerLevel2);
    const minLevel = Math.min(powerLevel1, powerLevel2);
    
    if (minLevel === 0) return false;
    
    const difference = maxLevel - minLevel;
    const differencePercent = (difference * 100) / minLevel;
    
    return differencePercent <= maxDifferencePercent;
  };

  // Função para comparar skills e verificar balanceamento usando o threshold do contrato
  const compareSkillsAndCheckBalance = async (
    matchId: bigint,
    player1Address: Address,
    player1TokenId: bigint,
    player1InstanceId: bigint,
    player2TokenId: bigint,
    player2InstanceIndex: bigint
  ): Promise<{ 
    isBalanced: boolean; 
    riskLevel: string; 
    player1PowerLevel: number; 
    player2PowerLevel: number; 
    differencePercent: number;
    threshold: number;
    isTie: boolean; // Flag para indicar se todas as skills são idênticas (empate garantido)
    player1Skills: any; // Skills completas do player1
    player2Skills: any; // Skills completas do player2
  }> => {
    try {
      const collectionAddress = getPudgyChickenCollectionAddress(chainId!);
      const fightAddress = CONTRACTS.PUDGY_CHICKEN_FIGHT.baseSepolia;
      
      if (!collectionAddress || !fightAddress || fightAddress === "0x") {
        throw new Error("Endereços de contrato não encontrados");
      }

      // Buscar threshold do contrato em tempo real
      const maxDifferencePercent = await publicClient!.readContract({
        address: fightAddress,
        abi: PUDGY_CHICKEN_FIGHT_ABI,
        functionName: "maxPowerLevelDifferencePercent",
      }) as bigint;

      const threshold = Number(maxDifferencePercent);
      
      console.log("Threshold do contrato (compareSkillsAndCheckBalance, on-chain):", threshold);
      
      if (isNaN(threshold)) {
        console.error("❌ Erro ao buscar threshold do contrato: valor inválido");
        throw new Error("Não foi possível buscar o threshold do contrato");
      }
      
      if (threshold === 0) {
        console.warn("⚠️ Threshold ainda não foi configurado pelo owner do contrato");
        return {
          isBalanced: false,
          riskLevel: "threshold_not_set",
          player1PowerLevel: 0,
          player2PowerLevel: 0,
          differencePercent: 0,
          threshold: 0,
          isTie: false,
          player1Skills: null,
          player2Skills: null,
        };
      }

      // Buscar skills do player1 usando getInstanceIdByIndex + getInstanceSkills diretamente
      let player1PowerLevel = 0;
      let foundInstanceIndex: number | null = null;
      let player1Skills: any = null;

      try {
        // Iterar pelos instanceIndex possíveis do tokenId1 para encontrar o que corresponde ao instanceId1
        for (let i = 0; i < 100; i++) {
          try {
            const instanceIdFromIndex = await publicClient!.readContract({
              address: collectionAddress,
              abi: PUDGY_CHICKEN_ABI,
              functionName: "getInstanceIdByIndex",
              args: [player1TokenId, BigInt(i)],
            }) as bigint;

            if (instanceIdFromIndex.toString() === player1InstanceId.toString()) {
              foundInstanceIndex = i;
              console.log(`✅ Encontrado! InstanceIndex ${i} corresponde ao InstanceId ${player1InstanceId.toString()} para tokenId ${player1TokenId.toString()}`);
              break;
            }
          } catch (err: any) {
            // Se der erro, pode ser que não exista mais instâncias
            const errorMsg = err?.message || String(err);
            if (errorMsg.includes("revert") || errorMsg.includes("execution reverted")) {
              // Erro de contrato - provavelmente não existe mais instâncias
              console.log(`InstanceIndex ${i} não existe (revert) para tokenId ${player1TokenId.toString()}`);
              break;
            } else {
              // Outro tipo de erro - continuar tentando
              console.log(`Erro ao buscar InstanceIndex ${i} para tokenId ${player1TokenId.toString()}:`, errorMsg);
            }
          }
        }

        // Se encontramos o instanceIndex, buscar as skills usando getInstanceSkills diretamente
        if (foundInstanceIndex !== null) {
          try {
            player1Skills = await publicClient!.readContract({
              address: collectionAddress,
              abi: PUDGY_CHICKEN_ABI,
              functionName: "getInstanceSkills",
              args: [player1TokenId, BigInt(foundInstanceIndex)],
            }) as any;

            player1PowerLevel = calculatePowerLevel(player1Skills);
            console.log("✅ Skills do player1 encontradas via getInstanceSkills:", {
              tokenId: player1TokenId.toString(),
              instanceIndex: foundInstanceIndex,
              instanceId: player1InstanceId.toString(),
              skills: player1Skills,
              powerLevel: player1PowerLevel,
              power: player1Skills.power?.toString(),
              speed: player1Skills.speed?.toString(),
              health: player1Skills.health?.toString(),
              clucking: player1Skills.clucking?.toString(),
              broodPower: player1Skills.broodPower?.toString()
            });
          } catch (err) {
            console.error("Erro ao buscar skills do player1 via getInstanceSkills:", err);
          }
        } else {
          console.warn("❌ Não foi possível encontrar instanceIndex do player1 correspondente ao instanceId:", {
            tokenId: player1TokenId.toString(),
            instanceId: player1InstanceId.toString()
          });
        }
      } catch (err) {
        console.error("Erro ao buscar skills do player1:", err);
        throw new Error("Instância do player1 não encontrada");
      }

      if (player1PowerLevel === 0 || !player1Skills) {
        throw new Error("Instância do player1 não encontrada ou Power Level inválido");
      }

      // Buscar skills do player2
      const player2TokenInfo = await publicClient!.readContract({
        address: collectionAddress,
        abi: PUDGY_CHICKEN_ABI,
        functionName: "getUserTokenCompleteInfo",
        args: [address as Address, player2TokenId],
      }) as any;

      // Encontrar a instância do player2 com instanceIndex correspondente
      let player2Instance = null;
      if (player2TokenInfo && player2TokenInfo.instances && Array.isArray(player2TokenInfo.instances)) {
        player2Instance = player2TokenInfo.instances.find((inst: any) => 
          inst.instanceIndex.toString() === player2InstanceIndex.toString()
        );
      }

      if (!player2Instance) {
        throw new Error("Instância do player2 não encontrada");
      }

      const player2Skills = player2Instance.instanceSkills;
      
      // Calcular Power Level do player2 (sem broodPower)
      const player2PowerLevel = calculatePowerLevel(player2Skills);

      // Verificar se todas as skills são idênticas (empate garantido)
      const isTie = (
        player1Skills.power?.toString() === player2Skills.power?.toString() &&
        player1Skills.speed?.toString() === player2Skills.speed?.toString() &&
        player1Skills.health?.toString() === player2Skills.health?.toString() &&
        player1Skills.clucking?.toString() === player2Skills.clucking?.toString() &&
        player1Skills.broodPower?.toString() === player2Skills.broodPower?.toString()
      );

      if (isTie) {
        console.warn("⚠️ EMPATE GARANTIDO! Todas as skills são idênticas:", {
          player1Skills: {
            power: player1Skills.power?.toString(),
            speed: player1Skills.speed?.toString(),
            health: player1Skills.health?.toString(),
            clucking: player1Skills.clucking?.toString(),
            broodPower: player1Skills.broodPower?.toString()
          },
          player2Skills: {
            power: player2Skills.power?.toString(),
            speed: player2Skills.speed?.toString(),
            health: player2Skills.health?.toString(),
            clucking: player2Skills.clucking?.toString(),
            broodPower: player2Skills.broodPower?.toString()
          }
        });
      }

      // Calcular diferença percentual usando a fórmula do contrato: ((maxLevel - minLevel) * 100) / minLevel
      const maxLevel = Math.max(player1PowerLevel, player2PowerLevel);
      const minLevel = Math.min(player1PowerLevel, player2PowerLevel);
      const differencePercent = minLevel > 0 
        ? ((maxLevel - minLevel) * 100) / minLevel 
        : (maxLevel > 0 ? 100 : 0);

      // Verificar fairness usando o threshold do contrato
      // isBalanced = true se differencePercent <= threshold (permitido jogar)
      // isBalanced = false se differencePercent > threshold (bloqueado)
      const isBalanced = checkFairness(player1PowerLevel, player2PowerLevel, threshold);

      // Determinar nível de risco baseado no threshold do contrato (maxPowerLevelDifferencePercent)
      // Se differencePercent > threshold: BLOQUEADO (não permitir jogar)
      // Se differencePercent <= threshold: PERMITIDO (com alertas se próximo)
      let riskLevel = "normal";
      if (differencePercent > threshold) {
        // Diferença excede o threshold - BLOQUEADO
        riskLevel = "blocked";
      } else if (differencePercent > threshold * 0.8) {
        // Diferença está entre 80% e 100% do threshold - Risco alto mas permitido
        riskLevel = "high";
      } else if (differencePercent > threshold * 0.5) {
        // Diferença está entre 50% e 80% do threshold - Risco moderado
        riskLevel = "medium";
      } else {
        // Diferença está abaixo de 50% do threshold - Normal
        riskLevel = "normal";
      }

      return {
        isBalanced: isTie ? false : isBalanced, // Se for empate, não está balanceado (bloqueado)
        riskLevel: isTie ? "tie" : riskLevel, // Novo riskLevel para empate
        player1PowerLevel,
        player2PowerLevel,
        differencePercent,
        threshold,
        isTie,
        player1Skills,
        player2Skills,
      };
    } catch (error) {
      console.error("Erro ao comparar skills:", error);
      
      // Tentar buscar threshold do contrato mesmo em caso de erro
      let threshold = 0;
      try {
        const fightAddress = CONTRACTS.PUDGY_CHICKEN_FIGHT.baseSepolia;
        if (fightAddress && fightAddress !== "0x" && publicClient) {
          const maxDifferencePercent = await publicClient.readContract({
            address: fightAddress,
            abi: PUDGY_CHICKEN_FIGHT_ABI,
            functionName: "maxPowerLevelDifferencePercent",
          }) as bigint;
          threshold = Number(maxDifferencePercent);
        }
      } catch (thresholdError) {
        console.error("Erro ao buscar threshold do contrato no catch:", thresholdError);
      }
      
      // Em caso de erro, permitir continuar mas avisar
      return {
        isBalanced: true,
        riskLevel: "unknown",
        player1PowerLevel: 0,
        player2PowerLevel: 0,
        differencePercent: 0,
        threshold: threshold || 0, // Usar valor do contrato ou 0 se não conseguir buscar
        isTie: false,
        player1Skills: null,
        player2Skills: null,
      };
    }
  };

  // Entrar na batalha
  const handleJoinBattle = async () => {
    if (!selectedMatchToJoin || !selectedNFTForJoin || !address || !chainId || !publicClient || !isCorrectNetwork) {
      toast.error("Dados insuficientes para entrar na batalha");
      return;
    }

    if (!selectedNFTForJoin.isAlive) {
      toast.error("Este NFT expirou e não pode participar de batalhas");
      return;
    }

    if (nftApprovedForJoin === false) {
      toast.error("Por favor, aprove o NFT primeiro");
      return;
    }

    // Verificar se há instância selecionada
    if (selectedInstanceIndexForJoin === null) {
      toast.error("Por favor, selecione uma instância do colecionável");
      return;
    }

    try {
      const managerAddress = getManagerFarmAddress(chainId);
      if (!managerAddress) {
        toast.error("Contrato não encontrado para esta rede");
        return;
      }

      const matchId = BigInt(selectedMatchToJoin.matchId);
      const collectionId = BigInt(selectedMatchToJoin.collectionId || 1); // Assumindo collectionId 1
      const tokenId = BigInt(selectedNFTForJoin.tokenId);

      // Buscar informações completas do match para comparar skills
      const fightAddressForComparison = CONTRACTS.PUDGY_CHICKEN_FIGHT.baseSepolia;
      if (!fightAddressForComparison || fightAddressForComparison === "0x") {
        toast.error("Endereço do contrato Fight não configurado");
        return;
      }

      const matchInfo = await publicClient.readContract({
        address: fightAddressForComparison,
        abi: PUDGY_CHICKEN_FIGHT_ABI,
        functionName: "matches",
        args: [matchId],
      }) as any;

      console.log("Match info para join battle:", matchInfo);

      // Extrair dados do matchInfo (pode ser array ou objeto)
      let player1: any, tokenId1: any, instanceId1: any;
      
      if (Array.isArray(matchInfo)) {
        player1 = matchInfo[0];
        tokenId1 = matchInfo[2];
        instanceId1 = matchInfo[3];
      } else if (matchInfo && typeof matchInfo === 'object') {
        player1 = matchInfo.player1;
        tokenId1 = matchInfo.tokenId1;
        instanceId1 = matchInfo.instanceId1;
      }

      // Validar matchInfo antes de usar
      if (!matchInfo || !player1 || tokenId1 === undefined || instanceId1 === undefined) {
        console.error("Informações do match incompletas", {
          matchInfo,
          player1,
          tokenId1,
          instanceId1
        });
        toast.error("Erro ao buscar informações da batalha. Tente novamente.");
        setIsJoiningBattle(false);
        setCurrentOperation("none");
        return;
      }

      // Validar endereço do player1
      const player1Address = player1;
      if (!player1Address || typeof player1Address !== 'string' || player1Address === '0x' || player1Address.length !== 42) {
        console.error("Endereço do player1 inválido:", player1Address);
        toast.error("Erro ao validar informações da batalha. Tente novamente.");
        setIsJoiningBattle(false);
        setCurrentOperation("none");
        return;
      }

      // Comparar skills e verificar balanceamento
      const balanceCheck = await compareSkillsAndCheckBalance(
        matchId,
        player1Address as Address,
        BigInt(tokenId1.toString()),
        BigInt(instanceId1.toString()),
        tokenId,
        selectedInstanceIndexForJoin
      );

      console.log("Comparação de skills:", balanceCheck);

      // Verificar se o threshold foi configurado
      if (balanceCheck.riskLevel === "threshold_not_set") {
        toast.error(
          "O threshold de diferença de Power Level ainda não foi configurado pelo owner do contrato. Por favor, aguarde a configuração antes de participar de batalhas.",
          { duration: 10000 }
        );
        setIsJoiningBattle(false);
        setCurrentOperation("none");
        return;
      }

      // Verificar se há empate garantido (todas as skills idênticas)
      if (balanceCheck.isTie && balanceCheck.riskLevel === "tie") {
        toast.error(
          `⚖️ EMPATE GARANTIDO - Batalha Bloqueada! ` +
          `Todas as skills dos dois colecionáveis são idênticas (Power: ${balanceCheck.player1Skills?.power?.toString()}, Speed: ${balanceCheck.player1Skills?.speed?.toString()}, Health: ${balanceCheck.player1Skills?.health?.toString()}, Clucking: ${balanceCheck.player1Skills?.clucking?.toString()}, Brood Power: ${balanceCheck.player1Skills?.broodPower?.toString()}). ` +
          `Como todas as skills são idênticas, o resultado da batalha será sempre um EMPATE. ` +
          `Esta batalha não pode ser iniciada. Por favor, selecione uma instância com skills diferentes ou aguarde uma batalha com outro oponente.`,
          { duration: 15000 }
        );
        setIsJoiningBattle(false);
        setCurrentOperation("none");
        return;
      }

      // Verificar se está desbalanceado (player2 muito superior ao player1)
      if (!balanceCheck.isBalanced && balanceCheck.player2PowerLevel > balanceCheck.player1PowerLevel) {
        const difference = balanceCheck.player2PowerLevel - balanceCheck.player1PowerLevel;
        const differencePercent = balanceCheck.differencePercent;
        
        toast.error(
          `Batalha desbalanceada! Seu colecionável tem Power Level ${balanceCheck.player2PowerLevel} vs ${balanceCheck.player1PowerLevel} do oponente (diferença de ${differencePercent.toFixed(1)}%). Para manter o jogo justo, batalhas com diferença superior a ${balanceCheck.threshold}% não são permitidas. Considere usar um colecionável com skills mais próximas ou fazer um novo mint.`,
          { duration: 10000 }
        );
        setIsJoiningBattle(false);
        setCurrentOperation("none");
        return;
      }

      // Bloquear se a diferença exceder o threshold do contrato
      if (balanceCheck.riskLevel === "blocked") {
        toast.error(
          `Batalha bloqueada! Diferença de ${balanceCheck.differencePercent.toFixed(1)}% excede o limite permitido de ${balanceCheck.threshold}%. ` +
          `Para manter o jogo justo, batalhas com diferença superior a ${balanceCheck.threshold}% não são permitidas. ` +
          `Considere usar um colecionável com skills mais próximas ou fazer um novo mint.`,
          { duration: 10000 }
        );
        setIsJoiningBattle(false);
        setCurrentOperation("none");
        return;
      }

      // Mostrar alerta de risco alto se necessário (mas permitir continuar)
      if (balanceCheck.riskLevel === "high" && balanceCheck.player2PowerLevel < balanceCheck.player1PowerLevel) {
        const difference = balanceCheck.player1PowerLevel - balanceCheck.player2PowerLevel;
        const differencePercent = balanceCheck.differencePercent;
        
        // Mostrar alerta forte mas permitir continuar
        const shouldContinue = window.confirm(
          `⚠️ ALERTA DE RISCO ALTO!\n\n` +
          `Seu colecionável: Power Level ${balanceCheck.player2PowerLevel}\n` +
          `Oponente: Power Level ${balanceCheck.player1PowerLevel}\n` +
          `Diferença: ${differencePercent.toFixed(1)}% (${difference} pontos a menos)\n\n` +
          `Você está prestes a entrar em uma batalha onde seu colecionável tem menos Power Level que o oponente. ` +
          `A diferença está próxima do limite permitido (${balanceCheck.threshold}%). Suas chances de vitória são reduzidas.\n\n` +
          `Deseja continuar mesmo assim?`
        );

        if (!shouldContinue) {
          setIsJoiningBattle(false);
          setCurrentOperation("none");
          return;
        }
      }

      // Calcular valor necessário - sempre buscar do contrato para garantir valor atualizado
      const fightAddress = CONTRACTS.PUDGY_CHICKEN_FIGHT.baseSepolia;
      if (!fightAddress || fightAddress === "0x") {
        toast.error("Endereço do contrato Fight não configurado");
        return;
      }

      // Verificar configuração VRF antes de tentar entrar na batalha
      try {
        const vrfCoordinator = await publicClient.readContract({
          address: fightAddress,
          abi: PUDGY_CHICKEN_FIGHT_ABI,
          functionName: "vrfCoordinator",
        });
        const vrfSubId = await publicClient.readContract({
          address: fightAddress,
          abi: PUDGY_CHICKEN_FIGHT_ABI,
          functionName: "vrfSubId",
        });
        const vrfKeyHash = await publicClient.readContract({
          address: fightAddress,
          abi: PUDGY_CHICKEN_FIGHT_ABI,
          functionName: "vrfKeyHash",
        });
        
        console.log("Configuração VRF do contrato Fight:", {
          coordinator: vrfCoordinator,
          subscriptionId: vrfSubId?.toString(),
          keyHash: vrfKeyHash,
          fightAddress: fightAddress,
          expectedCoordinator: "0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE",
          expectedSubId: "21389456745401240734773929798092537115406826755591078326000898398765197969080",
        });
        
        // Verificar se o coordinator está configurado
        if (!vrfCoordinator || vrfCoordinator === "0x0000000000000000000000000000000000000000") {
          toast.error("VRF não configurado no contrato Fight. Contate o administrador.", {
            duration: 8000,
          });
          return;
        }
        
        // Verificar se o coordinator está correto para Base Sepolia
        const expectedCoordinator = "0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE"; // VRF Coordinator (não muda)
        const coordinatorStr = typeof vrfCoordinator === "string" ? vrfCoordinator : String(vrfCoordinator);
        if (coordinatorStr.toLowerCase() !== expectedCoordinator.toLowerCase()) {
          console.warn("AVISO: VRF Coordinator pode estar incorreto:", {
            configurado: coordinatorStr,
            esperado: expectedCoordinator,
          });
        }
        
        // Verificar se o subscription ID está correto
        const expectedSubId = "21389456745401240734773929798092537115406826755591078326000898398765197969080";
        if (vrfSubId?.toString() !== expectedSubId) {
          console.warn("AVISO: Subscription ID pode estar incorreto:", {
            configurado: vrfSubId?.toString(),
            esperado: expectedSubId,
          });
        }
        
        // Tentar verificar se o consumer está autorizado (se a função existir no coordinator)
        try {
          // VRF v2.5 tem uma função getSubscription que retorna informações da subscription
          // Mas não podemos verificar diretamente se o consumer está autorizado sem o ABI completo
          console.log("Para verificar se o consumer está autorizado, acesse:");
          console.log(`https://vrf.chain.link/base-sepolia e verifique a subscription ${vrfSubId?.toString()}`);
          console.log(`Consumer deve ser: ${fightAddress}`);
        } catch (consumerCheckError: any) {
          console.warn("Não foi possível verificar consumer diretamente:", consumerCheckError);
        }
      } catch (vrfCheckError: any) {
        console.warn("Erro ao verificar configuração VRF:", vrfCheckError);
        // Continuar mesmo se não conseguir verificar, pode ser problema de ABI
      }

      let value = 0n;

      if (selectedMatchToJoin.paymentType === 0) {
        // ETH payment - sempre precisa enviar getPlatformFeeETH()
        const platformFeeETH = await publicClient.readContract({
          address: fightAddress,
          abi: PUDGY_CHICKEN_FIGHT_ABI,
          functionName: "getPlatformFeeETH",
        });
        value = platformFeeETH as bigint;

        // Verificar saldo ETH antes de enviar (incluindo gas)
        const currentEthBalance = await publicClient.getBalance({ address: address as Address });
        
        // Estimar gas necessário para a transação
        let estimatedGas = 500000n; // Gas padrão estimado
        try {
          const gasPrice = await publicClient.getGasPrice();
          
          // Codificar os dados da função joinMatchById
          const functionData = encodeFunctionData({
            abi: CHICKEN_MANAGER_FARM_ABI,
            functionName: "joinMatchById",
            args: [matchId, collectionId, tokenId],
          });
          
          // Estimar gas
          estimatedGas = await publicClient.estimateGas({
            account: address as Address,
            to: managerAddress,
            data: functionData,
            value: value,
          });
          
          // Adicionar 20% de margem de segurança para gas
          estimatedGas = (estimatedGas * 120n) / 100n;
          
          // Calcular custo total (value + gas)
          const gasCost = estimatedGas * gasPrice;
          const totalNeeded = value + gasCost;
          
          if (currentEthBalance < totalNeeded) {
            const shortfall = totalNeeded - currentEthBalance;
            toast.error(
              `Saldo ETH insuficiente. Necessário: ${formatUnits(value, 18)} ETH (taxa) + ~${formatUnits(gasCost, 18)} ETH (gas) = ${formatUnits(totalNeeded, 18)} ETH total. Faltam: ${formatUnits(shortfall, 18)} ETH`,
              { duration: 8000 }
            );
            return;
          }
          
          console.log("Valores calculados para join battle:", {
            platformFeeETH: formatUnits(value, 18),
            currentBalance: formatUnits(currentEthBalance, 18),
            estimatedGas: estimatedGas.toString(),
            gasCost: formatUnits(gasCost, 18),
            totalNeeded: formatUnits(totalNeeded, 18),
          });
        } catch (gasError: any) {
          console.warn("Erro ao estimar gas, usando estimativa padrão:", gasError);
          // Se falhar ao estimar gas, usar estimativa conservadora
          const gasPrice = await publicClient.getGasPrice();
          const gasCost = estimatedGas * gasPrice;
          const totalNeeded = value + gasCost;
          
          if (currentEthBalance < totalNeeded) {
            toast.error(
              `Saldo ETH insuficiente. Necessário: ${formatUnits(value, 18)} ETH (taxa) + ~${formatUnits(gasCost, 18)} ETH (gas estimado) = ${formatUnits(totalNeeded, 18)} ETH total`,
              { duration: 8000 }
            );
            return;
          }
        }
      } else {
        // USDC payment - verificar allowance e saldo USDC
        const platformFeeUSDC = await publicClient.readContract({
          address: fightAddress,
          abi: PUDGY_CHICKEN_FIGHT_ABI,
          functionName: "getPlatformFeeUSDC",
        });
        const betAmount = selectedMatchToJoin.betAmount || 0n;
        const totalNeeded = (platformFeeUSDC as bigint) + betAmount;
        
        // Verificar saldo USDC
        const usdcAddress = CONTRACTS.USDC.baseSepolia;
        if (usdcAddress && usdcAddress !== "0x") {
          const usdcBalance = await getERC20Balance(usdcAddress, address as Address, publicClient);
          if (usdcBalance < totalNeeded) {
            toast.error(`Saldo USDC insuficiente. Necessário: ${formatUnits(totalNeeded, 6)} USDC`);
            return;
          }

          // Verificar allowance
          const allowance = await getERC20Allowance(usdcAddress, address as Address, fightAddress, publicClient);
          if (allowance < totalNeeded) {
            toast.error("Aprovação USDC insuficiente. Aprove primeiro.");
            return;
          }
        }
      }

      // Verificar se há instância selecionada
      if (selectedInstanceIndexForJoin === null) {
        toast.error("Por favor, selecione uma instância do colecionável");
        return;
      }

      setIsJoiningBattle(true);
      setCurrentOperation("joinBattle");
      writeContract({
        address: managerAddress,
        abi: CHICKEN_MANAGER_FARM_ABI,
        functionName: "joinMatchById",
        args: [matchId, collectionId, tokenId, selectedInstanceIndexForJoin],
        value,
      });
    } catch (err: any) {
      console.error("Erro ao entrar na batalha:", err);
      const formattedError = formatErrorMessage(err);
      toast.error(`Erro ao entrar na batalha: ${formattedError}`, {
        duration: 5000,
      });
      setIsJoiningBattle(false);
      setCurrentOperation("none");
    }
  };

  // Calcular risco da batalha
  const calculateBattleRisk = (userTokenId: number, opponentTokenId: number) => {
    // ID 1-2 = legendary, ID 3-4 = epic, ID 5-7 = rare, ID 8-10 = common
    // Se usuário tem ID 10 e oponente tem ID < 4, risco muito alto
    if (userTokenId === 10 && opponentTokenId < 4) {
      return "extremely_high";
    }
    // Se usuário tem ID 8-9 e oponente tem ID < 4, risco alto
    if (userTokenId >= 8 && opponentTokenId < 4) {
      return "high";
    }
    // Se diferença de raridade é grande
    if (userTokenId >= 7 && opponentTokenId <= 2) {
      return "high";
    }
    return "normal";
  };

  // Abrir modal de confirmação para criar batalha
  const handleCreateBattleClick = () => {
    console.log("handleCreateBattleClick chamado", {
      selectedNFT: selectedNFT?.tokenId,
      selectedInstanceIndex: selectedInstanceIndex?.toString(),
      address,
      chainId,
      isCorrectNetwork,
      nftApproved,
      battleType,
      betAmount,
    });

    if (!selectedNFT || !address || !chainId || !publicClient || !isCorrectNetwork) {
      toast.error("Por favor, conecte sua carteira e selecione um NFT");
      return;
    }

    if (!selectedNFT.isAlive) {
      toast.error("Este NFT expirou e não pode participar de batalhas");
      return;
    }

    if (selectedInstanceIndex === null) {
      console.error("selectedInstanceIndex não está definido!", {
        tokenInstances: tokenInstances.length,
        isLoadingInstances,
      });
      toast.error("Por favor, selecione uma instância do colecionável");
      return;
    }

    if (battleType === BattleType.PAID && (!betAmount || betAmount === "0")) {
      toast.error("Batalha paga requer valor de aposta maior que 0");
      return;
    }

    if (nftApproved === false) {
      toast.error("Por favor, aprove o NFT primeiro");
      return;
    }

    console.log("Abrindo modal de confirmação");
    setIsCreateBattleModalOpen(true);
  };

  // Criar batalha (após confirmação no modal)
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

    if (selectedInstanceIndex === null) {
      toast.error("Por favor, selecione uma instância do colecionável");
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
      console.log("Criando batalha com os seguintes parâmetros:", {
        selectedNFT: selectedNFT.tokenId,
        selectedInstanceIndex: selectedInstanceIndex.toString(),
        battleType,
        betAmount,
        paymentType,
        address,
        chainId,
      });
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

      console.log("Valores finais para criar batalha:", {
        managerAddress,
        collectionId: collectionId.toString(),
        player: address,
        tokenId: tokenId.toString(),
        instanceIndex: selectedInstanceIndex.toString(),
        battleType,
        betAmount: betAmountBigInt.toString(),
        paymentType,
        value: value.toString(),
      });

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
          selectedInstanceIndex,
          battleType,
          betAmountBigInt,
          paymentType,
        ],
        value,
      });
    } catch (err: any) {
      console.error("Erro ao criar batalha:", err);
      const formattedError = formatErrorMessage(err);
      toast.error(`Erro ao criar batalha: ${formattedError}`, {
        duration: 5000,
      });
      setIsCreatingBattle(false);
      setCurrentOperation("none");
    }
  };

  // Buscar batalhas ativas do contrato e verificar matches finalizados
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
      
      // Verificar se algum match monitorado foi finalizado
      if (monitoredMatches.size > 0 && address) {
        for (const matchIdStr of monitoredMatches) {
          try {
            const matchId = BigInt(matchIdStr);
            const match = await publicClient.readContract({
              address: fightAddress,
              abi: PUDGY_CHICKEN_FIGHT_ABI,
              functionName: "matches",
              args: [matchId],
            }) as any;
            
            // Status 3 = Finalizada (conforme exemplo do usuário)
            if (match.status === 3 && match.winner !== "0x0000000000000000000000000000000000000000") {
              // Verificar se o usuário participou desta batalha
              const userLower = address.toLowerCase();
              if (
                match.player1.toLowerCase() === userLower ||
                match.player2.toLowerCase() === userLower
              ) {
                // Mostrar modal de resultado
                setBattleResultMatchId(matchId);
                setShowBattleResultModal(true);
                // Remover do monitoramento
                setMonitoredMatches(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(matchIdStr);
                  return newSet;
                });
              }
            }
          } catch (err) {
            console.error(`Erro ao verificar match ${matchIdStr}:`, err);
          }
        }
      }
    } catch (err) {
      console.error("Erro ao buscar batalhas:", err);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  // Buscar batalhas encerradas do usuário usando nextMatchId
  const fetchFinishedMatches = async () => {
    console.log("🔍 fetchFinishedMatches chamada");
    
    if (!publicClient || !chainId || !isCorrectNetwork || !address) {
      console.warn("⚠️ Condições não atendidas para fetchFinishedMatches:", {
        hasPublicClient: !!publicClient,
        chainId,
        isCorrectNetwork,
        hasAddress: !!address
      });
      return;
    }

    setIsLoadingFinishedMatches(true);
    console.log("📊 Iniciando busca de batalhas encerradas...");
    try {
      const fightAddress = CONTRACTS.PUDGY_CHICKEN_FIGHT.baseSepolia;
      console.log("📍 Fight Address:", fightAddress);
      if (!fightAddress || fightAddress === "0x") {
        console.warn("⚠️ Fight address não encontrado");
        setIsLoadingFinishedMatches(false);
        return;
      }

      // Buscar nextMatchId para saber qual é o próximo ID e começar a buscar retroativamente
      const nextMatchId = await publicClient.readContract({
        address: fightAddress,
        abi: PUDGY_CHICKEN_FIGHT_ABI,
        functionName: "nextMatchId",
      }) as bigint;

      console.log("NextMatchId:", nextMatchId.toString());

      // Se nextMatchId for 0 ou 1, não há batalhas ainda
      if (nextMatchId <= 1n) {
        setFinishedMatches([]);
        setIsLoadingFinishedMatches(false);
        return;
      }

      const finished: any[] = [];
      const userLower = address.toLowerCase();
      
      // Começar a buscar retroativamente a partir de nextMatchId - 1
      // Buscar até encontrar 20 batalhas finalizadas onde o usuário participou
      const startId = Number(nextMatchId) - 1;
      const maxIterations = 100; // Limite de segurança para evitar loops infinitos
      let checked = 0;

      console.log(`🔍 Buscando batalhas de ${startId} até 1 (máximo 20 batalhas encerradas)`);
      
      for (let i = startId; i >= 1 && finished.length < 20 && checked < maxIterations; i--) {
        checked++;
        try {
          const matchResult = await publicClient.readContract({
            address: fightAddress,
            abi: PUDGY_CHICKEN_FIGHT_ABI,
            functionName: "matches",
            args: [BigInt(i)],
          }) as any;

          // O retorno pode ser um array ou um objeto, vamos normalizar
          console.log(`📋 Match ${i} - Raw result:`, matchResult);
          console.log(`📋 Match ${i} - Type:`, typeof matchResult, Array.isArray(matchResult));
          
          // Se for um array, acessar por índice; se for objeto, acessar por propriedade
          const match = Array.isArray(matchResult) ? {
            player1: matchResult[0],
            collection1: matchResult[1],
            tokenId1: matchResult[2],
            instanceId1: matchResult[3],
            player2: matchResult[4],
            collection2: matchResult[5],
            tokenId2: matchResult[6],
            instanceId2: matchResult[7],
            status: matchResult[8],
            requestId: matchResult[9],
            winner: matchResult[10],
            loser: matchResult[11],
            winningAttribute: matchResult[12],
            battleType: matchResult[13],
            betAmount: matchResult[14],
            paymentType: matchResult[15],
          } : matchResult;

          console.log(`📋 Match ${i} - Parsed:`, {
            status: match.status,
            hasWinner: match.winner && match.winner !== "0x0000000000000000000000000000000000000000",
            hasLoser: match.loser && match.loser !== "0x0000000000000000000000000000000000000000",
            winner: match.winner,
            loser: match.loser,
            player1: match.player1,
            player2: match.player2
          });

          // Verificar se a batalha está finalizada (status 3) e tem winner e loser
          const isFinished = Number(match.status) === 3;
          const hasWinner = match.winner && match.winner !== "0x0000000000000000000000000000000000000000";
          const hasLoser = match.loser && match.loser !== "0x0000000000000000000000000000000000000000";
          
          // Buscar TODAS as batalhas encerradas, não apenas as do usuário
          // O usuário pode querer ver todas as batalhas encerradas
          if (isFinished && hasWinner && hasLoser) {
            console.log(`✅ Match ${i} é uma batalha encerrada válida!`);
            finished.push({
              matchId: BigInt(i),
              player1: match.player1,
              collection1: match.collection1,
              tokenId1: match.tokenId1,
              instanceId1: match.instanceId1,
              player2: match.player2,
              collection2: match.collection2,
              tokenId2: match.tokenId2,
              instanceId2: match.instanceId2,
              status: Number(match.status),
              requestId: match.requestId,
              winner: match.winner,
              loser: match.loser,
              winningAttribute: Number(match.winningAttribute),
              battleType: Number(match.battleType),
              betAmount: match.betAmount,
              paymentType: Number(match.paymentType),
            });
          } else {
            console.log(`⏭️ Match ${i} não é válido:`, {
              isFinished,
              hasWinner,
              hasLoser,
              status: match.status,
              statusType: typeof match.status,
              statusValue: match.status?.toString()
            });
          }
        } catch (err: any) {
          // Se o erro for porque o match não existe, continuar
          // Outros erros podem ser ignorados também
          if (err?.message?.includes("revert") || err?.message?.includes("execution reverted")) {
            // Match não existe ou foi revertido, continuar
            console.log(`⏭️ Match ${i} não existe ou foi revertido`);
            continue;
          }
          // Para outros erros, logar mas continuar
          console.warn(`⚠️ Erro ao buscar match ${i}:`, err);
        }
      }

      // Ordenar por matchId (mais recente primeiro) - já está ordenado por causa do loop
      setFinishedMatches(finished);
      console.log(`✅ Encontradas ${finished.length} batalhas encerradas (de ${checked} matches verificados)`);
      if (finished.length > 0) {
        console.log("📊 Batalhas encontradas:", finished.map(m => ({ 
          id: m.matchId.toString(), 
          winner: m.winner, 
          loser: m.loser,
          player1: m.player1,
          player2: m.player2
        })));
      }
    } catch (err) {
      console.error("Erro ao buscar batalhas encerradas:", err);
      toast.error("Erro ao carregar batalhas encerradas");
    } finally {
      setIsLoadingFinishedMatches(false);
    }
  };

  // Carregar batalhas ao montar componente e periodicamente verificar matches finalizados
  useEffect(() => {
    if (isConnected && isCorrectNetwork && publicClient && chainId) {
      fetchActiveMatches();
      
      // Verificar matches finalizados a cada 10 segundos
      const interval = setInterval(() => {
        if (monitoredMatches.size > 0) {
          fetchActiveMatches();
        }
      }, 10000);
      
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, isCorrectNetwork, monitoredMatches.size]);

  // Buscar batalhas encerradas quando o usuário conectar ou quando mostrar a aba
  useEffect(() => {
    console.log("useEffect fetchFinishedMatches:", {
      isConnected,
      isCorrectNetwork,
      hasPublicClient: !!publicClient,
      chainId,
      hasAddress: !!address,
      showFinishedMatches
    });
    
    if (isConnected && isCorrectNetwork && publicClient && chainId && address && showFinishedMatches) {
      console.log("✅ Chamando fetchFinishedMatches...");
      fetchFinishedMatches();
    } else if (showFinishedMatches && (!isConnected || !address)) {
      console.log("⚠️ showFinishedMatches é true mas usuário não está conectado");
    }
  }, [isConnected, isCorrectNetwork, publicClient, chainId, address, showFinishedMatches]);

  // Monitorar confirmação da transação - separar por tipo de operação
  useEffect(() => {
    if (isConfirmed && hash && currentOperation !== "none") {
      if (currentOperation === "approveNFT") {
        setIsApprovingNFT(false);
        setIsApprovingNFTForJoin(false);
        setCurrentOperation("none");
        toast.success("NFT aprovado com sucesso!");
        
        // Aguardar um pouco para garantir que a transação foi processada na blockchain
        // e então recarregar aprovação do NFT
        setTimeout(() => {
          if (address && publicClient && chainId && isCorrectNetwork) {
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
                if (selectedNFTForJoin) {
                  setNftApprovedForJoin(approved as boolean);
                }
              }).catch((err) => {
                console.error("Erro ao verificar aprovação após confirmação:", err);
              });
            }
          }
        }, 1000); // Aguardar 1 segundo para garantir que a blockchain processou
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
        setIsCreateBattleModalOpen(false);
        toast.success("Batalha criada com sucesso!");
        
        // Buscar batalhas atualizadas para obter o matchId criado
        setTimeout(async () => {
          await fetchActiveMatches();
          // Encontrar o match mais recente criado pelo usuário
          if (address && activeMatches.length > 0) {
            const userMatches = activeMatches.filter((match: any) => 
              match.player1?.toLowerCase() === address.toLowerCase()
            );
            if (userMatches.length > 0) {
              const latestMatch = userMatches[userMatches.length - 1];
              if (latestMatch.matchId) {
                setMonitoredMatches(prev => new Set([...prev, latestMatch.matchId.toString()]));
              }
            }
          }
        }, 2000); // Aguardar 2s para garantir que a batalha foi indexada
        
        // Não redirecionar automaticamente - deixar usuário ver as batalhas
      } else if (currentOperation === "joinBattle") {
        setIsJoiningBattle(false);
        setCurrentOperation("none");
        setIsJoinBattleModalOpen(false);
        const joinedMatchId = selectedMatchToJoin?.matchId;
        setSelectedMatchToJoin(null);
        setSelectedNFTForJoin(null);
        toast.success("Você entrou na batalha com sucesso!");
        
        // Adicionar match ao monitoramento
        if (joinedMatchId) {
          setMonitoredMatches(prev => new Set([...prev, joinedMatchId.toString()]));
        }
        
        // Buscar batalhas atualizadas
        setTimeout(() => {
          fetchActiveMatches();
        }, 2000);
      } else if (currentOperation === "createBattle") {
        // Adicionar match criado ao monitoramento
        // O matchId será obtido quando buscarmos as batalhas atualizadas
      }
    }
  }, [isConfirmed, hash, currentOperation, selectedNFT, address, publicClient, chainId, isCorrectNetwork]);

  // Monitorar erros e resetar estados
  useEffect(() => {
    if (error) {
      const formattedError = formatErrorMessage(error);
      toast.error(formattedError, {
        duration: 5000,
      });
      
      // Resetar estados baseado na operação atual
      if (currentOperation === "approveNFT") {
        setIsApprovingNFT(false);
        setIsApprovingNFTForJoin(false);
        setCurrentOperation("none");
      } else if (currentOperation === "approveUSDC") {
        setIsApprovingUSDC(false);
        setCurrentOperation("none");
      } else if (currentOperation === "createBattle") {
        setIsCreatingBattle(false);
        setCurrentOperation("none");
      } else if (currentOperation === "joinBattle") {
        setIsJoiningBattle(false);
        setCurrentOperation("none");
      }
    }
  }, [error, currentOperation]);

  // Monitorar erros na confirmação da transação
  useEffect(() => {
    if (isTransactionError && transactionError && hash && currentOperation !== "none") {
      const formattedError = formatErrorMessage(transactionError);
      toast.error(`Falha na confirmação: ${formattedError}`, {
        duration: 6000,
      });
      
      // Resetar estados baseado na operação atual
      if (currentOperation === "approveNFT") {
        setIsApprovingNFT(false);
        setIsApprovingNFTForJoin(false);
        setCurrentOperation("none");
      } else if (currentOperation === "approveUSDC") {
        setIsApprovingUSDC(false);
        setCurrentOperation("none");
      } else if (currentOperation === "createBattle") {
        setIsCreatingBattle(false);
        setCurrentOperation("none");
        setIsCreateBattleModalOpen(false);
      } else if (currentOperation === "joinBattle") {
        setIsJoiningBattle(false);
        setCurrentOperation("none");
        setIsJoinBattleModalOpen(false);
      }
    }
  }, [isTransactionError, transactionError, hash, currentOperation]);

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
  }) => {
    const quantity = Number(nft.balance || 0n);
    const hasMultiple = quantity > 1;
    
    return (
      <Card 
        className={`cursor-pointer transition-all duration-300 ${
          isSelected ? 'ring-2 ring-primary shadow-lg scale-105' : 'hover:shadow-md hover:scale-[1.02]'
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
            <Badge className={`absolute top-2 left-2 ${getRarityColor(nft.rarity)} text-white text-xs font-semibold`}>
              {nft.rarity}
            </Badge>
            {hasMultiple && (
              <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold shadow-lg">
                ×{quantity}
              </Badge>
            )}
            {!nft.isAlive && (
              <Badge className={`absolute ${hasMultiple ? 'bottom-2 right-2' : 'top-2 right-2'} bg-red-500 text-white text-xs`}>
                Expirado
              </Badge>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm truncate flex-1">{nft.name}</h3>
              {hasMultiple && (
                <span className="text-xs font-semibold text-primary ml-2 whitespace-nowrap">
                  {quantity} unid.
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{nft.collection}</p>
            {hasMultiple && (
              <div className="pt-1 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Você possui {quantity} {quantity === 1 ? 'unidade' : 'unidades'} deste NFT
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

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
            <div className="space-y-4">
              {/* Informação sobre múltiplos tokens */}
              {nfts.some(nft => (nft.balance && Number(nft.balance) > 1)) && (
                <Alert className="bg-primary/5 border-primary/20">
                  <AlertDescription className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      Você possui múltiplas unidades de alguns NFTs. A quantidade é exibida no badge.
                    </span>
                  </AlertDescription>
                </Alert>
              )}
              
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
            </div>

            {/* Formulário de Criar Batalha - sempre visível se houver NFTs */}
            {nfts.length > 0 && (
              <Card>
                <CardContent className="p-6 space-y-6">
                  {/* Aviso se nenhum NFT está selecionado */}
                  {!selectedNFT && (
                    <Alert>
                      <AlertDescription>
                        Por favor, selecione um NFT acima para criar uma batalha
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Seleção de Instância */}
                  {selectedNFT && (
                    <div className="space-y-2">
                      <Label htmlFor="instance-select" className="text-base font-semibold">
                        Selecionar Instância do Colecionável
                      </Label>
                      {isLoadingInstances ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Carregando instâncias...
                        </div>
                      ) : tokenInstances.length === 0 ? (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Nenhuma instância disponível para este token. Todas as instâncias podem estar incubando ou você não possui instâncias deste token.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          <Select
                            value={selectedInstanceIndex !== null ? selectedInstanceIndex.toString() : ""}
                            onValueChange={(value) => {
                              console.log("Instance selecionada:", value);
                              setSelectedInstanceIndex(BigInt(value));
                            }}
                          >
                            <SelectTrigger id="instance-select" className="w-full">
                              <SelectValue placeholder="Selecione uma instância">
                                {selectedInstanceIndex !== null ? `Instance Index #${selectedInstanceIndex.toString()}` : "Selecione uma instância"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {tokenInstances.map((instance, index) => {
                                const totalStats = 
                                  Number(instance.instanceSkills.power) +
                                  Number(instance.instanceSkills.speed) +
                                  Number(instance.instanceSkills.health) +
                                  Number(instance.instanceSkills.clucking) +
                                  Number(instance.instanceSkills.broodPower);
                                
                                return (
                                  <SelectItem 
                                    key={index} 
                                    value={instance.instanceIndex.toString()}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span>Instance Index #{instance.instanceIndex.toString()}</span>
                                      <Badge variant="outline" className="ml-2">
                                        {totalStats} pts
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          {selectedInstanceIndex === null && (
                            <Alert className="bg-yellow-500/10 border-yellow-500/20">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                                Por favor, selecione uma instância acima
                              </AlertDescription>
                            </Alert>
                          )}
                        </>
                      )}
                      {tokenInstances.length > 0 && selectedInstanceIndex !== null && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs font-semibold mb-1">Skills da Instância Selecionada:</p>
                          <p className="text-xs text-muted-foreground">
                            {(() => {
                              const selectedInstance = tokenInstances.find(
                                inst => inst.instanceIndex.toString() === selectedInstanceIndex.toString()
                              );
                              if (selectedInstance) {
                                const stats = selectedInstance.instanceSkills;
                                return `Power: ${stats.power} | Speed: ${stats.speed} | Health: ${stats.health} | Clucking: ${stats.clucking} | Brood Power: ${stats.broodPower}`;
                              }
                              return "";
                            })()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

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
                    onClick={handleCreateBattleClick}
                    size="lg"
                    className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90"
                    disabled={
                      !selectedNFT ||
                      selectedInstanceIndex === null ||
                      isPending || 
                      isConfirming || 
                      isApprovingNFT || 
                      isApprovingUSDC ||
                      isCreatingBattle ||
                      isLoadingInstances ||
                      !selectedNFT?.isAlive || 
                      nftApproved === false || 
                      (battleType === BattleType.PAID && (!betAmount || betAmount === "0")) ||
                      (paymentType === PaymentType.USDC && usdcAllowance !== null && (() => {
                        const totalNeeded = (platformFeeUSDC || 0n) + (battleType === BattleType.PAID ? parseUnits(betAmount || "0", 6) : 0n);
                        return usdcAllowance < totalNeeded;
                      })())
                    }
                  >
                    {!selectedNFT ? (
                      <>
                        <AlertTriangle className="mr-2 h-5 w-5" />
                        Selecione um NFT primeiro
                      </>
                    ) : isPending || isConfirming || isCreatingBattle ? (
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

      {/* Botão para Visualizar Informações dos Tokens */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowTokenInfoModal(true)}
          variant="outline"
          className="gap-2"
        >
          <Info className="h-4 w-4" />
          Ver Informações dos Colecionáveis
        </Button>
      </div>

      {/* Batalhas Ativas e Encerradas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">
              <span className="bg-gradient-hero bg-clip-text text-transparent">
                {showFinishedMatches ? "Batalhas Encerradas" : "Batalhas Ativas"}
              </span>
            </h2>
            <div className="flex gap-2">
              <Button
                variant={!showFinishedMatches ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowFinishedMatches(false);
                }}
              >
                Ativas
              </Button>
              <Button
                variant={showFinishedMatches ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowFinishedMatches(true);
                  // Forçar busca imediatamente ao clicar
                  if (isConnected && isCorrectNetwork && publicClient && chainId && address) {
                    console.log("🔄 Botão Encerradas clicado, chamando fetchFinishedMatches...");
                    fetchFinishedMatches();
                  } else {
                    console.warn("⚠️ Condições não atendidas ao clicar em Encerradas");
                  }
                }}
              >
                Encerradas
              </Button>
            </div>
          </div>
          {!showFinishedMatches ? (
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
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Atualizar
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFinishedMatches}
              disabled={isLoadingFinishedMatches}
            >
              {isLoadingFinishedMatches ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Atualizar
                </>
              )}
            </Button>
          )}
        </div>

        {showFinishedMatches ? (
          // Batalhas Encerradas
          isLoadingFinishedMatches ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando batalhas encerradas...</p>
              </CardContent>
            </Card>
          ) : finishedMatches.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-bold mb-2">Nenhuma batalha encerrada</h3>
                <p className="text-muted-foreground">
                  Você ainda não participou de batalhas finalizadas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {finishedMatches.map((match: any) => {
                const matchId = match.matchId.toString();
                const isUserWinner = match.winner.toLowerCase() === address?.toLowerCase();
                const isUserLoser = match.loser.toLowerCase() === address?.toLowerCase();
                const userTokenId = match.player1.toLowerCase() === address?.toLowerCase() 
                  ? match.tokenId1 
                  : match.tokenId2;
                const opponentTokenId = match.player1.toLowerCase() === address?.toLowerCase() 
                  ? match.tokenId2 
                  : match.tokenId1;

                return (
                  <Card 
                    key={matchId} 
                    className={isUserWinner ? 'ring-2 ring-yellow-500 bg-yellow-500/5' : isUserLoser ? 'ring-2 ring-red-500 bg-red-500/5' : ''}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg">Batalha #{matchId}</h3>
                          <div className="flex items-center gap-2 mt-2">
                            {isUserWinner && (
                              <Badge className="bg-yellow-500 text-white">
                                <Trophy className="h-3 w-3 mr-1" />
                                Você Venceu!
                              </Badge>
                            )}
                            {isUserLoser && (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Você Perdeu
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vencedor:</span>
                          <span className="font-mono text-xs">
                            {match.winner.slice(0, 6)}...{match.winner.slice(-4)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Perdedor:</span>
                          <span className="font-mono text-xs">
                            {match.loser.slice(0, 6)}...{match.loser.slice(-4)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Seu Token ID:</span>
                          <span className="font-semibold">#{userTokenId.toString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Oponente Token ID:</span>
                          <span className="font-semibold">#{opponentTokenId.toString()}</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          setBattleResultMatchId(match.matchId);
                          setShowBattleResultModal(true);
                        }}
                        className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90"
                        variant="outline"
                      >
                        <Trophy className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
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
                      {matchInstanceIndexes.has(matchId) && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Instance Index:</span>
                          <span className="font-semibold">#{matchInstanceIndexes.get(matchId)}</span>
                        </div>
                      )}
                      {match.battleType === 1 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Aposta:</span>
                          <span className="font-semibold">{betAmountFormatted} USDC</span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleJoinBattleClick(match)}
                      className="w-full mt-4 bg-gradient-hero text-primary-foreground hover:opacity-90"
                      disabled={isMyBattle || !isConnected}
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

      {/* Modal de Confirmação de Batalha */}
      <Dialog open={isJoinBattleModalOpen} onOpenChange={setIsJoinBattleModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Confirmar Entrada na Batalha
            </DialogTitle>
            <DialogDescription className="pt-4">
              {selectedMatchToJoin && selectedNFTForJoin && (
                <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-200px)] pr-2 scrollbar-custom">
                  {/* NFT Transfer Warning */}
                  {nftTransferEnabled === true && (
                    <Alert className="bg-amber-500/10 border-amber-500/20">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="text-amber-800 dark:text-amber-200">
                        <strong>⚠️ NFT em Jogo</strong>
                        <p className="mt-1">
                          Esta batalha envolve transferência de NFT. Se você perder, seu colecionável será transferido para o vencedor.
                          <br />
                          <strong>Considere cuidadosamente antes de entrar nesta batalha.</strong>
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Informações da Batalha */}
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <h3 className="font-semibold">Informações da Batalha</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Batalha ID:</span>
                        <span className="ml-2 font-semibold">#{selectedMatchToJoin.matchId.toString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tipo:</span>
                        <span className="ml-2 font-semibold">
                          {selectedMatchToJoin.battleType === 0 ? "Gratuita" : "Paga"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Oponente Token ID:</span>
                        <span className="ml-2 font-semibold">#{selectedMatchToJoin.tokenId1.toString()}</span>
                      </div>
                      {selectedMatchToJoin.instanceIndex1 !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Oponente Instance Index:</span>
                          <span className="ml-2 font-semibold">#{selectedMatchToJoin.instanceIndex1.toString()}</span>
                        </div>
                      )}
                      {nftTransferEnabled !== null && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">NFT Transfer:</span>
                          <Badge variant={nftTransferEnabled ? "destructive" : "outline"} className="ml-2">
                            {nftTransferEnabled ? "Ativado" : "Desativado"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seleção de NFT (Token ID) */}
                  <div className="space-y-2">
                    <Label htmlFor="nft-select-join" className="text-base font-semibold">
                      Selecionar Colecionável (Token ID)
                    </Label>
                    <Select
                      value={selectedNFTForJoin?.tokenId.toString() || ""}
                      onValueChange={(value) => {
                        const selectedNFT = nfts.find(nft => nft.tokenId.toString() === value && nft.isAlive);
                        if (selectedNFT) {
                          setSelectedNFTForJoin(selectedNFT);
                          setSelectedInstanceIndexForJoin(null);
                          setTokenInstancesForJoin([]);
                        }
                      }}
                    >
                      <SelectTrigger id="nft-select-join" className="w-full">
                        <SelectValue placeholder="Selecione um colecionável" />
                      </SelectTrigger>
                      <SelectContent>
                        {nfts
                          .filter(nft => nft.isAlive)
                          .map((nft) => {
                            return (
                              <SelectItem 
                                key={nft.tokenId.toString()} 
                                value={nft.tokenId.toString()}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    {nft.image && (
                                      <img 
                                        src={nft.image} 
                                        alt={`Token ${nft.tokenId}`}
                                        className="w-6 h-6 rounded"
                                      />
                                    )}
                                    <span>Token ID #{nft.tokenId}</span>
                                  </div>
                                  <Badge variant="outline" className="ml-2">
                                    {nft.balance.toString()} {Number(nft.balance) > 1 ? 'unidades' : 'unidade'}
                                  </Badge>
                                </div>
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Seleção de Instância para Join Battle */}
                  {selectedNFTForJoin && (
                    <div className="space-y-2">
                      <Label htmlFor="instance-select-join" className="text-base font-semibold">
                        Selecionar Instância do Colecionável
                      </Label>
                      {isLoadingInstancesForJoin ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Carregando instâncias...
                        </div>
                      ) : tokenInstancesForJoin.length === 0 ? (
                        <Alert variant="destructive">
                          <AlertDescription>
                            Nenhuma instância justa disponível para este token. Todas as suas instâncias excedem o threshold de diferença de Power Level permitido pelo contrato, ou estão incubando.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Select
                          value={selectedInstanceIndexForJoin?.toString() || ""}
                          onValueChange={(value) => setSelectedInstanceIndexForJoin(BigInt(value))}
                        >
                          <SelectTrigger id="instance-select-join" className="w-full">
                            <SelectValue placeholder="Selecione uma instância" />
                          </SelectTrigger>
                          <SelectContent>
                            {tokenInstancesForJoin.map((instance, index) => {
                              const powerLevel = calculatePowerLevel(instance.instanceSkills);
                              const totalStats = calculateTotalPoints(instance.instanceSkills);
                              const isFair = instance._isFair !== undefined ? instance._isFair : true;
                              const differencePercent = instance._differencePercent !== undefined ? instance._differencePercent : 0;
                              
                              return (
                                <SelectItem 
                                  key={index} 
                                  value={instance.instanceIndex.toString()}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                      <span>Instance Index #{instance.instanceIndex.toString()}</span>
                                      {!isFair && (
                                        <Badge variant="destructive" className="text-xs">
                                          ⚠️ Bloqueado ({differencePercent.toFixed(1)}%)
                                        </Badge>
                                      )}
                                      {isFair && differencePercent > 0 && (
                                        <Badge 
                                          variant="outline" 
                                          className={`text-xs ${
                                            instance._player2HasMorePower 
                                              ? "text-green-600 border-green-600" 
                                              : "text-yellow-600 border-yellow-600"
                                          }`}
                                        >
                                          {instance._player2HasMorePower ? "" : "⚠️ "}
                                          {differencePercent.toFixed(1)}%
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="ml-2">
                                        PL: {powerLevel}
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs">
                                        Total: {totalStats}
                                      </Badge>
                                    </div>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                      {tokenInstancesForJoin.length > 0 && selectedInstanceIndexForJoin !== null && (
                        <p className="text-xs text-muted-foreground">
                          {(() => {
                            const selectedInstance = tokenInstancesForJoin.find(
                              inst => inst.instanceIndex.toString() === selectedInstanceIndexForJoin.toString()
                            );
                            if (selectedInstance) {
                              const stats = selectedInstance.instanceSkills;
                              return `Power: ${stats.power} | Speed: ${stats.speed} | Health: ${stats.health} | Clucking: ${stats.clucking} | Brood Power: ${stats.broodPower}`;
                            }
                            return "";
                          })()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Aviso de Risco */}
                  <Alert className="bg-yellow-500/10 border-yellow-500/20">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                      <strong>⚠️ ATENÇÃO: Seu colecionável está em jogo!</strong>
                      <p className="mt-2">
                        Ao entrar nesta batalha, seu NFT será transferido para o contrato. Se você perder, 
                        seu colecionável será transferido para o vencedor. Certifique-se de que está disposto 
                        a arriscar seu NFT antes de continuar.
                      </p>
                    </AlertDescription>
                  </Alert>

                  {/* Comparação de Skills e Aviso de Risco */}
                  {isLoadingSkillsComparison ? (
                    <Alert className="bg-blue-500/10 border-blue-500/20">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
                      <AlertDescription className="text-blue-800 dark:text-blue-200">
                        Analisando skills e calculando risco da batalha...
                      </AlertDescription>
                    </Alert>
                  ) : skillsComparison ? (
                    <>
                      {/* Comparação de Power Levels */}
                      <div className="p-4 bg-muted rounded-lg space-y-3">
                        <h3 className="font-semibold text-base">Comparação de Power Levels</h3>
                        {skillsComparison.threshold && (
                          <p className="text-xs text-muted-foreground">
                            Threshold máximo permitido: {skillsComparison.threshold}%
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Oponente (Player 1)</p>
                            <p className="text-lg font-bold text-red-600 dark:text-red-400">
                              {skillsComparison.player1PowerLevel} Power Level
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Você (Player 2)</p>
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {skillsComparison.player2PowerLevel} Power Level
                            </p>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Diferença:</span>
                            <span className={`text-sm font-semibold ${
                              skillsComparison.differencePercent > 30 
                                ? "text-red-600 dark:text-red-400" 
                                : skillsComparison.differencePercent > 15
                                ? "text-orange-600 dark:text-orange-400"
                                : "text-green-600 dark:text-green-400"
                            }`}>
                              {skillsComparison.differencePercent.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Aviso de Risco Baseado em Skills */}
                      {skillsComparison.riskLevel === "threshold_not_set" && (
                        <Alert className="bg-amber-500/10 border-amber-500/20">
                          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          <AlertDescription className="text-amber-800 dark:text-amber-200">
                            <strong>⏳ Threshold Não Configurado</strong>
                            <p className="mt-2">
                              O threshold de diferença de Power Level ainda não foi configurado pelo owner do contrato.
                              <br />
                              <strong>Por favor, aguarde a configuração do threshold pelo owner do contrato antes de participar de batalhas.</strong>
                            </p>
                          </AlertDescription>
                        </Alert>
                      )}
                      {skillsComparison.riskLevel === "tie" && skillsComparison.isTie && (
                        <Alert className="bg-purple-500/10 border-purple-500/20">
                          <AlertTriangle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          <AlertDescription className="text-purple-800 dark:text-purple-200">
                            <strong>⚖️ EMPATE GARANTIDO - Batalha Bloqueada!</strong>
                            <p className="mt-2">
                              <strong>ATENÇÃO:</strong> Todas as skills dos dois colecionáveis são <strong>idênticas</strong>:
                            </p>
                            <div className="mt-3 space-y-1 text-sm bg-background/50 p-3 rounded border">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-muted-foreground">Power:</span>{" "}
                                  <span className="font-semibold">{skillsComparison.player1Skills?.power?.toString() || "N/A"}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Speed:</span>{" "}
                                  <span className="font-semibold">{skillsComparison.player1Skills?.speed?.toString() || "N/A"}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Health:</span>{" "}
                                  <span className="font-semibold">{skillsComparison.player1Skills?.health?.toString() || "N/A"}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Clucking:</span>{" "}
                                  <span className="font-semibold">{skillsComparison.player1Skills?.clucking?.toString() || "N/A"}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-muted-foreground">Brood Power:</span>{" "}
                                  <span className="font-semibold">{skillsComparison.player1Skills?.broodPower?.toString() || "N/A"}</span>
                                </div>
                              </div>
                            </div>
                            <p className="mt-3 font-semibold">
                              Como todas as skills são idênticas, o resultado da batalha será sempre um <strong>EMPATE</strong>.
                              <br />
                              <strong>Esta batalha não pode ser iniciada.</strong> Por favor, selecione uma instância com skills diferentes ou aguarde uma batalha com outro oponente.
                            </p>
                          </AlertDescription>
                        </Alert>
                      )}
                      {skillsComparison.riskLevel === "blocked" && (
                        <Alert className="bg-red-500/10 border-red-500/20">
                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          <AlertDescription className="text-red-800 dark:text-red-200">
                            <strong>🚫 Batalha Bloqueada!</strong>
                            <p className="mt-2">
                              Diferença de {skillsComparison.differencePercent.toFixed(1)}% entre os Power Levels ({skillsComparison.player1PowerLevel} vs {skillsComparison.player2PowerLevel}).
                              <br />
                              <strong>A diferença excede o limite permitido de {skillsComparison.threshold}%.</strong> Para manter o jogo justo, batalhas com diferença superior a {skillsComparison.threshold}% não são permitidas.
                              <br />
                              Considere usar um colecionável com skills mais próximas ou fazer um novo mint.
                            </p>
                          </AlertDescription>
                        </Alert>
                      )}
                      {skillsComparison.riskLevel === "high" && (
                        <Alert className="bg-orange-500/10 border-orange-500/20">
                          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          <AlertDescription className="text-orange-800 dark:text-orange-200">
                            <strong>⚠️ Risco Alto - Próximo do Limite</strong>
                            <p className="mt-2">
                              Diferença de {skillsComparison.differencePercent.toFixed(1)}% entre os Power Levels ({skillsComparison.player1PowerLevel} vs {skillsComparison.player2PowerLevel}).
                              <br />
                              A diferença está próxima do limite permitido de {skillsComparison.threshold}% (entre {Math.round(skillsComparison.threshold * 0.8)}% e {skillsComparison.threshold}%).
                              {skillsComparison.player2PowerLevel < skillsComparison.player1PowerLevel ? (
                                <>
                                  {" "}Seu colecionável tem menos Power Level que o oponente. Suas chances de vitória são reduzidas. 
                                  Considere cuidadosamente antes de prosseguir.
                                </>
                              ) : (
                                <>
                                  {" "}Seu colecionável tem mais Power Level que o oponente ({skillsComparison.player2PowerLevel} vs {skillsComparison.player1PowerLevel}). 
                                  Você pode ter mais chances de ganhar, mas <strong>se perder, estará arriscando um colecionável com mais power e tem chances de perdê-lo para um colecionável de power menor</strong>. 
                                  Considere cuidadosamente antes de prosseguir.
                                </>
                              )}
                            </p>
                          </AlertDescription>
                        </Alert>
                      )}
                      {skillsComparison.riskLevel === "medium" && (
                        <Alert className="bg-yellow-500/10 border-yellow-500/20">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                            <strong>⚡ Risco Moderado</strong>
                            <p className="mt-2">
                              Diferença de {skillsComparison.differencePercent.toFixed(1)}% entre os Power Levels ({skillsComparison.player1PowerLevel} vs {skillsComparison.player2PowerLevel}).
                              {skillsComparison.player2PowerLevel > skillsComparison.player1PowerLevel ? (
                                <>
                                  {" "}Seu colecionável tem mais Power Level que o oponente. Você pode ter mais chances de ganhar, mas <strong>se perder, estará arriscando um colecionável com mais power e tem chances de perdê-lo para um colecionável de power menor</strong>.
                                </>
                              ) : (
                                <>
                                  {" "}A batalha está relativamente balanceada, mas ainda há uma diferença significativa.
                                </>
                              )}
                            </p>
                          </AlertDescription>
                        </Alert>
                      )}
                      {skillsComparison.riskLevel === "normal" && skillsComparison.isBalanced && (
                        <Alert className="bg-green-500/10 border-green-500/20">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <AlertDescription className="text-green-800 dark:text-green-200">
                            <strong>✅ Batalha Balanceada</strong>
                            <p className="mt-2">
                              Diferença de apenas {skillsComparison.differencePercent.toFixed(1)}% entre os Power Levels ({skillsComparison.player1PowerLevel} vs {skillsComparison.player2PowerLevel}).
                              {skillsComparison.player2PowerLevel > skillsComparison.player1PowerLevel ? (
                                <>
                                  {" "}Seu colecionável tem mais Power Level que o oponente. Você pode ter mais chances de ganhar, mas <strong>se perder, estará arriscando um colecionável com mais power e tem chances de perdê-lo para um colecionável de power menor</strong>. 
                                  Esta é uma batalha relativamente balanceada! (Threshold: {skillsComparison.threshold}%)
                                </>
                              ) : (
                                <>
                                  {" "}Esta é uma batalha justa e balanceada! (Threshold: {skillsComparison.threshold}%)
                                </>
                              )}
                            </p>
                          </AlertDescription>
                        </Alert>
                      )}
                    </>
                  ) : null}

                  {/* Status de Aprovação */}
                  {nftApprovedForJoin === false && (
                    <Alert>
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <span>É necessário aprovar o NFT antes de entrar na batalha</span>
                          <Button
                            onClick={handleApproveNFTForJoin}
                            variant="outline"
                            size="sm"
                            disabled={isPending || isApprovingNFTForJoin}
                            className="ml-4"
                          >
                            {isPending || isApprovingNFTForJoin ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Aprovando...
                              </>
                            ) : (
                              "Aprovar NFT"
                            )}
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {nftApprovedForJoin === true && (
                    <Alert className="bg-green-500/10 border-green-500/20">
                      <AlertDescription className="text-green-600 dark:text-green-400">
                        ✓ NFT aprovado e pronto para batalhar
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-shrink-0 flex-col sm:flex-row gap-2 mt-4 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsJoinBattleModalOpen(false);
                setSelectedMatchToJoin(null);
                setSelectedNFTForJoin(null);
                setSelectedInstanceIndexForJoin(null);
                setTokenInstancesForJoin([]);
              }}
              disabled={isPending || isJoiningBattle}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleJoinBattle}
              className="bg-gradient-hero text-primary-foreground hover:opacity-90"
              disabled={
                isPending || 
                isJoiningBattle || 
                nftApprovedForJoin === false ||
                !selectedNFTForJoin?.isAlive ||
                selectedInstanceIndexForJoin === null ||
                isLoadingInstancesForJoin ||
                isLoadingSkillsComparison ||
                (skillsComparison !== null && (skillsComparison.riskLevel === "blocked" || skillsComparison.riskLevel === "tie" || skillsComparison.riskLevel === "threshold_not_set"))
              }
            >
              {isPending || isJoiningBattle ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isPending ? "Aguardando confirmação..." : "Entrando na batalha..."}
                </>
              ) : (
                <>
                  <Sword className="mr-2 h-4 w-4" />
                  Confirmar e Entrar na Batalha
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação para Criar Batalha */}
      <Dialog open={isCreateBattleModalOpen} onOpenChange={setIsCreateBattleModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Confirmar Criação de Batalha
            </DialogTitle>
            <DialogDescription className="pt-4">
              {selectedNFT && (
                <div className="space-y-4">
                  {/* Informações da Batalha */}
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <h3 className="font-semibold">Informações da Batalha</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Tipo:</span>
                        <span className="ml-2 font-semibold">
                          {battleType === BattleType.FREE ? "Gratuita" : "Paga"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pagamento:</span>
                        <span className="ml-2 font-semibold">
                          {paymentType === PaymentType.ETH ? "ETH" : "USDC"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Seu Token ID:</span>
                        <span className="ml-2 font-semibold">#{selectedNFT.tokenId}</span>
                      </div>
                      {selectedInstanceIndex !== null && (
                        <div>
                          <span className="text-muted-foreground">Instance Index:</span>
                          <span className="ml-2 font-semibold">#{selectedInstanceIndex.toString()}</span>
                        </div>
                      )}
                      {battleType === BattleType.PAID && (
                        <div>
                          <span className="text-muted-foreground">Aposta:</span>
                          <span className="ml-2 font-semibold">{betAmount} USDC</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Aviso de Risco */}
                  <Alert className="bg-yellow-500/10 border-yellow-500/20">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                      <strong>⚠️ ATENÇÃO: Seu colecionável está em jogo!</strong>
                      <p className="mt-2">
                        Ao criar esta batalha, seu NFT será transferido para o contrato. Se você perder, 
                        seu colecionável será transferido para o vencedor. Certifique-se de que está disposto 
                        a arriscar seu NFT antes de continuar.
                      </p>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateBattleModalOpen(false)}
              disabled={isPending || isCreatingBattle}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateBattle}
              className="bg-gradient-hero text-primary-foreground hover:opacity-90"
              disabled={
                isPending || 
                isCreatingBattle || 
                nftApproved === false ||
                !selectedNFT?.isAlive ||
                selectedInstanceIndex === null
              }
            >
              {isPending || isCreatingBattle ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isPending ? "Aguardando confirmação..." : "Criando batalha..."}
                </>
              ) : (
                <>
                  <Sword className="mr-2 h-4 w-4" />
                  Confirmar e Criar Batalha
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Informações dos Tokens */}
      <TokenInfoModal
        open={showTokenInfoModal}
        onOpenChange={setShowTokenInfoModal}
        defaultAddress={address || undefined}
        defaultTokenId={selectedNFT?.tokenId}
      />

      {/* Modal de Resultado de Batalha */}
      {battleResultMatchId && address && (
        <BattleResultModal
          open={showBattleResultModal}
          onOpenChange={setShowBattleResultModal}
          matchId={battleResultMatchId}
          userAddress={address as Address}
        />
      )}
    </div>
  );
};
