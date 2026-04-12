import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface PixEmailFormProps {
  onSubmit: (data: { email: string; cpf: string }) => void;
  onBack: () => void;
  isLoading: boolean;
}

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === parseInt(cleaned[10]);
}

export const PixEmailForm: React.FC<PixEmailFormProps> = ({ onSubmit, onBack, isLoading }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [errors, setErrors] = useState<{ email?: string; cpf?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; cpf?: string } = {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t("pix.invalidEmail");
    }
    if (!cpf || !validateCPF(cpf)) {
      newErrors.cpf = t("pix.invalidCpf");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit({ email, cpf: cpf.replace(/\D/g, "") });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-center">{t("pix.enterDetails")}</h3>

      <div className="space-y-2">
        <Label htmlFor="pix-email">{t("pix.email")}</Label>
        <Input
          id="pix-email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={errors.email ? "border-destructive" : ""}
          autoComplete="email"
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        <p className="text-xs text-muted-foreground">{t("pix.emailHint")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pix-cpf">{t("pix.cpf")}</Label>
        <Input
          id="pix-cpf"
          type="text"
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => setCpf(formatCPF(e.target.value))}
          className={errors.cpf ? "border-destructive" : ""}
          maxLength={14}
        />
        {errors.cpf && <p className="text-xs text-destructive">{errors.cpf}</p>}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("pix.back")}
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1 bg-gradient-hero">
          {t("pix.continue")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};
