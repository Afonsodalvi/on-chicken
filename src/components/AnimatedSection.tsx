import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import wizardGif from "@/assets/gifs/wizard_chicken_animated_staff.gif";
import bitcoinGif from "@/assets/gifs/bitcoin_egg_emphasis_Bhoodie_medium.gif";
import hackerGif from "@/assets/gifs/hacker_chicken_glasses_blink_strong.gif";

export const AnimatedSection = () => {
  const { t } = useLanguage();
  const [downloadCounts, setDownloadCounts] = useState({
    wizard: 1247,
    bitcoin: 892,
    hacker: 634
  });
  const [downloading, setDownloading] = useState<string | null>(null);

  const gifs = [
    { id: 'wizard', src: wizardGif, name: 'pudgy-wizard-chicken.gif', title: 'Wizard Chicken' },
    { id: 'bitcoin', src: bitcoinGif, name: 'pudgy-bitcoin-egg.gif', title: 'Bitcoin Egg' },
    { id: 'hacker', src: hackerGif, name: 'pudgy-hacker-chicken.gif', title: 'Hacker Chicken' }
  ];

  const handleDownload = async (gifId: string, gifSrc: string, fileName: string) => {
    setDownloading(gifId);
    try {
      const link = document.createElement('a');
      link.href = gifSrc;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setDownloadCounts(prev => ({
        ...prev,
        [gifId]: prev[gifId as keyof typeof prev] + 1
      }));
      
      setTimeout(() => setDownloading(null), 1500);
    } catch (error) {
      console.error('Erro no download:', error);
      setDownloading(null);
    }
  };

  const handleShare = async (gifTitle: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${gifTitle} - GIF Animado`,
          text: `Confira este incrível GIF da coleção Pudgy Farms! 🐔`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  return (
    <section className="py-8 bg-gradient-to-b from-transparent to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-semibold font-display mb-2">
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              {t('gifs.title')}
            </span>
          </h2>
          <p className="text-muted-foreground text-sm">
            {t('gifs.subtitle')}
          </p>
        </div>

        <div className="flex justify-center items-center gap-4">
          {gifs.map((gif) => (
            <div key={gif.id} className="relative group">
              <div className="relative">
                <img
                  src={gif.src}
                  alt={`${gif.title} GIF`}
                  className="w-16 h-16 object-contain transition-transform group-hover:scale-105"
                  style={{
                    filter: "brightness(1.1) contrast(1.1) drop-shadow(0 0 12px rgba(265, 92%, 68%, 0.3))"
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              {/* Botões de ação apenas com ícones */}
              <div className="mt-1 flex gap-1 justify-center">
                <Button
                  onClick={() => handleDownload(gif.id, gif.src, gif.name)}
                  disabled={downloading === gif.id}
                  size="sm"
                  className="bg-gradient-hero text-primary-foreground hover:opacity-90 p-1 h-5 w-5"
                >
                  <Download className="w-3 h-3" />
                </Button>
                <Button
                  onClick={() => handleShare(gif.title)}
                  variant="outline"
                  size="sm"
                  className="border-border hover:bg-secondary p-1 h-5 w-5"
                >
                  <Share2 className="w-3 h-3" />
                </Button>
              </div>
              
              {/* Estatísticas compactas */}
              <div className="text-center text-xs text-muted-foreground mt-1">
                <span>{downloadCounts[gif.id as keyof typeof downloadCounts].toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
