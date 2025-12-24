import React, { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet, Zap, CreditCard, Coins, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Address } from "viem";
import { PUDGY_CHICKEN_ABI } from "@/lib/abi";
import { getPudgyChickenCollectionAddress, PaymentType } from "@/lib/contracts-helpers";
import { CHAIN_IDS } from "@/lib/contracts";
import { getTokenAsset } from "@/lib/token-assets";
import { ConnectWallet } from "./ConnectWallet";

interface MintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenId: number;
}

export const MintModal: React.FC<MintModalProps> = ({ open, onOpenChange, tokenId }) => {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const [quantity, setQuantity] = useState<number>(1);
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.ETH);
  const [tokenAsset, setTokenAsset] = useState<ReturnType<typeof getTokenAsset> | null>(null);

  // Carregar asset do token
  useEffect(() => {
    if (open && tokenId) {
      const asset = getTokenAsset(tokenId);
      setTokenAsset(asset);
    }
  }, [open, tokenId]);

  // Resetar quando o modal fechar
  useEffect(() => {
    if (!open) {
      setQuantity(1);
      setPaymentType(PaymentType.ETH);
    }
  }, [open]);

  // Mostrar toast quando transação for confirmada
  useEffect(() => {
    if (isConfirmed) {
      toast.success("Mint realizado com sucesso! 🐔");
      onOpenChange(false);
      // Resetar formulário
      setQuantity(1);
      setPaymentType(PaymentType.ETH);
    }
  }, [isConfirmed, onOpenChange]);

  // Mostrar erro se houver
  useEffect(() => {
    if (error) {
      toast.error(`Erro ao fazer mint: ${error.message}`);
    }
  }, [error]);

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

    if (quantity < 1 || quantity > 10) {
      toast.error("Quantidade deve ser entre 1 e 10");
      return;
    }

    try {
      writeContract({
        address: collectionAddress,
        abi: PUDGY_CHICKEN_ABI,
        functionName: "mint",
        args: [address, BigInt(tokenId), BigInt(quantity), BigInt(paymentType)],
      });
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

  const isLoading = isPending || isConfirming;
  const canMint = !isLoading && isConnected && tokenAsset !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mint {tokenAsset?.metadata.name || `Token #${tokenId}`}</DialogTitle>
          <DialogDescription>
            Complete o mint do seu PudgyChicken NFT
          </DialogDescription>
        </DialogHeader>

        {!isConnected ? (
          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription>
                Conecte sua carteira para fazer o mint
              </AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <ConnectWallet />
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Preview do Token */}
            {tokenAsset && (
              <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg">
                <div className="relative w-full md:w-48 h-48 rounded-lg overflow-hidden border-2 border-primary">
                  <img
                    src={tokenAsset.image}
                    alt={tokenAsset.metadata.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-lg">{tokenAsset.metadata.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {tokenAsset.metadata.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tokenAsset.metadata.attributes.slice(0, 3).map((attr, idx) => (
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
              <p className="text-xs text-muted-foreground">
                Você pode mintar entre 1 e 10 tokens
              </p>
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

            {/* Verificação de Rede */}
            {chainId && chainId !== CHAIN_IDS.baseSepolia && (
              <Alert variant="destructive">
                <AlertDescription>
                  Por favor, conecte-se à rede Base Sepolia para fazer o mint
                </AlertDescription>
              </Alert>
            )}

            {/* Botão de Mint */}
            <Button
              onClick={handleMint}
              disabled={!canMint || chainId !== CHAIN_IDS.baseSepolia}
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
                  Mint com {getPaymentTypeLabel(paymentType)}
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

