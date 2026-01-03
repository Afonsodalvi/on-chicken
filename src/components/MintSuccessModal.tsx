import React from "react";
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
import { Trophy, Zap, Heart, Wind, Volume2, Shield, CheckCircle, Sparkles, X } from "lucide-react";

interface InstanceMintedData {
  owner: string;
  tokenId: bigint;
  instanceId: bigint;
  instanceIndex: bigint;
  power: bigint;
  speed: bigint;
  health: bigint;
  clucking: bigint;
  broodPower: bigint;
}

interface MintSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceData: InstanceMintedData | null;
  tokenImage?: string;
  tokenName?: string;
}

export const MintSuccessModal: React.FC<MintSuccessModalProps> = ({
  open,
  onOpenChange,
  instanceData,
  tokenImage,
  tokenName,
}) => {
  if (!instanceData) return null;

  const skills = [
    { name: "Power", value: instanceData.power, icon: Zap, color: "text-yellow-500" },
    { name: "Speed", value: instanceData.speed, icon: Wind, color: "text-blue-500" },
    { name: "Health", value: instanceData.health, icon: Heart, color: "text-red-500" },
    { name: "Clucking", value: instanceData.clucking, icon: Volume2, color: "text-purple-500" },
    { name: "Brood Power", value: instanceData.broodPower, icon: Shield, color: "text-green-500" },
  ];

  const totalStats = Number(instanceData.power) + Number(instanceData.speed) + Number(instanceData.health) + Number(instanceData.clucking) + Number(instanceData.broodPower);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <div className="absolute top-0 right-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 dark:from-green-500 dark:to-green-700 rounded-full shadow-lg">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 animate-pulse">
                <Sparkles className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
            <div>
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                NFT Mintado com Sucesso! 🎉
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                Seu colecionável foi criado e está pronto para batalhas
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Token Info - Card Principal */}
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/30 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {tokenImage && (
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                    <img
                      src={tokenImage}
                      alt={tokenName || "NFT"}
                      className="relative w-32 h-32 md:w-40 md:h-40 rounded-xl object-cover border-4 border-background shadow-2xl"
                    />
                  </div>
                )}
                <div className="flex-1 text-center md:text-left space-y-4">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold mb-2">
                      {tokenName || `Token #${instanceData.tokenId.toString()}`}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Colecionável único com skills especiais
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start items-center">
                    <Badge variant="secondary" className="px-4 py-1.5 text-sm font-semibold">
                      Token #{instanceData.tokenId.toString()}
                    </Badge>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary/30 rounded-full">
                      <span className="text-xs font-medium text-muted-foreground">Instance Index:</span>
                      <span className="text-lg font-bold text-primary">#{instanceData.instanceIndex.toString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills Stats - Seção Melhorada */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                Skills do Colecionável
              </h3>
              <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1.5 text-sm font-semibold shadow-md">
                Total: {totalStats} pts
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map((skill) => {
                const Icon = skill.icon;
                const value = Number(skill.value);
                const percentage = totalStats > 0 ? (value / totalStats) * 100 : 0;
                const maxValue = Math.max(...skills.map(s => Number(s.value)));
                const skillPercentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                
                return (
                  <Card key={skill.name} className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${skill.color.replace('text-', 'from-')}/20 ${skill.color.replace('text-', 'to-')}/10`}>
                            <Icon className={`h-5 w-5 ${skill.color}`} />
                          </div>
                          <span className="font-semibold text-sm">{skill.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold">{value}</span>
                          <span className="text-xs text-muted-foreground">/ {maxValue}</span>
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${skill.color.replace('text-', 'from-')} ${skill.color.replace('text-', 'to-')} transition-all duration-500 shadow-sm`}
                            style={{ width: `${skillPercentage}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Instance Info - Card Detalhado */}
          <Card className="bg-gradient-to-br from-muted/50 to-muted/30 border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-1 w-8 bg-primary rounded-full"></div>
                <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Detalhes da Instância
                </h4>
              </div>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-background/50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Trophy className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Instance Index</p>
                      <p className="text-2xl font-bold text-primary">#{instanceData.instanceIndex.toString()}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="w-fit">
                    Token #{instanceData.tokenId.toString()}
                  </Badge>
                </div>
                <div className="p-4 bg-background/50 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-2">Owner Address</p>
                  <p className="font-mono text-xs break-all bg-background p-3 rounded border">
                    {instanceData.owner}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão de Fechar */}
          <div className="flex justify-center pt-4 border-t">
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full md:w-auto min-w-[200px]"
              size="lg"
              variant="default"
            >
              Continuar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

