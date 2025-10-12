import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BattleProvider } from "@/contexts/BattleContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Web3Provider } from "@/providers/Web3Provider";
import Index from "./pages/Index";
import Battle from "./pages/Battle";
import { Farm } from "./pages/Farm";
import Whitelist from "./pages/Whitelist";
import Details from "./pages/Details";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <Web3Provider>
        <TooltipProvider>
          <BattleProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/battle" element={<Battle />} />
                <Route path="/farm" element={<Farm />} />
                <Route path="/whitelist" element={<Whitelist />} />
                <Route path="/details" element={<Details />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </BattleProvider>
        </TooltipProvider>
      </Web3Provider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
