import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import farmLogo from "@/assets/futuristic_farm_logo_embedded.svg";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ConnectWallet } from "@/components/ConnectWallet";
import { EggCoinButton } from "@/components/EggCoinButton";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/");
    setIsMenuOpen(false); // Close mobile menu if open
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHomeClick = () => {
    navigate("/");
    setIsMenuOpen(false); // Close mobile menu if open
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 w-full z-50 glass">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <button 
          onClick={handleLogoClick}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <img
            src={farmLogo}
            alt="Pudgy Farms Logo"
            className="w-9 h-9 object-contain"
          />
          <span className="text-xl font-semibold font-display tracking-tight bg-gradient-hero bg-clip-text text-transparent">
            Pudgy Farms
          </span>
        </button>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-6 text-sm uppercase tracking-wide">
          <button 
            onClick={handleHomeClick}
            className="text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-[1px] after:w-0 after:bg-gradient-to-r after:from-primary/60 after:to-accent/60 hover:after:w-full after:transition-all uppercase tracking-wide"
          >
            {t('nav.home')}
          </button>
          <a href="#collection" className="text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-[1px] after:w-0 after:bg-gradient-to-r after:from-primary/60 after:to-accent/60 hover:after:w-full after:transition-all uppercase tracking-wide">
            {t('nav.collection')}
          </a>
          <a href="#shop" className="text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-[1px] after:w-0 after:bg-gradient-to-r after:from-primary/60 after:to-accent/60 hover:after:w-full after:transition-all uppercase tracking-wide">
            {t('nav.shop')}
          </a>
          <Link to="/battle" className="text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-[1px] after:w-0 after:bg-gradient-to-r after:from-primary/60 after:to-accent/60 hover:after:w-full after:transition-all uppercase tracking-wide">
            {t('nav.battle')}
          </Link>
          <Link to="/farm" className="text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-[1px] after:w-0 after:bg-gradient-to-r after:from-primary/60 after:to-accent/60 hover:after:w-full after:transition-all uppercase tracking-wide">
            {t('nav.farm')}
          </Link>
          <Link to="/whitelist" className="text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-[1px] after:w-0 after:bg-gradient-to-r after:from-primary/60 after:to-accent/60 hover:after:w-full after:transition-all uppercase tracking-wide">
            {t('nav.whitelist')}
          </Link>
          <a href="#community" className="text-muted-foreground hover:text-foreground transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-[1px] after:w-0 after:bg-gradient-to-r after:from-primary/60 after:to-accent/60 hover:after:w-full after:transition-all uppercase tracking-wide">
            {t('nav.community')}
          </a>
          <div className="flex items-center gap-3">
            <EggCoinButton size="sm" />
            <LanguageSelector />
            <ConnectWallet size="sm" />
          </div>
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
            <button 
              onClick={handleHomeClick}
              className="block text-foreground/90 hover:text-foreground transition-colors w-full text-left uppercase tracking-wide"
            >
              {t('nav.home')}
            </button>
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
            <Link to="/whitelist" className="block text-foreground/90 hover:text-foreground transition-colors">
              {t('nav.whitelist')}
            </Link>
            <a href="#community" className="block text-foreground/90 hover:text-foreground transition-colors">
              {t('nav.community')}
            </a>
            <div className="flex gap-2">
              <EggCoinButton size="sm" className="flex-1" />
              <LanguageSelector />
              <ConnectWallet size="sm" className="flex-1" />
            </div>
          </nav>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </header>
  );
};
