import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import chickenA from "@/assets/12.png";
import chickenB from "@/assets/14.png";

export const Collection = () => {
  const { t } = useLanguage();
  const collections = [
    {
      name: "Pudgy Chickens",
      description: t('collection.original'),
      items: "10,000",
      floorPrice: "0.5 ETH",
      image: chickenA,
    },
    {
      name: "Lil Chicks",
      description: t('collection.lil'),
      items: "5,000",
      floorPrice: "0.2 ETH",
      image: chickenB,
    },
  ];

  return (
    <section id="collection" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-6xl font-semibold font-display">
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              {t('collection.title')}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('collection.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {collections.map((collection, index) => (
            <Card 
              key={index} 
              className="surface hover:shadow-lg transition-all duration-300 group overflow-hidden"
            >
              <CardContent className="p-0">
                <div className="relative overflow-hidden">
                  <img
                    src={collection.image}
                    alt={collection.name}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-primary text-primary-foreground">
                      {collection.items} {t('collection.items')}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{collection.name}</h3>
                    <p className="text-muted-foreground">{collection.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">{t('collection.floor')}</div>
                      <div className="text-xl font-bold text-primary">{collection.floorPrice}</div>
                    </div>
                    <Button variant="outline" className="border-border hover:bg-secondary">
                      {t('collection.view')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" className="bg-gradient-hero text-primary-foreground hover:opacity-90">
            {t('collection.explore')}
          </Button>
        </div>
      </div>
    </section>
  );
};