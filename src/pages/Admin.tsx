import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, parseUnits, formatEther, formatUnits, Address, zeroHash, isAddress } from "viem";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, Lock, Loader2, CheckCircle, AlertTriangle, Coins,
  Send, Package, Swords, Egg, ArrowDownToLine, Settings,
} from "lucide-react";
import { toast } from "sonner";
import {
  PUDGY_CHICKEN_ABI, CHICKEN_MANAGER_FARM_ABI,
  PUDGY_CHICKEN_FIGHT_ABI, EGG_COIN_ABI,
} from "@/lib/abi";
import {
  getPudgyChickenCollectionAddress, getManagerFarmAddress,
  getFightAddress, getEggCoinAddress,
} from "@/lib/contracts-helpers";
import { isBaseSepolia, isKnownAdminWallet } from "@/lib/contracts";
import { NetworkBadge } from "@/components/NetworkBadge";

// DEFAULT_ADMIN_ROLE = bytes32(0)
const DEFAULT_ADMIN_ROLE = zeroHash;

// ---------------------------------------------------------------------------
// useAdminCheck — verifies the connected wallet has DEFAULT_ADMIN_ROLE
// on each contract. If ANY contract grants admin, the gate opens.
// ---------------------------------------------------------------------------
function useAdminCheck() {
  const { address, chainId } = useAccount();
  const publicClient = usePublicClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [roles, setRoles] = useState({
    collection: false,
    manager: false,
    fight: false,
    eggCoin: false,
  });

  useEffect(() => {
    if (!address || !chainId || !publicClient) {
      setIsAdmin(false);
      setIsChecking(false);
      return;
    }

    let cancelled = false;
    setIsChecking(true);

    const checkRole = async (
      contractAddress: Address | null,
      abi: any,
    ): Promise<boolean> => {
      if (!contractAddress) return false;
      try {
        return (await publicClient.readContract({
          address: contractAddress,
          abi,
          functionName: "hasRole",
          args: [DEFAULT_ADMIN_ROLE, address],
        })) as boolean;
      } catch {
        return false;
      }
    };

    (async () => {
      const [collection, manager, fight, eggCoin] = await Promise.all([
        checkRole(getPudgyChickenCollectionAddress(chainId), PUDGY_CHICKEN_ABI),
        checkRole(getManagerFarmAddress(chainId), CHICKEN_MANAGER_FARM_ABI),
        checkRole(getFightAddress(chainId), PUDGY_CHICKEN_FIGHT_ABI),
        checkRole(getEggCoinAddress(chainId), EGG_COIN_ABI),
      ]);

      if (!cancelled) {
        setRoles({ collection, manager, fight, eggCoin });
        setIsAdmin(collection || manager || fight || eggCoin);
        setIsChecking(false);
      }
    })();

    return () => { cancelled = true; };
  }, [address, chainId, publicClient]);

  return { isAdmin, isChecking, roles };
}

// ---------------------------------------------------------------------------
// Reusable TxButton — write + wait + toast
// ---------------------------------------------------------------------------
function TxButton({
  label,
  icon: Icon,
  contractAddress,
  abi,
  functionName,
  args,
  value,
  disabled,
}: {
  label: string;
  icon: React.ElementType;
  contractAddress: Address | null;
  abi: any;
  functionName: string;
  args: any[];
  value?: bigint;
  disabled?: boolean;
}) {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (receipt.isSuccess) {
      toast.success(`${label} — tx confirmada!`);
      reset();
    }
  }, [receipt.isSuccess]);

  useEffect(() => {
    if (error) {
      toast.error(error.message.split("\n")[0]);
      reset();
    }
  }, [error]);

  const isLoading = isPending || receipt.isLoading;

  return (
    <Button
      disabled={disabled || isLoading || !contractAddress}
      onClick={() => {
        if (!contractAddress) return;
        writeContract({
          address: contractAddress,
          abi,
          functionName,
          args,
          ...(value ? { value } : {}),
        });
      }}
      className="w-full"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Icon className="mr-2 h-4 w-4" />
      )}
      {isLoading ? "Processando..." : label}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Section Components
