import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star } from "lucide-react";

// Importando as imagens das galinhas
import chicken1 from "@/assets/1.png";
import chicken3 from "@/assets/3.png";
import chicken4 from "@/assets/4.png";
import chicken6 from "@/assets/6.png";
import chicken7 from "@/assets/7.png";
import chicken9 from "@/assets/9.png";
import chicken10 from "@/assets/10.png";
import chicken11 from "@/assets/11.png";
import chicken12 from "@/assets/12.png";

export const Shop = () => {
  const products = [
    {
      id: 1,
      name: "Pudgy Chicken #001",
      price: "$20",
      originalPrice: "$25",
      rating: 4.8,
      reviews: 1247,
      image: chicken1,
      badge: "Mais Vendido",
      rarity: "Comum",
    },
    {
      id: 2,
      name: "Pudgy Chicken #002",
      price: "$25",
      originalPrice: "$30",
      rating: 4.9,
      reviews: 856,
      image: chicken3,
      badge: "Novo",
      rarity: "Comum",
    },
    {
      id: 3,
      name: "Pudgy Chicken #003",
      price: "$30",
      originalPrice: "$35",
      rating: 4.7,
      reviews: 623,
      image: chicken4,
      badge: "Limitado",
      rarity: "Raro",
    },
    {
      id: 4,
      name: "Pudgy Chicken #004",
      price: "$35",
      originalPrice: "$40",
      rating: 4.9,
      reviews: 892,
      image: chicken6,
      badge: "Popular",
      rarity: "Raro",
    },
    {
      id: 5,
      name: "Pudgy Chicken #005",
      price: "$40",
      originalPrice: "$45",
      rating: 4.8,
      reviews: 756,
      image: chicken7,
      badge: "Exclusivo",
      rarity: "Épico",
    },
    {
      id: 6,
      name: "Pudgy Chicken #006",
      price: "$45",
      originalPrice: "$50",
      rating: 5.0,
      reviews: 445,
      image: chicken9,
      badge: "Lendário",
      rarity: "Lendário",
    },
    {
      id: 7,
      name: "Pudgy Chicken #007",
      price: "$50",
      originalPrice: "$55",
      rating: 4.9,
      reviews: 334,
      image: chicken10,
      badge: "Mítico",
      rarity: "Mítico",
    },
    {
      id: 8,
      name: "Pudgy Chicken #008",
      price: "$55",
      originalPrice: "$60",
      rating: 4.8,
      reviews: 278,
      image: chicken11,
      badge: "Único",
      rarity: "Mítico",
    },
    {
      id: 9,
      name: "Pudgy Chicken #009",
      price: "$60",
      originalPrice: "$65",
      rating: 5.0,
      reviews: 156,
      image: chicken12,
      badge: "Legendário",
      rarity: "Legendário",
    },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Comum":
        return "bg-gray-500 text-white";
      case "Raro":
        return "bg-blue-500 text-white";
      case "Épico":
        return "bg-purple-500 text-white";
      case "Lendário":
        return "bg-orange-500 text-white";
      case "Mítico":
        return "bg-pink-500 text-white";
      case "Legendário":
        return "bg-gradient-hero text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <section id="shop" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-6xl font-bold">
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Loja de Ativos
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Colecione galinhas únicas tokenizadas. Cada ativo é único e possui 
            raridade e características especiais. Comece sua coleção hoje!
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {products.map((product, index) => (
            <Card 
              key={product.id} 
              className="bg-gradient-card border-border hover:shadow-lg transition-all duration-300 group overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="relative overflow-hidden bg-secondary/30">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <Badge 
                      className={`${
                        product.badge === "Mais Vendido" 
                          ? "bg-penguin-orange text-white" 
                          : product.badge === "Novo"
                          ? "bg-primary text-primary-foreground"
                          : product.badge === "Limitado"
                          ? "bg-destructive text-destructive-foreground"
                          : product.badge === "Popular"
                          ? "bg-blue-500 text-white"
                          : product.badge === "Exclusivo"
                          ? "bg-purple-500 text-white"
                          : product.badge === "Lendário"
                          ? "bg-orange-500 text-white"
                          : product.badge === "Mítico"
                          ? "bg-pink-500 text-white"
                          : product.badge === "Único"
                          ? "bg-indigo-500 text-white"
                          : "bg-gradient-hero text-white"
                      }`}
                    >
                      {product.badge}
                    </Badge>
                    <Badge className={getRarityColor(product.rarity)}>
                      {product.rarity}
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary" className="rounded-full p-2">
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-penguin-orange text-penguin-orange" />
                        <span className="ml-1 text-sm font-medium">{product.rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({product.reviews} avaliações)
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-primary">{product.price}</div>
                      <div className="text-sm text-muted-foreground line-through">
                        {product.originalPrice}
                      </div>
                    </div>
                    <Button className="bg-gradient-hero text-primary-foreground hover:opacity-90">
                      Comprar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
            Ver Todos os Ativos
          </Button>
        </div>
      </div>
    </section>
  );
};