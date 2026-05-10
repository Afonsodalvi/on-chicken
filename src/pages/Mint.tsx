import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { MintChicken } from "../components/MintChicken";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "../components/ui/button";
import { Header } from "../components/Header";

const Mint: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("whitelist.backToHome")}
            </Button>
          </Link>

          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-3">
              {t("mint.title")}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("mint.selectAndMint")}
            </p>
          </div>

          <div className="flex justify-center">
            <MintChicken />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Mint;
