import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Twitter, Instagram, Youtube, MessageCircle } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-hero rounded-full animate-glow"></div>
              <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Pudgy Chickens
              </span>
            </div>
            <p className="text-muted-foreground">
              Uma plataforma nascida na web3 que promove sustentabilidade, 
              inovação agrícola e comunidade através da tokenização de galinhas.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm" className="p-2">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <Youtube className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <MessageCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Coleções</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Pudgy Chickens
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Lil Chicks
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Premium Roosters
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Raridades
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Loja</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Brinquedos
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Roupas
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Acessórios
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Arte Digital
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Newsletter</h3>
            <p className="text-muted-foreground text-sm">
              Receba as últimas novidades sobre agricultura digital e drops exclusivos.
            </p>
            <div className="space-y-2">
              <Input 
                placeholder="Seu email" 
                className="bg-secondary border-border"
              />
              <Button className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90">
                Inscrever-se
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2024 Pudgy Chickens. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Política de Privacidade
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Suporte
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};