import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Twitter, Instagram, Youtube, MessageCircle, CheckCircle, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { subscribeToDevelopmentCourse } from "@/services/supabase";
import { toast } from "sonner";
import farmLogo from "@/assets/futuristic_farm_logo_embedded.svg";
import omnesLogo from "@/assets/logo omnes.svg";

export const Footer = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Por favor, insira um email válido");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await subscribeToDevelopmentCourse(email);
      
      if (result.success) {
        setIsSubscribed(true);
        setEmail("");
        toast.success("Inscrição realizada com sucesso! Você receberá informações sobre o curso.");
      } else {
        toast.error(result.error || "Erro ao se inscrever no curso");
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      toast.error("Erro inesperado ao se inscrever no curso");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <footer className="relative surface">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src={farmLogo} alt="Pudgy Farms" className="w-8 h-8" />
              <span className="text-xl font-semibold font-display bg-gradient-hero bg-clip-text text-transparent">Pudgy Farms</span>
            </div>
            <p className="text-muted-foreground">
              {t('footer.description')}
            </p>
            <div className="flex space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 hover:bg-white/5"
                asChild
              >
                <a 
                  href="https://www.instagram.com/afonsod.eth/?hl=en" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 hover:bg-white/5"
                asChild
              >
                <a 
                  href="https://www.linkedin.com/in/afonso-dalvi-711635112/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 hover:bg-white/5"
                asChild
              >
                <a 
                  href="https://www.youtube.com/@OmnesTech" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                >
                  <Youtube className="h-5 w-5" />
                </a>
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
            <h3 className="text-lg font-semibold tracking-wide uppercase text-foreground/90">{t('footer.newsletter')}</h3>
            <p className="text-muted-foreground text-sm">
              {t('footer.newsletter.subtitle')}
            </p>
            
            {isSubscribed ? (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-600 font-medium">
                  Inscrito com sucesso!
                </span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <Input
                  type="email"
                  placeholder={t('footer.newsletter.email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary/40 border-border focus-visible:ring-primary"
                  required
                />
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Inscrivendo...
                    </div>
                  ) : (
                    t('footer.newsletter.subscribe')
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Projeto Omnes */}
        <div className="border-t border-border pt-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img src={omnesLogo} alt="Omnes" className="w-12 h-12" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">{t('footer.omnes.developedBy')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('footer.omnes.description')}
                </p>
                <a 
                  href="https://omnes.dev" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                >
                  Visite omnes.dev →
                </a>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-2">
                {t('footer.omnes.educational')}
              </p>
              <a 
                href="https://br.cointelegraph.com/news/brazilian-tokenizes-chicken-coop-and-pays-holders-with-the-sale-of-eggs-and-chickens" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors text-sm font-medium"
              >
                Veja nosso galinheiro →
              </a>
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