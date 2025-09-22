import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FarmCollection } from "@/components/FarmCollection";
import { FarmTokenization } from "@/components/FarmTokenization";
import { useLanguage } from "@/contexts/LanguageContext";

export const Farm = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"create" | "tokenize">("create");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/10">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-6">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-background/50 rounded-full p-4 shadow-lg">
                  <img 
                    src="/farm-logo.svg" 
                    alt="Farm Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold">
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  {t('farm.title')}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('farm.subtitle')}
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-12">
              <div className="bg-muted/50 p-1 rounded-lg flex gap-2">
                <button
                  onClick={() => setActiveTab("create")}
                  className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                    activeTab === "create"
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t('farm.tokenize')}
                </button>
                <button
                  onClick={() => setActiveTab("tokenize")}
                  className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                    activeTab === "tokenize"
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t('farm.create')}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-4xl mx-auto">
              {activeTab === "create" ? <FarmCollection /> : <FarmTokenization />}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
