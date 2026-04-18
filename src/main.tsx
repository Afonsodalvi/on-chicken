import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Filtro cosmético: silencia o warning gerado pela inpage.js da MetaMask quando
// outra extensão de carteira (Phantom/Coinbase/Backpack/Rabby...) trava
// window.ethereum como getter-only. Não é bug do app — EIP-6963 já cobre
// detecção de múltiplas carteiras. Só esconde o ruído visual no console.
const SILENCED_PATTERNS = [
  "MetaMask encountered an error setting the global Ethereum provider",
  "Cannot set property ethereum of #<Window>",
];
const origConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const first = args[0];
  const text =
    typeof first === "string"
      ? first
      : first instanceof Error
        ? first.message
        : "";
  if (text && SILENCED_PATTERNS.some((p) => text.includes(p))) return;
  origConsoleError(...args);
};

createRoot(document.getElementById("root")!).render(<App />);
