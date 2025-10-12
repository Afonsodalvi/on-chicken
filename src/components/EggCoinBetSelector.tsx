import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Coins, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface EggCoinBetSelectorProps {
  onBetChange: (amount: number | null) => void;
  maxAmount?: number;
  disabled?: boolean;
}

export const EggCoinBetSelector = ({ 
  onBetChange, 
  maxAmount = 1000, 
  disabled = false 
}: EggCoinBetSelectorProps) => {
  const { t } = useLanguage();
  const [isBettingEnabled, setIsBettingEnabled] = useState(false);
  const [betAmount, setBetAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>("");

  const handleToggleBetting = (enabled: boolean) => {
    setIsBettingEnabled(enabled);
    if (!enabled) {
      setBetAmount(0);
      setCustomAmount("");
      onBetChange(null);
    }
  };

  const handleAmountChange = (amount: number) => {
    setBetAmount(amount);
    setCustomAmount("");
    onBetChange(amount);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setBetAmount(numValue);
      onBetChange(numValue);
    }
  };

  const presetAmounts = [10, 25, 50, 100, 250, 500];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{t('battle.betting.title')}</h3>
            </div>
            <Switch
              checked={isBettingEnabled}
              onCheckedChange={handleToggleBetting}
              disabled={disabled}
            />
          </div>

          {isBettingEnabled && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {t('battle.betting.description')}
              </div>

              {/* Preset Amounts */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('battle.betting.preset')}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {presetAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant={betAmount === amount ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAmountChange(amount)}
                      disabled={disabled}
                      className="text-xs"
                    >
                      {amount} 🥚
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="space-y-2">
                <Label htmlFor="custom-amount" className="text-sm font-medium">
                  {t('battle.betting.custom')}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="custom-amount"
                    type="number"
                    placeholder="0"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    disabled={disabled}
                    min="1"
                    max={maxAmount}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">🥚</span>
                </div>
              </div>

              {/* Current Bet Display */}
              {betAmount > 0 && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <Zap className="h-4 w-4" />
                    <span>{t('battle.betting.current')}: {betAmount} 🥚</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t('battle.betting.reward')}: {betAmount * 2} 🥚
                  </div>
                </div>
              )}

              {/* Max Amount Warning */}
              {betAmount > maxAmount && (
                <div className="text-xs text-destructive">
                  {t('battle.betting.maxWarning', { max: maxAmount })}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
