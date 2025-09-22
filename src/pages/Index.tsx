import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { AnimatedSection } from "@/components/AnimatedSection";
import { Collection } from "@/components/Collection";
import { Shop } from "@/components/Shop";
import { Community } from "@/components/Community";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <AnimatedSection />
      <Collection />
      <Shop />
      <Community />
      <Footer />
    </div>
  );
};

export default Index;