// ---------------------------------------------------------------------------

function CollectionSection({ contractAddress }: { contractAddress: Address | null }) {
  const [mintTo, setMintTo] = useState("");
  const [mintTokenId, setMintTokenId] = useState("");
  const [mintQty, setMintQty] = useState("1");
  const [withdrawTo, setWithdrawTo] = useState("");
  const [erc20Token, setErc20Token] = useState("");
  const [erc20To, setErc20To] = useState("");
  const [erc20Amount, setErc20Amount] = useState("");

  const publicClient = usePublicClient();
  const [ethBalance, setEthBalance] = useState<string>("0");

  useEffect(() => {
    if (!publicClient || !contractAddress) return;
    publicClient.getBalance({ address: contractAddress }).then(b =>
      setEthBalance(formatEther(b))
    );
  }, [publicClient, contractAddress]);

  return (
    <div className="space-y-6">
      {/* Admin Mint */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Admin Mint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Endereço do destinatário (0x...)" value={mintTo} onChange={e => setMintTo(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Token ID (1-18)" type="number" value={mintTokenId} onChange={e => setMintTokenId(e.target.value)} />
            <Input placeholder="Quantidade" type="number" value={mintQty} onChange={e => setMintQty(e.target.value)} />
          </div>
          <TxButton
            label="Admin Mint"
            icon={Package}
            contractAddress={contractAddress}
            abi={PUDGY_CHICKEN_ABI}
            functionName="adminMint"
            args={[mintTo as Address, BigInt(mintTokenId || "0"), BigInt(mintQty || "1")]}
            disabled={!mintTo || !isAddress(mintTo) || !mintTokenId}
          />
        </CardContent>
      </Card>

      {/* Withdraw ETH */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-emerald-500" />
            Withdraw ETH
            <Badge variant="outline" className="ml-auto">{Number(ethBalance).toFixed(6)} ETH</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Enviar para (0x...)" value={withdrawTo} onChange={e => setWithdrawTo(e.target.value)} />
          <TxButton
            label="Withdraw ETH"
            icon={ArrowDownToLine}
            contractAddress={contractAddress}
            abi={PUDGY_CHICKEN_ABI}
            functionName="withdrawETH"
            args={[withdrawTo as Address]}
            disabled={!withdrawTo || !isAddress(withdrawTo)}
          />
        </CardContent>
      </Card>

      {/* Withdraw ERC20 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="h-5 w-5 text-blue-500" />
            Withdraw ERC20
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Token address (0x... USDC/EggCoin)" value={erc20Token} onChange={e => setErc20Token(e.target.value)} />
          <Input placeholder="Enviar para (0x...)" value={erc20To} onChange={e => setErc20To(e.target.value)} />
          <Input placeholder="Amount (em unidades, ex: 100)" type="number" value={erc20Amount} onChange={e => setErc20Amount(e.target.value)} />
          <TxButton
            label="Withdraw ERC20"
            icon={Coins}
            contractAddress={contractAddress}
            abi={PUDGY_CHICKEN_ABI}
            functionName="withdrawERC20"
            args={[erc20Token as Address, erc20To as Address, parseUnits(erc20Amount || "0", 6)]}
            disabled={!erc20Token || !erc20To || !erc20Amount}
          />
          <p className="text-xs text-muted-foreground">Amount em 6 decimais (USDC/USDT). Para EggCoin (18 decimais), ajuste manualmente.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ManagerSection({ contractAddress }: { contractAddress: Address | null }) {
  const [withdrawTo, setWithdrawTo] = useState("");
  const [erc20Token, setErc20Token] = useState("");
  const [erc20To, setErc20To] = useState("");
  const [erc20Amount, setErc20Amount] = useState("");

  const publicClient = usePublicClient();
  const [ethBalance, setEthBalance] = useState<string>("0");

  useEffect(() => {
    if (!publicClient || !contractAddress) return;
    publicClient.getBalance({ address: contractAddress }).then(b =>
      setEthBalance(formatEther(b))
    );
  }, [publicClient, contractAddress]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-emerald-500" />
            Withdraw ETH
            <Badge variant="outline" className="ml-auto">{Number(ethBalance).toFixed(6)} ETH</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Enviar para (0x...)" value={withdrawTo} onChange={e => setWithdrawTo(e.target.value)} />
          <TxButton
            label="Withdraw ETH"
            icon={ArrowDownToLine}
            contractAddress={contractAddress}
            abi={CHICKEN_MANAGER_FARM_ABI}
            functionName="withdrawETH"
            args={[withdrawTo as Address]}
            disabled={!withdrawTo || !isAddress(withdrawTo)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="h-5 w-5 text-blue-500" />
            Withdraw ERC20
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Token address (0x...)" value={erc20Token} onChange={e => setErc20Token(e.target.value)} />
          <Input placeholder="Enviar para (0x...)" value={erc20To} onChange={e => setErc20To(e.target.value)} />
          <Input placeholder="Amount (6 decimais)" type="number" value={erc20Amount} onChange={e => setErc20Amount(e.target.value)} />
          <TxButton
            label="Withdraw ERC20"
            icon={Coins}
            contractAddress={contractAddress}
            abi={CHICKEN_MANAGER_FARM_ABI}
            functionName="withdrawERC20"
            args={[erc20Token as Address, erc20To as Address, parseUnits(erc20Amount || "0", 6)]}
            disabled={!erc20Token || !erc20To || !erc20Amount}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function FightSection({ contractAddress }: { contractAddress: Address | null }) {
  const [matchIdCancel, setMatchIdCancel] = useState("");
  const [nftTransferEnabled, setNftTransferEnabled] = useState<boolean | null>(null);
  const publicClient = usePublicClient();

  const [ethBalance, setEthBalance] = useState<string>("0");
  const [totalFeesETH, setTotalFeesETH] = useState<string>("0");
  const [totalFeesUSDC, setTotalFeesUSDC] = useState<string>("0");

  useEffect(() => {
    if (!publicClient || !contractAddress) return;
    Promise.all([
      publicClient.getBalance({ address: contractAddress }),
      publicClient.readContract({
        address: contractAddress, abi: PUDGY_CHICKEN_FIGHT_ABI,
        functionName: "totalFeesCollectedETH",
      }).catch(() => 0n),
      publicClient.readContract({
        address: contractAddress, abi: PUDGY_CHICKEN_FIGHT_ABI,
        functionName: "totalFeesCollectedUSDC",
      }).catch(() => 0n),
      publicClient.readContract({
        address: contractAddress, abi: PUDGY_CHICKEN_FIGHT_ABI,
        functionName: "nftTransferEnabled",
      }).catch(() => null),
    ]).then(([bal, feesETH, feesUSDC, nftTransfer]) => {
      setEthBalance(formatEther(bal));
      setTotalFeesETH(formatEther(feesETH as bigint));
      setTotalFeesUSDC(formatUnits(feesUSDC as bigint, 6));
      if (nftTransfer !== null) setNftTransferEnabled(nftTransfer as boolean);
    });
  }, [publicClient, contractAddress]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Balance ETH</p>
            <p className="text-lg font-bold">{Number(ethBalance).toFixed(6)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Fees ETH</p>
            <p className="text-lg font-bold">{Number(totalFeesETH).toFixed(6)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Fees USDC</p>
            <p className="text-lg font-bold">{Number(totalFeesUSDC).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Collect Fees */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Coins className="h-5 w-5 text-emerald-500" />
            Collect Fees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TxButton
            label="Collect All Fees"
            icon={ArrowDownToLine}
            contractAddress={contractAddress}
            abi={PUDGY_CHICKEN_FIGHT_ABI}
            functionName="collectFees"
            args={[]}
          />
        </CardContent>
      </Card>

      {/* NFT Transfer Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5 text-amber-500" />
            NFT Transfer
            {nftTransferEnabled !== null && (
              <Badge className={nftTransferEnabled ? "bg-green-500" : "bg-red-500"}>
                {nftTransferEnabled ? "Ativo" : "Desativado"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <TxButton
            label="Ativar Transferência"
            icon={CheckCircle}
            contractAddress={contractAddress}
            abi={PUDGY_CHICKEN_FIGHT_ABI}
            functionName="setNFTTransferEnabled"
            args={[true]}
            disabled={nftTransferEnabled === true}
          />
          <TxButton
            label="Desativar Transferência"
            icon={AlertTriangle}
            contractAddress={contractAddress}
            abi={PUDGY_CHICKEN_FIGHT_ABI}
            functionName="setNFTTransferEnabled"
            args={[false]}
            disabled={nftTransferEnabled === false}
          />
        </CardContent>
      </Card>

      {/* Emergency Cancel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Emergency Cancel Match
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Match ID" type="number" value={matchIdCancel} onChange={e => setMatchIdCancel(e.target.value)} />
          <TxButton
            label="Cancel Match (Emergency)"
            icon={AlertTriangle}
            contractAddress={contractAddress}
            abi={PUDGY_CHICKEN_FIGHT_ABI}
            functionName="emergencyCancelStuckMatch"
            args={[BigInt(matchIdCancel || "0")]}
            disabled={!matchIdCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function EggCoinSection({ contractAddress }: { contractAddress: Address | null }) {
  const [mintTo, setMintTo] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawToken, setWithdrawToken] = useState("");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Egg className="h-5 w-5 text-amber-500" />
            Admin Mint EggCoin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Endereço do destinatário (0x...)" value={mintTo} onChange={e => setMintTo(e.target.value)} />
          <Input placeholder="Amount (em EggCoins)" type="number" value={mintAmount} onChange={e => setMintAmount(e.target.value)} />
          <TxButton
            label="Mint EggCoin"
            icon={Egg}
            contractAddress={contractAddress}
            abi={EGG_COIN_ABI}
            functionName="adminMint"
            args={[mintTo as Address, parseEther(mintAmount || "0")]}
            disabled={!mintTo || !mintAmount}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-emerald-500" />
            Withdraw (EggCoin contract)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Token address (0x... ou ETH: 0x0...)" value={withdrawToken} onChange={e => setWithdrawToken(e.target.value)} />
          <Input placeholder="Amount (em unidades do token)" type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
          <TxButton
            label="Withdraw"
            icon={ArrowDownToLine}
            contractAddress={contractAddress}
            abi={EGG_COIN_ABI}
            functionName="withdraw"
            args={[parseUnits(withdrawAmount || "0", 18), withdrawToken as Address]}
            disabled={!withdrawToken || !withdrawAmount}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Admin Page
// ---------------------------------------------------------------------------
const Admin = () => {
  const { address, isConnected, chainId } = useAccount();
  const { isAdmin, isChecking, roles } = useAdminCheck();
  const adminEnv = isKnownAdminWallet(address);

  const collectionAddr = chainId ? getPudgyChickenCollectionAddress(chainId) : null;
  const managerAddr = chainId ? getManagerFarmAddress(chainId) : null;
  const fightAddr = chainId ? getFightAddress(chainId) : null;
  const eggCoinAddr = chainId ? getEggCoinAddress(chainId) : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Title */}
          <div className="text-center mb-8 space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  Admin Backoffice
                </span>
              </h1>
            </div>
            <p className="text-muted-foreground">
              Painel de administração dos contratos Pudgy Farms
            </p>
            <div className="flex justify-center">
              <NetworkBadge />
            </div>
          </div>

          {/* Gate: Not connected */}
          {!isConnected && (
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8 text-center space-y-4">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
                <h2 className="text-xl font-semibold">Conecte sua carteira</h2>
                <p className="text-sm text-muted-foreground">
                  Conecte a carteira do owner/admin para acessar o painel.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Gate: Checking */}
          {isConnected && isChecking && (
            <div className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Verificando permissões on-chain...</p>
            </div>
          )}

          {/* Gate: Not admin */}
          {isConnected && !isChecking && !isAdmin && (
            <Card className="max-w-md mx-auto border-red-500/30">
              <CardContent className="p-8 text-center space-y-4">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
                <h2 className="text-xl font-semibold text-red-500">Acesso Negado</h2>
                <p className="text-sm text-muted-foreground">
                  A carteira <code className="text-xs bg-muted px-1 py-0.5 rounded">{address?.slice(0, 6)}...{address?.slice(-4)}</code> não possui <code>DEFAULT_ADMIN_ROLE</code> em nenhum contrato.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Admin Panel */}
          {isConnected && !isChecking && isAdmin && (
            <>
              {/* Wallet environment + Role badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                {adminEnv === "dev" && (
                  <Badge className="bg-amber-500 text-white">
                    Wallet DEV (Testnet)
                  </Badge>
                )}
                {adminEnv === "prod" && (
                  <Badge className="bg-emerald-500 text-white">
                    Wallet PROD (Mainnet)
                  </Badge>
                )}
                {adminEnv && isBaseSepolia(chainId) && adminEnv === "prod" && (
                  <Badge variant="outline" className="border-red-500/40 text-red-500">
                    Wallet de PROD na Testnet
                  </Badge>
                )}
                {adminEnv && !isBaseSepolia(chainId) && adminEnv === "dev" && (
                  <Badge variant="outline" className="border-red-500/40 text-red-500">
                    Wallet de DEV na Mainnet
                  </Badge>
                )}
                {roles.collection && <Badge className="bg-primary">Collection Admin</Badge>}
                {roles.manager && <Badge className="bg-blue-500">Manager Admin</Badge>}
                {roles.fight && <Badge className="bg-purple-500">Fight Admin</Badge>}
                {roles.eggCoin && <Badge className="bg-amber-500">EggCoin Admin</Badge>}
              </div>

              {/* Contract addresses */}
              <Alert className="mb-8 bg-muted/50">
                <AlertDescription className="text-xs font-mono space-y-1">
                  {collectionAddr && <div><span className="text-muted-foreground">Collection:</span> {collectionAddr}</div>}
                  {managerAddr && <div><span className="text-muted-foreground">Manager:</span> {managerAddr}</div>}
                  {fightAddr && <div><span className="text-muted-foreground">Fight:</span> {fightAddr}</div>}
                  {eggCoinAddr && <div><span className="text-muted-foreground">EggCoin:</span> {eggCoinAddr}</div>}
                </AlertDescription>
              </Alert>

              <Tabs defaultValue="collection" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="collection" disabled={!roles.collection}>
                    <Package className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Collection</span>
                  </TabsTrigger>
                  <TabsTrigger value="manager" disabled={!roles.manager}>
                    <Settings className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Manager</span>
                  </TabsTrigger>
                  <TabsTrigger value="fight" disabled={!roles.fight}>
                    <Swords className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Fight</span>
                  </TabsTrigger>
                  <TabsTrigger value="eggcoin" disabled={!roles.eggCoin}>
                    <Egg className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">EggCoin</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="collection">
                  <CollectionSection contractAddress={collectionAddr} />
                </TabsContent>

                <TabsContent value="manager">
                  <ManagerSection contractAddress={managerAddr} />
                </TabsContent>

                <TabsContent value="fight">
                  <FightSection contractAddress={fightAddr} />
                </TabsContent>

                <TabsContent value="eggcoin">
                  <EggCoinSection contractAddress={eggCoinAddr} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Admin;
