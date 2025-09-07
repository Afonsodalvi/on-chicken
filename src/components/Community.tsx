import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, Trophy, Heart } from "lucide-react";

export const Community = () => {
  const stats = [
    {
      icon: Users,
      number: "25K+",
      label: "Fazendeiros Ativos",
      description: "Uma comunidade global de agricultores digitais",
    },
    {
      icon: MessageCircle,
      number: "500K+",
      label: "Mensagens/Mês",
      description: "Conversas sobre agricultura sustentável",
    },
    {
      icon: Trophy,
      number: "50+",
      label: "Eventos",
      description: "Workshops e conferências sobre tokenização",
    },
    {
      icon: Heart,
      number: "∞",
      label: "Sustentabilidade",
      description: "Promovendo agricultura responsável",
    },
  ];

  return (
    <section id="community" className="py-20 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-6xl font-bold">
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              A Comunidade
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Junte-se à família Pudgy Chicken. Um lugar onde a tecnologia encontra a agricultura, 
            criando um futuro mais sustentável para todos!
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className="bg-gradient-card border-border hover:shadow-lg transition-all duration-300 text-center group"
            >
              <CardContent className="p-6 space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">{stat.number}</div>
                  <div className="font-semibold mb-2">{stat.label}</div>
                  <div className="text-sm text-muted-foreground">{stat.description}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl font-bold">Inove, Participe e Cultive</h3>
            <p className="text-muted-foreground text-lg">
              A comunidade Pudgy Chickens é mais do que apenas holders de NFT. 
              Somos uma família global unidos pela sustentabilidade, inovação agrícola e o poder da tecnologia blockchain.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Acesso exclusivo a workshops de agricultura</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Participe de decisões da comunidade</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Colabore em projetos sustentáveis</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Conecte-se com fazendeiros do mundo todo</span>
              </li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-gradient-hero text-primary-foreground hover:opacity-90">
                Entrar no Discord
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                Seguir no Twitter
              </Button>
            </div>
          </div>

          <div className="relative">
            <Card className="bg-gradient-card border-border p-8">
              <CardContent className="p-0 space-y-6">
                <div className="text-center">
                  <h4 className="text-2xl font-bold mb-2">Pudgy Media</h4>
                  <p className="text-muted-foreground">
                    Acompanhe as últimas novidades, inovações agrícolas e conteúdo exclusivo.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg">
                    <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center text-primary-foreground font-bold">
                      P
                    </div>
                    <div>
                      <div className="font-semibold">Novo sistema de tokenização!</div>
                      <div className="text-sm text-muted-foreground">Há 2 horas</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg">
                    <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center text-primary-foreground font-bold">
                      L
                    </div>
                    <div>
                      <div className="font-semibold">Workshop de agricultura sustentável</div>
                      <div className="text-sm text-muted-foreground">Há 5 horas</div>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90">
                  Ver Pudgy Media
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};