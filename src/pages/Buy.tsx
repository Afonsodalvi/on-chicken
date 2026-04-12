import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PixBuyFlow } from "@/components/pix/PixBuyFlow";
import { useLanguage } from "@/contexts/LanguageContext";

const Buy = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            {t("pix.title")}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            {t("pix.subtitle")}
          </p>
        </div>

        <PixBuyFlow />
      </main>
      <Footer />
    </div>
  );
};

export default Buy;
