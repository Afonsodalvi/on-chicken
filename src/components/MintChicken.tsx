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
import { Address } from "viem";
import { PUDGY_CHICKEN_ABI, ERC20_ABI } from "@/lib/abi";
import { 
  getPudgyChickenCollectionAddress, 
  isWhitelisted, 
  PaymentType,
  getTokenPrice,
  getERC20Balance,
  getETHBalance,
  getERC20Allowance,
  getTokenAddress,
  formatTokenAmount
} from "@/lib/contracts-helpers";
import { CHAIN_IDS } from "@/lib/contracts";
import { getAllTokenAssets, TokenAsset } from "@/lib/token-assets";
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
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const [isCheckingWhitelist, setIsCheckingWhitelist] = useState(false);
  const [isWhitelistedUser, setIsWhitelistedUser] = useState<boolean | null>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.ETH);
  const [tokenAssets, setTokenAssets] = useState<TokenAsset[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenAsset | null>(null);
  const [price, setPrice] = useState<bigint | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [allowance, setAllowance] = useState<bigint | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  // Carregar assets dos tokens
  useEffect(() => {
    const assets = getAllTokenAssets();
    setTokenAssets(assets);
    if (assets.length > 0) {
      // Se for whitelist, começar com token #10, senão token #1
      const defaultToken = isWhitelistedUser 
        ? assets.find((a) => a.tokenId === 10) || assets[0]
        : assets[0];
      setSelectedToken(defaultToken);
      setSelectedTokenId(defaultToken.tokenId);
    }
  }, []);

  // Atualizar para token #10 quando whitelist for verificada
  useEffect(() => {
    if (isWhitelistedUser && tokenAssets.length > 0) {
      const token10 = tokenAssets.find((a) => a.tokenId === 10);
      if (token10) {
        setSelectedToken(token10);
        setSelectedTokenId(10);
      }
    }
  }, [isWhitelistedUser, tokenAssets]);

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

  // Mostrar toast quando transação for confirmada
  useEffect(() => {
    if (isConfirmed) {
      toast.success("Mint realizado com sucesso! 🐔");
      onSuccess?.();
      // Resetar formulário
      setQuantity(1);
      setSelectedTokenId(1);
    }
  }, [isConfirmed, onSuccess]);

  // Mostrar erro se houver
  useEffect(() => {
    if (error) {
      toast.error(`Erro ao fazer mint: ${error.message}`);
    }
  }, [error]);

  const checkWhitelistStatus = async () => {
    if (!address || !publicClient || !chainId) return;

    setIsCheckingWhitelist(true);
    try {
      const collectionAddress = getPudgyChickenCollectionAddress(chainId);
      if (!collectionAddress) {
        toast.error("Contrato não encontrado para esta rede");
        return;
      }

      const whitelisted = await isWhitelisted(collectionAddress, address, publicClient);
      setIsWhitelistedUser(whitelisted);
    } catch (error) {
      console.error("Erro ao verificar whitelist:", error);
      toast.error("Erro ao verificar status da whitelist");
    } finally {
      setIsCheckingWhitelist(false);
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

    if (chainId !== CHAIN_IDS.baseSepolia) {
      try {
        await switchChain({ chainId: CHAIN_IDS.baseSepolia });
        toast.info("Trocando para a rede Base Sepolia...");
        // Aguardar um pouco para a rede trocar
        await new Promise(resolve => setTimeout(resolve, 2000));
        return true;
      } catch (error: any) {
        console.error("Erro ao trocar de rede:", error);
        toast.error("Por favor, conecte-se à rede Base Sepolia");
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
        toast.error("Endereço do token não encontrado");
        return false;
      }

      const collectionAddress = getPudgyChickenCollectionAddress(chainId!);
      if (!collectionAddress) {
        toast.error("Contrato não encontrado");
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

        toast.info("Aguardando aprovação do token...");
        return true;
      } catch (error: any) {
        console.error("Erro ao aprovar token:", error);
        toast.error(`Erro ao aprovar token: ${error.message}`);
        return false;
      }
    }
    return true;
  };

  const handleMint = async () => {
    if (!address || !chainId || !publicClient) {
      toast.error("Conecte sua carteira primeiro");
      return;
    }

    // Verificar e trocar para a rede correta se necessário
    const networkOk = await ensureCorrectNetwork();
    if (!networkOk) {
      return;
    }

    // Aguardar um pouco para garantir que a rede foi trocada
    if (chainId !== CHAIN_IDS.baseSepolia) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return;
    }

    const collectionAddress = getPudgyChickenCollectionAddress(chainId);
    if (!collectionAddress) {
      toast.error("Contrato não encontrado para esta rede");
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
          toast.error("Consultando preço... Aguarde um momento.");
          await fetchPrice();
          return;
        }

        // Verificar saldo
        if (!balance || balance < price) {
          const tokenName = getPaymentTypeLabel(paymentType);
          toast.error(`Saldo insuficiente! Você precisa de ${formatTokenAmount(price)} ${tokenName}`);
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
            toast.info("Aguardando confirmação da aprovação...");
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
      toast.error(`Erro: ${error.message || "Falha ao executar transação"}`);
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
        return "Desconhecido";
    }
  };

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
          <CardTitle className="text-center">Mint sua PudgyChicken</CardTitle>
          <CardDescription className="text-center">
            Conecte sua carteira para começar
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
            <span>Verificando status da whitelist...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isLoading = isPending || isConfirming;
  const canMint = !isLoading && selectedToken !== null;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Mint sua PudgyChicken</CardTitle>
        <CardDescription className="text-center">
          {isWhitelistedUser
            ? "Você está na whitelist! Faça seu mint grátis do token #10"
            : "Selecione seu token e faça o mint"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status da Whitelist */}
        <Alert>
          {isWhitelistedUser ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                Você está na whitelist! Você pode fazer mint grátis do token #10.
              </AlertDescription>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-500">
                Você não está na whitelist. Você pode fazer mint com pagamento.
              </AlertDescription>
            </>
          )}
        </Alert>

        {isWhitelistedUser ? (
          /* Mint Grátis - Token #10 fixo */
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Token #10 - Mint Grátis</h3>
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
                    Carregando token #10...
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
              <Label htmlFor="token-select">Selecione o Token</Label>
              <Select
                value={selectedTokenId.toString()}
                onValueChange={(value) => setSelectedTokenId(parseInt(value))}
              >
                <SelectTrigger id="token-select">
                  <SelectValue placeholder="Selecione um token" />
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
              <Label htmlFor="quantity">Quantidade</Label>
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
              <Label htmlFor="payment-type">Tipo de Pagamento</Label>
              <Select
                value={paymentType.toString()}
                onValueChange={(value) => setPaymentType(parseInt(value) as PaymentType)}
              >
                <SelectTrigger id="payment-type">
                  <SelectValue placeholder="Selecione o tipo de pagamento" />
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
                    Consultando preço...
                  </div>
                ) : price !== null ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Preço Total:</span>
                      <span className="text-sm font-semibold">
                        {formatTokenAmount(price)} {getPaymentTypeLabel(paymentType)}
                      </span>
                    </div>
                    {isCheckingBalance ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Verificando saldo...
                      </div>
                    ) : balance !== null ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Seu Saldo:</span>
                          <span className="text-sm">
                            {formatTokenAmount(balance)} {getPaymentTypeLabel(paymentType)}
                          </span>
                        </div>
                        {balance < price ? (
                          <Alert variant="destructive" className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              Saldo insuficiente! Você precisa de {formatTokenAmount(price)} {getPaymentTypeLabel(paymentType)}
                            </AlertDescription>
                          </Alert>
                        ) : paymentType !== PaymentType.ETH && allowance !== null && allowance < price ? (
                          <Alert className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              Aprovação necessária. Você precisará aprovar o token antes de fazer o mint.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="text-xs text-green-600 mt-2">
                            ✓ Saldo suficiente
                          </div>
                        )}
                      </>
                    ) : null}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Selecione um token e tipo de pagamento para ver o preço
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Verificação de Rede */}
        {chainId && chainId !== CHAIN_IDS.baseSepolia && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Por favor, conecte-se à rede Base Sepolia. Tentando trocar automaticamente...
            </AlertDescription>
          </Alert>
        )}

        {/* Botão de Mint */}
        <Button
          onClick={handleMint}
          disabled={!canMint || (chainId !== CHAIN_IDS.baseSepolia) || isLoadingPrice || isCheckingBalance || (price !== null && balance !== null && balance < price)}
          className="w-full"
          size="lg"
        >
          {isLoading || isLoadingPrice || isCheckingBalance ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isLoadingPrice ? "Consultando preço..." : isCheckingBalance ? "Verificando saldo..." : isPending ? "Aguardando confirmação..." : "Processando..."}
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              {isWhitelistedUser
                ? "Mint Grátis (Token #10)"
                : `Mint com ${getPaymentTypeLabel(paymentType)}`}
            </>
          )}
        </Button>

        {/* Status da Transação */}
        {hash && (
          <Alert>
            <AlertDescription>
              Hash da transação:{" "}
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
              Mint realizado com sucesso! Verifique sua carteira.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

