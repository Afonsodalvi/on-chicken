import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import farmLogo from "@/assets/futuristic_farm_logo_embedded.svg";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <header className="fixed top-0 w-full z-50 glass">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={farmLogo}
            alt="Pudgy Farms Logo"
            className="w-9 h-9 object-contain"
          />
          <span className="text-xl font-semibold font-display tracking-tight bg-gradient-hero bg-clip-text text-transparent">
            Pudgy Farms
          </span>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-6 text-sm uppercase tracking-wide">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-[1px] after:w-0 after:bg-gradient-to-r after:from-primary/60 after:to-accent/60 hover:after:w-full after:transition-all">
            {t('nav.home')}
          </Link>
          <a href="#collection" className="text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-[1px] after:w-0 after:bg-gradient-to-r after:from-primary/60 after:to-accent/60 hover:after:w-full after:transition-all">
            {t('nav.collection')}
          </a>
          <a href="#shop" className="text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-[1px] after:w-0 after:bg-gradient-to-r after:from-primary/60 after:to-accent/60 hover:after:w-full after:transition-all">
            {t('nav.shop')}
          </a>
          <Link to="/battle" className="text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-[1px] after:w-0 after:bg-gradient-to-r after:from-primary/60 after:to-accent/60 hover:after:w-full after:transition-all">
            {t('nav.battle')}
          </Link>
          <Link to="/farm" className="text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-[1px] after:w-0 after:bg-gradient-to-r after:from-primary/60 after:to-accent/60 hover:after:w-full after:transition-all">
            {t('nav.farm')}
          </Link>
          <a href="#community" className="text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-[1px] after:w-0 after:bg-gradient-to-r after:from-primary/60 after:to-accent/60 hover:after:w-full after:transition-all">
            {t('nav.community')}
          </a>
          <LanguageSelector />
          <Button variant="default" size="sm" className="bg-gradient-hero text-primary-foreground hover:opacity-90">
            {t('nav.connect')}
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden glass border-t border-border animate-slide-up">
          <nav className="container mx-auto px-4 py-4 space-y-4">
            <Link to="/" className="block text-foreground/90 hover:text-foreground transition-colors">
              {t('nav.home')}
            </Link>
            <a href="#collection" className="block text-foreground/90 hover:text-foreground transition-colors">
              {t('nav.collection')}
            </a>
            <a href="#shop" className="block text-foreground/90 hover:text-foreground transition-colors">
              {t('nav.shop')}
            </a>
            <Link to="/battle" className="block text-foreground/90 hover:text-foreground transition-colors">
              {t('nav.battle')}
            </Link>
            <Link to="/farm" className="block text-foreground/90 hover:text-foreground transition-colors">
              {t('nav.farm')}
            </Link>
            <a href="#community" className="block text-foreground/90 hover:text-foreground transition-colors">
              {t('nav.community')}
            </a>
            <div className="flex gap-2">
              <LanguageSelector />
              <Button variant="default" size="sm" className="flex-1 bg-gradient-hero text-primary-foreground hover:opacity-90">
                {t('nav.connect')}
              </Button>
            </div>
          </nav>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </header>
  );
};