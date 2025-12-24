import React, { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2, Wallet, Coins, CreditCard, Zap } from "lucide-react";
import { toast } from "sonner";
import { Address } from "viem";
import { PUDGY_CHICKEN_ABI } from "@/lib/abi";
import { getPudgyChickenCollectionAddress, isWhitelisted, PaymentType } from "@/lib/contracts-helpers";
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

  const handleMint = async () => {
    if (!address || !chainId || !publicClient) {
      toast.error("Conecte sua carteira primeiro");
      return;
    }

    const collectionAddress = getPudgyChickenCollectionAddress(chainId);
    if (!collectionAddress) {
      toast.error("Contrato não encontrado para esta rede");
      return;
    }

    // Verificar se está na rede correta (Base Sepolia)
    if (chainId !== CHAIN_IDS.baseSepolia) {
      toast.error("Por favor, conecte-se à rede Base Sepolia");
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
        // Mint com pagamento
        // Para ETH, precisamos enviar o valor junto com a transação
        // Para outros tokens (USDC, USDT, PudgyEggs), o valor será 0 pois o contrato fará a transferência do token
        const value = paymentType === PaymentType.ETH ? undefined : 0n;
        
        writeContract({
          address: collectionAddress,
          abi: PUDGY_CHICKEN_ABI,
          functionName: "mint",
          args: [address, BigInt(selectedTokenId), BigInt(quantity), BigInt(paymentType)],
          // value será calculado pelo contrato baseado no preço e tipo de pagamento
          // Para ETH, o contrato espera o valor em wei
          // Para outros tokens, o valor deve ser 0 e o contrato fará a transferência do token
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
          </div>
        )}

        {/* Botão de Mint */}
        <Button
          onClick={handleMint}
          disabled={!canMint}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isPending ? "Aguardando confirmação..." : "Processando..."}
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

