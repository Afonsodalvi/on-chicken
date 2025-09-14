import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import logoImage from "@/assets/logo.png";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img 
            src={logoImage} 
            alt="Pudgy Farms Logo" 
            className="w-10 h-10 object-contain"
          />
          <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Pudgy Farms
          </span>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-foreground hover:text-primary transition-colors">
            Home
          </Link>
          <a href="#collection" className="text-foreground hover:text-primary transition-colors">
            Coleção
          </a>
          <a href="#shop" className="text-foreground hover:text-primary transition-colors">
            Loja
          </a>
          <Link to="/battle" className="text-foreground hover:text-primary transition-colors">
            Batalha
          </Link>
          <Link to="/farm" className="text-foreground hover:text-primary transition-colors">
            Farm
          </Link>
          <a href="#community" className="text-foreground hover:text-primary transition-colors">
            Comunidade
          </a>
          <Button variant="default" size="sm" className="bg-gradient-hero text-primary-foreground">
            Conectar Carteira
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
        <div className="md:hidden bg-background border-b border-border animate-slide-up">
          <nav className="container mx-auto px-4 py-4 space-y-4">
            <Link to="/" className="block text-foreground hover:text-primary transition-colors">
              Home
            </Link>
            <a href="#collection" className="block text-foreground hover:text-primary transition-colors">
              Coleção
            </a>
            <a href="#shop" className="block text-foreground hover:text-primary transition-colors">
              Loja
            </a>
            <Link to="/battle" className="block text-foreground hover:text-primary transition-colors">
              Batalha
            </Link>
            <Link to="/farm" className="block text-foreground hover:text-primary transition-colors">
              Farm
            </Link>
            <a href="#community" className="block text-foreground hover:text-primary transition-colors">
              Comunidade
            </a>
            <Button variant="default" size="sm" className="w-full bg-gradient-hero text-primary-foreground">
              Conectar Carteira
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};