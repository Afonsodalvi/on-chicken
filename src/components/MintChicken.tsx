import React, { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2, Wallet, Coins, CreditCard, Zap, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Address, decodeEventLog } from "viem";
import { PUDGY_CHICKEN_ABI, ERC20_ABI } from "@/lib/abi";
import { MintSuccessModal } from "./MintSuccessModal";
import {
  getPudgyChickenCollectionAddress,
  isWhitelisted,
  PaymentType,
  getTokenPrice,
  getERC20Balance,
  getETHBalance,
  getERC20Allowance,
  getTokenAddress,
  formatTokenAmount,
  getRemainingFreeMints,
} from "@/lib/contracts-helpers";
import { CHAIN_IDS, isSupportedBaseChain } from "@/lib/contracts";
import { getAllTokenAssets, TokenAsset, getTokenAsset } from "@/lib/token-assets";
import { whitelistService } from "@/lib/supabase";
import { ConnectWallet } from "./ConnectWallet";

interface MintChickenProps {
  onSuccess?: () => void;
}

export const MintChicken: React.FC<MintChickenProps> = ({ onSuccess }) => {
  const { t } = useLanguage();
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, isError: isTransactionError, error: transactionError } = useWaitForTransactionReceipt({
    hash,
  });

  const [isCheckingWhitelist, setIsCheckingWhitelist] = useState(false);
  const [isWhitelistedUser, setIsWhitelistedUser] = useState<boolean | null>(null);
  const [remainingFreeMints, setRemainingFreeMints] = useState<bigint | null>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<number>(10);
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.ETH);
  const [tokenAssets, setTokenAssets] = useState<TokenAsset[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenAsset | null>(null);
  const [price, setPrice] = useState<bigint | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [allowance, setAllowance] = useState<bigint | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [instanceMintedData, setInstanceMintedData] = useState<any>(null);
  const [mintedTokenAsset, setMintedTokenAsset] = useState<TokenAsset | null>(null);

  useEffect(() => {
    const assets = getAllTokenAssets();
    setTokenAssets(assets);
    if (assets.length > 0) {
      const defaultToken = assets.find((a) => a.tokenId === 10) || assets[0];
      setSelectedToken(defaultToken);
      setSelectedTokenId(defaultToken.tokenId);
    }
  }, []);

  // Atualizar token selecionado quando tokenId mudar
  useEffect(() => {
    const token = tokenAssets.find((t) => t.tokenId === selectedTokenId);
    setSelectedToken(token || null);
  }, [selectedTokenId, tokenAssets]);

  // Verificar whitelist quando conectar wallet
  useEffect(() => {
    if (isConnected && address && publicClient && chainId) {
      checkWhitelistStatus();
    } else {
      setIsWhitelistedUser(null);
    }
  }, [isConnected, address, publicClient, chainId]);

  // Carregar free mints restantes apenas para usuários whitelistados
  useEffect(() => {
    if (isWhitelistedUser && isConnected && address && publicClient && chainId) {
      refreshRemainingFreeMints();
    } else {
      setRemainingFreeMints(null);
    }
  }, [isWhitelistedUser, isConnected, address, publicClient, chainId]);

  // Consultar preço quando tokenId, quantity ou paymentType mudar
  useEffect(() => {
    if (isConnected && address && publicClient && chainId && !isWhitelistedUser && selectedTokenId) {
      fetchPrice();
    } else {
      setPrice(null);
    }
  }, [isConnected, address, publicClient, chainId, selectedTokenId, quantity, paymentType, isWhitelistedUser]);

  // Verificar saldo quando preço ou paymentType mudar
  useEffect(() => {
    if (isConnected && address && publicClient && chainId && price && !isWhitelistedUser) {
      checkBalance();
    } else {
      setBalance(null);
      setAllowance(null);
    }
  }, [isConnected, address, publicClient, chainId, price, paymentType, isWhitelistedUser]);

  // Monitorar confirmação da transação e buscar evento InstanceMinted
  useEffect(() => {
    if (isConfirmed && hash && publicClient) {
      const fetchMintEvent = async () => {
        try {
          const receipt = await publicClient.getTransactionReceipt({ hash });
          
          // Buscar evento InstanceMinted
          const instanceMintedEvent = receipt.logs.find((log) => {
            try {
              const decoded = decodeEventLog({
                abi: PUDGY_CHICKEN_ABI,
                data: log.data,
                topics: log.topics,
              });
              return decoded.eventName === "InstanceMinted";
            } catch {
              return false;
            }
          });

          if (instanceMintedEvent) {
            try {
              const decoded = decodeEventLog({
                abi: PUDGY_CHICKEN_ABI,
                data: instanceMintedEvent.data,
                topics: instanceMintedEvent.topics,
              });
              
              if (decoded.eventName === "InstanceMinted") {
                const mintedTokenId = Number(decoded.args.tokenId);
                const tokenAsset = getTokenAsset(mintedTokenId);
                
                setInstanceMintedData({
                  owner: decoded.args.owner,
                  tokenId: decoded.args.tokenId,
                  instanceId: decoded.args.instanceId,
                  instanceIndex: decoded.args.instanceIndex,
                  power: decoded.args.power,
                  speed: decoded.args.speed,
                  health: decoded.args.health,
                  clucking: decoded.args.clucking,
                  broodPower: decoded.args.broodPower,
                });
                setMintedTokenAsset(tokenAsset);
                setShowSuccessModal(true);
              }
            } catch (err) {
              console.error("Erro ao decodificar evento:", err);
            }
          }
          
          toast.success(t('mint.successToast'));
          onSuccess?.();
          setQuantity(1);
          setSelectedTokenId(10);
          // Recarregar quota de free mint do usuário (zerou se era free mint)
          refreshRemainingFreeMints();
        } catch (err) {
          console.error("Erro ao buscar evento:", err);
          toast.success(t('mint.successToast'));
          onSuccess?.();
          refreshRemainingFreeMints();
        }
      };

      fetchMintEvent();
    }
  }, [isConfirmed, hash, publicClient, onSuccess]);

  // Função helper para formatar mensagens de erro de forma profissional
  const formatErrorMessage = (error: any): string => {
    if (!error) return t('mint.error.unknown');
    
    const errorMessage = error.message || error.toString() || t('mint.error.unknown');
    const errorLower = errorMessage.toLowerCase();
    
    if (errorLower.includes("user rejected") || 
        errorLower.includes("user denied") || 
        errorLower.includes("rejected") ||
        errorLower.includes("denied transaction") ||
        errorLower.includes("user cancelled")) {
      return t('mint.error.userRejected');
    }
    if (errorLower.includes("insufficient") || 
        errorLower.includes("balance too low") ||
        errorLower.includes("insufficient funds")) {
      return t('mint.error.insufficientBalance');
    }
    if (errorLower.includes("allowance") || 
        errorLower.includes("approval") ||
        errorLower.includes("insufficient allowance")) {
      return t('mint.error.insufficientAllowance');
    }
    if (errorLower.includes("network") || 
        errorLower.includes("chain") ||
        errorLower.includes("wrong network")) {
      return t('mint.error.wrongNetwork');
    }
    if (errorLower.includes("gas") || 
        errorLower.includes("transaction failed") ||
        errorLower.includes("execution reverted") ||
        errorLower.includes("revert")) {
      return t('mint.error.transactionFailed');
    }
    if (errorLower.includes("timeout") || 
        errorLower.includes("deadline")) {
      return t('mint.error.timeout');
    }
    return errorMessage.length > 100 
      ? `${errorMessage.substring(0, 100)}...` 
      : errorMessage;
  };

  // Mostrar erro se houver
  useEffect(() => {
    if (error) {
      const formattedError = formatErrorMessage(error);
      toast.error(`${t('mint.error.mintFailed')} ${formattedError}`, {
        duration: 5000,
      });
    }
  }, [error]);

  // Monitorar erros na confirmação da transação
  useEffect(() => {
    if (isTransactionError && transactionError && hash) {
      const formattedError = formatErrorMessage(transactionError);
      toast.error(`${t('mint.error.confirmFailed')} ${formattedError}`, {
        duration: 6000,
      });
    }
  }, [isTransactionError, transactionError, hash]);

  const checkWhitelistStatus = async () => {
    if (!address || !publicClient || !chainId) return;

    setIsCheckingWhitelist(true);
    try {
      const collectionAddress = getPudgyChickenCollectionAddress(chainId);
      if (!collectionAddress) {
        toast.error(t('mint.error.contractNotFound'));
        return;
      }

      // Combina on-chain (verdade) + Supabase aprovado (fallback)
      const [whitelistedOnChain, approvedInDB] = await Promise.all([
        isWhitelisted(collectionAddress, address, publicClient),
        whitelistService.isApprovedInDB(address),
      ]);
      setIsWhitelistedUser(whitelistedOnChain || approvedInDB);
    } catch (error) {
      console.error("Erro ao verificar whitelist:", error);
      toast.error(t('mint.error.whitelistCheck'));
    } finally {
      setIsCheckingWhitelist(false);
    }
  };

  const refreshRemainingFreeMints = async () => {
    if (!address || !publicClient || !chainId) {
      setRemainingFreeMints(null);
      return;
    }
    const collectionAddress = getPudgyChickenCollectionAddress(chainId);
    if (!collectionAddress) {
      setRemainingFreeMints(null);
      return;
    }
    try {
      const remaining = await getRemainingFreeMints(collectionAddress, address, publicClient);
      setRemainingFreeMints(remaining);
    } catch (err) {
      console.error("Erro ao consultar free mints restantes:", err);
      setRemainingFreeMints(null);
    }
  };

  const fetchPrice = async () => {
    if (!address || !publicClient || !chainId || !selectedTokenId) return;

    setIsLoadingPrice(true);
    try {
      const collectionAddress = getPudgyChickenCollectionAddress(chainId);
      if (!collectionAddress) {
        setPrice(null);
        return;
      }

      const tokenPrice = await getTokenPrice(
        collectionAddress,
        BigInt(selectedTokenId),
        paymentType,
        publicClient
      );

      if (tokenPrice !== null) {
        // Multiplicar pelo quantity
        setPrice(tokenPrice * BigInt(quantity));
      } else {
        setPrice(null);
      }
    } catch (error) {
      console.error("Erro ao consultar preço:", error);
      setPrice(null);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  const checkBalance = async () => {
    if (!address || !publicClient || !chainId || !price) return;

    setIsCheckingBalance(true);
    try {
      if (paymentType === PaymentType.ETH) {
        const ethBalance = await getETHBalance(address, publicClient);
        setBalance(ethBalance);
        setAllowance(null);
      } else {
        const tokenAddress = getTokenAddress(paymentType, chainId);
        if (!tokenAddress) {
          setBalance(null);
          setAllowance(null);
          return;
        }

        const tokenBalance = await getERC20Balance(tokenAddress, address, publicClient);
        setBalance(tokenBalance);

        const collectionAddress = getPudgyChickenCollectionAddress(chainId);
        if (collectionAddress) {
          const tokenAllowance = await getERC20Allowance(
            tokenAddress,
            address,
            collectionAddress,
            publicClient
          );
          setAllowance(tokenAllowance);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar saldo:", error);
      setBalance(null);
      setAllowance(null);
    } finally {
      setIsCheckingBalance(false);
    }
  };

  const ensureCorrectNetwork = async (): Promise<boolean> => {
    if (!chainId) return false;

    if (!isSupportedBaseChain(chainId)) {
      try {
        await switchChain({ chainId: CHAIN_IDS.baseSepolia });
        toast.info(t('mint.error.switchingNetwork'));
        // Aguardar um pouco para a rede trocar
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
      } catch (error: any) {
        console.error("Erro ao trocar de rede:", error);
        toast.error(t('mint.error.connectBaseSepolia'));
        return false;
      }
    }
    return true;
  };

  const ensureTokenApproval = async (): Promise<boolean> => {
    if (paymentType === PaymentType.ETH || !price || !allowance) return true;

    if (allowance < price) {
      const tokenAddress = getTokenAddress(paymentType, chainId!);
      if (!tokenAddress) {
        toast.error(t('mint.error.tokenAddressNotFound'));
        return false;
      }

      const collectionAddress = getPudgyChickenCollectionAddress(chainId!);
      if (!collectionAddress) {
        toast.error(t('mint.error.contractNotFound'));
        return false;
      }

      try {
        // Aprovar um valor maior para evitar múltiplas aprovações
        const approvalAmount = price * 2n; // Aprovar 2x o valor necessário
        
        writeContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [collectionAddress, approvalAmount],
        });

        toast.info(t('mint.error.waitingApproval'));
        return true;
      } catch (error: any) {
        console.error("Erro ao aprovar token:", error);
        toast.error(`${t('mint.error.approveError')} ${error.message}`);
        return false;
      }
    }
    return true;
  };

  const handleMint = async () => {
    if (!address || !chainId || !publicClient) {
      toast.error(t('mint.error.connectWallet'));
      return;
    }

    // Verificar e trocar para a rede correta se necessário
    const networkOk = await ensureCorrectNetwork();
    if (!networkOk) {
      return;
    }

    // Aguardar um pouco para garantir que a rede foi trocada
    if (!isSupportedBaseChain(chainId)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return;
    }

    const collectionAddress = getPudgyChickenCollectionAddress(chainId);
    if (!collectionAddress) {
      toast.error(t('mint.error.contractNotFound'));
      return;
    }

    try {
      if (isWhitelistedUser) {
        // Mint grátis (tokenId = 10, quantity = 1)
        writeContract({
          address: collectionAddress,
          abi: PUDGY_CHICKEN_ABI,
          functionName: "mintFree",
          args: [address, BigInt(10), BigInt(1)],
        });
      } else {
        // Consultar preço antes de fazer o mint
        if (!price) {
          toast.error(t('mint.error.checkingPrice'));
          await fetchPrice();
          return;
        }

        // Verificar saldo
        if (!balance || balance < price) {
          const tokenName = getPaymentTypeLabel(paymentType);
          toast.error(`${t('mint.error.insufficientBalanceToast')} ${formatPaymentAmount(price)} ${tokenName}`);
          return;
        }

        // Para tokens ERC20, verificar e fazer approve se necessário
        if (paymentType !== PaymentType.ETH) {
          if (!allowance || allowance < price) {
            const approved = await ensureTokenApproval();
            if (!approved) {
              return;
            }
            // Aguardar a aprovação ser confirmada
            toast.info(t('mint.error.waitingApprovalConfirm'));
            return;
          }
        }

        // Fazer o mint
        const value = paymentType === PaymentType.ETH ? price : undefined;
        
        writeContract({
          address: collectionAddress,
          abi: PUDGY_CHICKEN_ABI,
          functionName: "mint",
          args: [address, BigInt(selectedTokenId), BigInt(quantity), BigInt(paymentType)],
          value: value,
        });
      }
    } catch (error: any) {
      console.error("Erro ao fazer mint:", error);
      toast.error(`${t('mint.error.prefix')} ${error.message || t('mint.error.generic')}`);
    }
  };

  const getPaymentTypeLabel = (type: PaymentType): string => {
    switch (type) {
      case PaymentType.ETH:
        return "ETH";
      case PaymentType.USDC:
        return "USDC";
      case PaymentType.USDT:
        return "USDT";
      case PaymentType.EGG_COIN:
        return "PudgyEggs";
      default:
        return t('mint.modal.unknownPayment');
    }
  };

  /** Formata valor para exibição: ETH com decimais; USDC/outros sem casas decimais (como ETH em inteiros). */
  const formatPaymentAmount = (amount: bigint) =>
    paymentType === PaymentType.ETH
      ? formatTokenAmount(amount, 18)
      : formatTokenAmount(amount, 6, 0);

  const getPaymentTypeIcon = (type: PaymentType) => {
    switch (type) {
      case PaymentType.ETH:
        return <Zap className="h-4 w-4" />;
      case PaymentType.USDC:
      case PaymentType.USDT:
        return <CreditCard className="h-4 w-4" />;
      case PaymentType.EGG_COIN:
        return <Coins className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">{t('mint.title')}</CardTitle>
          <CardDescription className="text-center">
            {t('mint.connectToStart')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ConnectWallet />
        </CardContent>
      </Card>
    );
  }

  if (isCheckingWhitelist) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <span>{t('mint.checkingWhitelist')}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isLoading = isPending || isConfirming;
  const canMint = !isLoading && selectedToken !== null;

  return (
    <>
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl">{t('mint.title')}</CardTitle>
        <CardDescription className="text-center">
          {isWhitelistedUser
            ? t('mint.youAreOnWhitelist')
            : t('mint.selectAndMint')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status da Whitelist */}
        <Alert>
          {isWhitelistedUser ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                {t('mint.whitelistFree')}
              </AlertDescription>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-500">
                {t('mint.notOnWhitelist')}
              </AlertDescription>
            </>
          )}
        </Alert>

        {isWhitelistedUser ? (
          /* Mint Grátis - Token #10 fixo */
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">{t('mint.token10Free')}</h3>
              {(() => {
                const token10 = tokenAssets.find((t) => t.tokenId === 10);
                return token10 ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative w-48 h-48 rounded-lg overflow-hidden border-2 border-primary">
                      <img
                        src={token10.image}
                        alt={token10.metadata.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-center">
                      <h4 className="font-semibold text-lg">{token10.metadata.name}</h4>
                      <p className="text-sm text-muted-foreground mt-2 max-w-md">
                        {token10.metadata.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4 justify-center">
                        {token10.metadata.attributes.slice(0, 3).map((attr, idx) => (
                          <Badge key={idx} variant="secondary">
                            {attr.trait_type}: {attr.value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    {t('mint.loadingToken10')}
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          /* Mint com Pagamento - Seleção de Token */
          <div className="space-y-4">
            {/* Seleção de Token */}
            <div className="space-y-2">
              <Label htmlFor="token-select">{t('mint.selectToken')}</Label>
              <Select
                value={selectedTokenId.toString()}
                onValueChange={(value) => setSelectedTokenId(parseInt(value))}
              >
                <SelectTrigger id="token-select">
                  <SelectValue placeholder={t('mint.selectTokenPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {tokenAssets.map((token) => (
                    <SelectItem key={token.tokenId} value={token.tokenId.toString()}>
                      Token #{token.tokenId} - {token.metadata.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview do Token Selecionado */}
            {selectedToken && (
              <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg">
                <div className="relative w-full md:w-48 h-48 rounded-lg overflow-hidden border-2 border-primary">
                  <img
                    src={selectedToken.image}
                    alt={selectedToken.metadata.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-lg">{selectedToken.metadata.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedToken.metadata.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedToken.metadata.attributes.slice(0, 3).map((attr, idx) => (
                      <Badge key={idx} variant="secondary">
                        {attr.trait_type}: {attr.value}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quantidade */}
            <div className="space-y-2">
              <Label htmlFor="quantity">{t('mint.quantity')}</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setQuantity(Math.max(1, Math.min(10, val)));
                }}
              />
            </div>

            {/* Tipo de Pagamento */}
            <div className="space-y-2">
              <Label htmlFor="payment-type">{t('mint.paymentType')}</Label>
              <Select
                value={paymentType.toString()}
                onValueChange={(value) => setPaymentType(parseInt(value) as PaymentType)}
              >
                <SelectTrigger id="payment-type">
                  <SelectValue placeholder={t('mint.selectPaymentPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentType.ETH.toString()}>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      ETH
                    </div>
                  </SelectItem>
                  <SelectItem value={PaymentType.USDC.toString()}>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      USDC
                    </div>
                  </SelectItem>
                  <SelectItem value={PaymentType.EGG_COIN.toString()}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🥚</span>
                      PudgyEggs
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Informações de Preço e Saldo */}
            {!isWhitelistedUser && (
              <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                {isLoadingPrice ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('mint.checkingPrice')}
                  </div>
                ) : price !== null ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('mint.totalPrice')}</span>
                      <span className="text-sm font-semibold">
                        {formatPaymentAmount(price)} {getPaymentTypeLabel(paymentType)}
                      </span>
                    </div>
                    {isCheckingBalance ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {t('mint.buttonCheckingBalance')}
                      </div>
                    ) : balance !== null ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{t('mint.yourBalance')}</span>
                          <span className="text-sm">
                            {formatPaymentAmount(balance)} {getPaymentTypeLabel(paymentType)}
                          </span>
                        </div>
                        {balance < price ? (
                          <Alert variant="destructive" className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              {t('mint.insufficientBalance')} {formatPaymentAmount(price)} {getPaymentTypeLabel(paymentType)}
                            </AlertDescription>
                          </Alert>
                        ) : paymentType !== PaymentType.ETH && allowance !== null && allowance < price ? (
                          <Alert className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              {t('mint.approvalRequired')}
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="text-xs text-green-600 mt-2">
                            {t('mint.balanceOk')}
                          </div>
                        )}
                      </>
                    ) : null}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {t('mint.selectTokenAndPayment')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Verificação de Rede */}
        {chainId && !isSupportedBaseChain(chainId) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('mint.wrongNetwork')}
            </AlertDescription>
          </Alert>
        )}

        {/* Aviso: usuário whitelistado já consumiu o(s) free mint(s) */}
        {isWhitelistedUser && remainingFreeMints !== null && remainingFreeMints === 0n && (
          <Alert className="border-amber-500 bg-amber-500/10">
            <CheckCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-600 dark:text-amber-400">
              Você já realizou seu free mint. Não há mais mints gratuitos disponíveis para esta carteira.
            </AlertDescription>
          </Alert>
        )}

        {/* Status: free mints restantes (informativo) */}
        {isWhitelistedUser && remainingFreeMints !== null && remainingFreeMints > 0n && (
          <div className="text-xs text-muted-foreground text-center">
            Free mints restantes para esta carteira:{" "}
            <span className="font-semibold text-foreground">{remainingFreeMints.toString()}</span>
          </div>
        )}

        {/* Botão de Mint */}
        <Button
          onClick={handleMint}
          disabled={
            !canMint ||
            !isSupportedBaseChain(chainId) ||
            isLoadingPrice ||
            isCheckingBalance ||
            (price !== null && balance !== null && balance < price) ||
            (isWhitelistedUser === true && remainingFreeMints === 0n)
          }
          className="w-full"
          size="lg"
        >
          {isLoading || isLoadingPrice || isCheckingBalance ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isLoadingPrice ? t('mint.buttonCheckingPrice') : isCheckingBalance ? t('mint.buttonCheckingBalance') : isPending ? t('mint.buttonWaitingConfirmation') : t('mint.buttonProcessing')}
            </>
          ) : isWhitelistedUser && remainingFreeMints === 0n ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Free mint já realizado
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              {isWhitelistedUser
                ? t('mint.buttonFreeMint')
                : `${t('mint.buttonMintWith')} ${getPaymentTypeLabel(paymentType)}`}
            </>
          )}
        </Button>

        {/* Status da Transação */}
        {hash && (
          <Alert>
            <AlertDescription>
              {t('mint.txHash')}{" "}
              <a
                href={`https://sepolia.basescan.org/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                {hash.slice(0, 10)}...{hash.slice(-8)}
              </a>
            </AlertDescription>
          </Alert>
        )}

        {isConfirmed && (
          <Alert className="border-green-500 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-500">
              {t('mint.successMessage')}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>

    {/* Modal de Sucesso com Skills */}
    <MintSuccessModal
      open={showSuccessModal}
      onOpenChange={setShowSuccessModal}
      instanceData={instanceMintedData}
      tokenImage={mintedTokenAsset?.image}
      tokenName={mintedTokenAsset?.metadata.name}
    />
    </>
  );
};

