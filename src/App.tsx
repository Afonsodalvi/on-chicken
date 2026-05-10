import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BattleProvider } from "@/contexts/BattleContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Web3Provider } from "@/providers/Web3Provider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Battle from "./pages/Battle";
import { Farm } from "./pages/Farm";
import Whitelist from "./pages/Whitelist";
import Details from "./pages/Details";
import NotFound from "./pages/NotFound";
import { WalletEligibilityHandler } from "./components/WalletEligibilityHandler";

const Admin = lazy(() => import("./pages/Admin"));
const Buy = lazy(() => import("./pages/Buy"));
const Mint = lazy(() => import("./pages/Mint"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <Web3Provider>
        <TooltipProvider>
          <BattleProvider>
            <Toaster />
            <Sonner />
            <ErrorBoundary>
              <BrowserRouter>
                <WalletEligibilityHandler />
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/battle" element={<Battle />} />
                    <Route path="/farm" element={<Farm />} />
                    <Route path="/whitelist" element={<Whitelist />} />
                    <Route path="/mint" element={<Mint />} />
                    <Route path="/details" element={<Details />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/buy" element={<Buy />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </ErrorBoundary>
          </BattleProvider>
        </TooltipProvider>
      </Web3Provider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
