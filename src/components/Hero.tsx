import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import heroChicken from "@/assets/1.png";

export const Hero = () => {
  return (
    <section id="home" className="min-h-screen pt-16 flex items-center justify-center overflow-hidden">
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-slide-up">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  Pudgy Farms
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl">
                O primeiro protocolo de tokenização de RWAnimals (Real World Animals). 
                Começamos com as <strong>Pudgy Chickens</strong> e agora tokenizamos todos os animais da fazenda, 
                revolucionando a agricultura digital mundial.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-gradient-hero text-primary-foreground hover:opacity-90 transition-opacity">
                Tokenizar RWAnimals
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="border-border hover:bg-secondary">
                <Play className="mr-2 h-5 w-5" />
                Ver Pudgy Chickens
              </Button>
            </div>

            <div className="flex items-center gap-8 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">10,000</div>
                <div className="text-muted-foreground">Pudgy Chickens</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">25K+</div>
                <div className="text-muted-foreground">RWAnimals Tokenizados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">50+</div>
                <div className="text-muted-foreground">Fazendas Globais</div>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-hero rounded-full blur-3xl opacity-20 animate-glow"></div>
              <img
                src={heroChicken}
                alt="Pudgy Farms Hero"
                className="relative z-10 w-full max-w-md lg:max-w-lg animate-float drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};