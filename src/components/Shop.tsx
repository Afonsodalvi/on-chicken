import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Importando as imagens das galinhas (12 em diante)
import chicken12 from "@/assets/12.png";
import chicken13 from "@/assets/13.png";
import chicken14 from "@/assets/14.png";
import chicken15 from "@/assets/15.png";
import chicken16 from "@/assets/16.png";
import chicken17 from "@/assets/17.png";
import chicken18 from "@/assets/18.png";
import chicken19 from "@/assets/19.png";
import chicken20 from "@/assets/20.png";
import chicken21 from "@/assets/21.png";
import chicken22 from "@/assets/22.png";
import chicken23 from "@/assets/23.png";

export const Shop = () => {
  const { t } = useLanguage();
  const products = [
    {
      id: 1,
      name: "Pudgy Chicken #012",
      price: "$20",
      originalPrice: "$25",
      rating: 4.8,
      reviews: 1247,
      image: chicken12,
      badge: "Mais Vendido",
      rarity: "Comum",
    },
    {
      id: 2,
      name: "Pudgy Chicken #013",
      price: "$25",
      originalPrice: "$30",
      rating: 4.9,
      reviews: 856,
      image: chicken13,
      badge: "Novo",
      rarity: "Comum",
    },
    {
      id: 3,
      name: "Pudgy Chicken #014",
      price: "$30",
      originalPrice: "$35",
      rating: 4.7,
      reviews: 623,
      image: chicken14,
      badge: "Limitado",
      rarity: "Raro",
    },
    {
      id: 4,
      name: "Pudgy Chicken #015",
      price: "$35",
      originalPrice: "$40",
      rating: 4.9,
      reviews: 892,
      image: chicken15,
      badge: "Popular",
      rarity: "Raro",
    },
    {
      id: 5,
      name: "Pudgy Chicken #016",
      price: "$40",
      originalPrice: "$45",
      rating: 4.8,
      reviews: 756,
      image: chicken16,
      badge: "Exclusivo",
      rarity: "Épico",
    },
    {
      id: 6,
      name: "Pudgy Chicken #017",
      price: "$45",
      originalPrice: "$50",
      rating: 5.0,
      reviews: 445,
      image: chicken17,
      badge: "Lendário",
      rarity: "Lendário",
    },
    {
      id: 7,
      name: "Pudgy Chicken #018",
      price: "$50",
      originalPrice: "$55",
      rating: 4.9,
      reviews: 334,
      image: chicken18,
      badge: "Mítico",
      rarity: "Mítico",
    },
    {
      id: 8,
      name: "Pudgy Chicken #019",
      price: "$55",
      originalPrice: "$60",
      rating: 4.8,
      reviews: 278,
      image: chicken19,
      badge: "Único",
      rarity: "Mítico",
    },
    {
      id: 9,
      name: "Pudgy Chicken #020",
      price: "$60",
      originalPrice: "$65",
      rating: 5.0,
      reviews: 156,
      image: chicken20,
      badge: "Legendário",
      rarity: "Legendário",
    },
    {
      id: 10,
      name: "Pudgy Chicken #021",
      price: "$65",
      originalPrice: "$70",
      rating: 4.9,
      reviews: 234,
      image: chicken21,
      badge: "Raro",
      rarity: "Legendário",
    },
    {
      id: 11,
      name: "Pudgy Chicken #022",
      price: "$70",
      originalPrice: "$75",
      rating: 5.0,
      reviews: 189,
      image: chicken22,
      badge: "Épico",
      rarity: "Mítico",
    },
    {
      id: 12,
      name: "Pudgy Chicken #023",
      price: "$75",
      originalPrice: "$80",
      rating: 5.0,
      reviews: 98,
      image: chicken23,
      badge: "Único",
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
          <h2 className="text-4xl md:text-6xl font-semibold font-display">
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              {t('shop.title')}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('shop.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {products.map((product, index) => (
            <Card 
              key={product.id} 
              className="surface hover:shadow-lg transition-all duration-300 group overflow-hidden"
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
                        ({product.reviews} {t('shop.reviews')})
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
                      {t('shop.buy')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" variant="outline" className="border-border hover:bg-secondary">
            {t('shop.viewAll')}
          </Button>
        </div>
      </div>
    </section>
  );
};