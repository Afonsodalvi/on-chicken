import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Twitter, Instagram, Youtube, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import farmLogo from "@/assets/futuristic_farm_logo_embedded.svg";

export const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer className="relative surface">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={farmLogo} alt="Pudgy Farms" className="w-8 h-8" />
              <span className="text-xl font-semibold font-display bg-gradient-hero bg-clip-text text-transparent">Pudgy Farms</span>
            </div>
            <p className="text-muted-foreground">
              {t('footer.description')}
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="sm" className="p-2 hover:bg-white/5">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-white/5">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-white/5">
                <Youtube className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-white/5">
                <MessageCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold tracking-wide uppercase text-foreground/90">{t('footer.collections')}</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pudgy Chickens
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Lil Chicks
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Premium Roosters
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Raridades
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold tracking-wide uppercase text-foreground/90">{t('footer.shop')}</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Brinquedos
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Roupas
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Acessórios
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  Arte Digital
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold tracking-wide uppercase text-foreground/90">{t('footer.newsletter')}</h3>
            <p className="text-muted-foreground text-sm">
              {t('footer.newsletter.subtitle')}
            </p>
            <div className="space-y-2">
              <Input
                placeholder={t('footer.newsletter.email')}
                className="bg-secondary/40 border-border focus-visible:ring-primary"
              />
              <Button className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90">
                {t('footer.newsletter.subscribe')}
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {t('footer.copyright')}
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              {t('footer.links.terms')}
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              {t('footer.links.privacy')}
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              {t('footer.links.support')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};