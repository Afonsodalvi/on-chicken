import React, { useState, useEffect, useRef } from "react";
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wallet, Coins, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { Address, formatUnits } from "viem";
import { EGG_COIN_ABI, ERC20_ABI } from "@/lib/abi";
import { CHAIN_IDS } from "@/lib/contracts";
import { getEggCoinAddress, getERC20Balance, getERC20Allowance, getTokenAddress } from "@/lib/contracts-helpers";
import { PaymentType } from "@/lib/contracts-helpers";
import { useLanguage } from "@/contexts/LanguageContext";
import { ConnectWallet } from "./ConnectWallet";

interface EggCoinMintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PaymentOption = "ETH" | "USDC";

export const EggCoinMintModal: React.FC<EggCoinMintModalProps> = ({ open, onOpenChange }) => {
  const { t } = useLanguage();
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const [amount, setAmount] = useState<string>("1");
  const [paymentType, setPaymentType] = useState<PaymentOption>("ETH");
  const [priceEth, setPriceEth] = useState<bigint | null>(null);
  const [priceUsdc, setPriceUsdc] = useState<bigint | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [balanceEth, setBalanceEth] = useState<bigint | null>(null);
  const [balanceUsdc, setBalanceUsdc] = useState<bigint | null>(null);
  const [allowanceUsdc, setAllowanceUsdc] = useState<bigint | null>(null);
  const [allowanceRefresh, setAllowanceRefresh] = useState(0);
  const lastWriteRef = useRef<"approve" | "mint" | null>(null);

  const eggCoinAddress = chainId ? getEggCoinAddress(chainId) : null;
  const usdcAddress = chainId ? getTokenAddress(PaymentType.USDC, chainId) : null;
  const isCorrectNetwork = chainId === CHAIN_IDS.baseSepolia;
  const amountBigInt = (() => {
    const n = Math.floor(Number(amount) || 0);
    return n > 0 ? BigInt(n) : 0n;
  })();

  // Buscar preços getPrice(amount, 0) e getPrice(amount, 1)
  useEffect(() => {
    if (!open || !publicClient || !eggCoinAddress || amountBigInt === 0n) {
      setPriceEth(null);
      setPriceUsdc(null);
      return;
    }
    let cancelled = false;
    setIsLoadingPrice(true);
    (async () => {
      try {
        const [ethPrice, usdcPrice] = await Promise.all([
          publicClient.readContract({
            address: eggCoinAddress,
            abi: EGG_COIN_ABI,
            functionName: "getPrice",
            args: [amountBigInt, 0n],
          }) as Promise<bigint>,
          publicClient.readContract({
            address: eggCoinAddress,
            abi: EGG_COIN_ABI,
            functionName: "getPrice",
            args: [amountBigInt, 1n],
          }) as Promise<bigint>,
        ]);
        if (!cancelled) {
          setPriceEth(ethPrice);
          setPriceUsdc(usdcPrice);
        }
      } catch (e) {
        if (!cancelled) {
          setPriceEth(null);
          setPriceUsdc(null);
          console.error("Error fetching EggCoin prices:", e);
        }
      } finally {
        if (!cancelled) setIsLoadingPrice(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, publicClient, eggCoinAddress, amountBigInt]);

  // Saldos e allowance USDC
  useEffect(() => {
    if (!open || !isConnected || !address || !publicClient || !chainId) {
      setBalanceEth(null);
      setBalanceUsdc(null);
      setAllowanceUsdc(null);
      return;
    }
    (async () => {
      try {
        const [eth, usdc] = await Promise.all([
          publicClient.getBalance({ address: address as Address }),
          usdcAddress && usdcAddress !== "0x"
            ? getERC20Balance(usdcAddress, address as Address, publicClient)
            : 0n,
        ]);
        setBalanceEth(eth);
        setBalanceUsdc(usdc);
        if (usdcAddress && usdcAddress !== "0x" && eggCoinAddress) {
          const allow = await getERC20Allowance(usdcAddress, address as Address, eggCoinAddress, publicClient);
          setAllowanceUsdc(allow);
        } else {
          setAllowanceUsdc(null);
        }
      } catch (e) {
        console.error("Error fetching balances:", e);
        setBalanceEth(null);
        setBalanceUsdc(null);
        setAllowanceUsdc(null);
      }
    })();
  }, [open, isConnected, address, publicClient, chainId, eggCoinAddress, usdcAddress, allowanceRefresh]);

  const ensureCorrectNetwork = async (): Promise<boolean> => {
    if (chainId === CHAIN_IDS.baseSepolia) return true;
    try {
      await switchChain?.({ chainId: CHAIN_IDS.baseSepolia });
      return true;
    } catch (e) {
      toast.error(t("eggcoin.modal.wrongNetwork"));
      return false;
    }
  };

  const handleMint = async () => {
    if (!address || !publicClient || !eggCoinAddress || amountBigInt === 0n) return;
    const ok = await ensureCorrectNetwork();
    if (!ok) return;

    if (paymentType === "ETH") {
      if (priceEth === null) {
        toast.error(t("eggcoin.modal.loadingPrice"));
        return;
      }
      if (balanceEth === null || balanceEth < priceEth) {
        toast.error(t("eggcoin.modal.insufficientEth"));
        return;
      }
      lastWriteRef.current = "mint";
      writeContract({
        address: eggCoinAddress,
        abi: EGG_COIN_ABI,
        functionName: "mintWithETH",
        args: [address, amountBigInt],
        value: priceEth,
      });
      return;
    }

    if (paymentType === "USDC") {
      if (priceUsdc === null) {
        toast.error(t("eggcoin.modal.loadingPrice"));
        return;
      }
      if (!usdcAddress || usdcAddress === "0x") {
        toast.error(t("eggcoin.modal.usdcNotAvailable"));
        return;
      }
      if (balanceUsdc === null || balanceUsdc < priceUsdc) {
        toast.error(t("eggcoin.modal.insufficientUsdc"));
        return;
      }
      if (allowanceUsdc === null || allowanceUsdc < priceUsdc) {
        lastWriteRef.current = "approve";
        writeContract({
          address: usdcAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [eggCoinAddress, priceUsdc],
        });
        return;
      }
      lastWriteRef.current = "mint";
      writeContract({
        address: eggCoinAddress,
        abi: EGG_COIN_ABI,
        functionName: "mintWithUSDC",
        args: [address, amountBigInt],
      });
    }
  };

  useEffect(() => {
    if (!isConfirmed || !open) return;
    if (lastWriteRef.current === "approve") {
      toast.success(t("eggcoin.modal.approveSuccess"));
      lastWriteRef.current = null;
      setAllowanceRefresh((k) => k + 1);
    } else if (lastWriteRef.current === "mint") {
      toast.success(t("eggcoin.modal.success"));
      lastWriteRef.current = null;
      onOpenChange(false);
    }
  }, [isConfirmed, open, onOpenChange, t]);

  const isLoading = isPending || isConfirming;
  const needsApproval = paymentType === "USDC" && priceUsdc !== null && (allowanceUsdc === null || allowanceUsdc < priceUsdc);
  const canMint = !isLoading && isConnected && isCorrectNetwork && amountBigInt > 0n && eggCoinAddress;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🥚</span>
            {t("eggcoin.modal.title")}
          </DialogTitle>
          <DialogDescription>
            {t("eggcoin.modal.description")}
          </DialogDescription>
        </DialogHeader>

        {!isConnected ? (
          <div className="space-y-4 py-4">
            <Alert>
              <AlertDescription>{t("eggcoin.modal.connectWallet")}</AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <ConnectWallet />
            </div>
          </div>
        ) : !isCorrectNetwork ? (
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{t("eggcoin.modal.wrongNetwork")}</AlertDescription>
            </Alert>
            <Button onClick={ensureCorrectNetwork} className="w-full">
              {t("eggcoin.modal.switchNetwork")}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Aviso / benefício */}
            <Alert className="bg-muted/50 border-border/50">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm whitespace-pre-line">
                {t("eggcoin.modal.disclaimer")}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="eggcoin-amount">{t("eggcoin.modal.amount")}</Label>
              <Input
                id="eggcoin-amount"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1"
              />
            </div>

            {/* Preços */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t("eggcoin.modal.costLabel")}</p>
              {isLoadingPrice ? (
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("eggcoin.modal.loadingPrice")}
                </div>
              ) : (
                <ul className="text-sm space-y-1">
                  <li className="flex justify-between">
                    <span>ETH (18 dec.):</span>
                    <span className="font-mono">
                      {priceEth !== null ? formatUnits(priceEth, 18) : "—"}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span>USDC (6 dec.):</span>
                    <span className="font-mono">
                      {priceUsdc !== null ? formatUnits(priceUsdc, 6) : "—"}
                    </span>
                  </li>
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("eggcoin.modal.payWith")}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={paymentType === "ETH" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaymentType("ETH")}
                >
                  ETH
                </Button>
                <Button
                  type="button"
                  variant={paymentType === "USDC" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaymentType("USDC")}
                >
                  USDC
                </Button>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!canMint || (paymentType === "ETH" && (priceEth === null || (balanceEth !== null && balanceEth < priceEth))) || (paymentType === "USDC" && (priceUsdc === null || (balanceUsdc !== null && balanceUsdc < priceUsdc)))}
              onClick={handleMint}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {needsApproval ? t("eggcoin.modal.approving") : t("eggcoin.modal.minting")}
                </>
              ) : needsApproval ? (
                t("eggcoin.modal.approveUsdc")
              ) : (
                t("eggcoin.modal.mintButton")
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
