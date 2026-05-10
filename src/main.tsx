import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const SILENCED_PATTERNS = [
  "MetaMask encountered an error setting the global Ethereum provider",
  "Cannot set property ethereum of #<Window>",
];

const isFromExtension = (text: string) =>
  /chrome-extension:\/\/|moz-extension:\/\/|safari-web-extension:\/\//.test(text);

const isSilenced = (text: string) =>
  Boolean(text) && SILENCED_PATTERNS.some((p) => text.includes(p));

const origConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const first = args[0];
  const text =
    typeof first === "string"
      ? first
      : first instanceof Error
        ? first.message
        : "";
  if (isSilenced(text)) return;
  origConsoleError(...args);
};

if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const text =
      typeof reason === "string"
        ? reason
        : reason instanceof Error
          ? `${reason.message}\n${reason.stack ?? ""}`
          : "";

    if (isFromExtension(text)) return;
    if (isSilenced(text)) return;

    console.warn("[unhandledrejection]", reason);
  });

  window.addEventListener("error", (event) => {
    const text = event.message ?? "";
    const sourceText = `${event.filename ?? ""} ${text}`;
    if (isFromExtension(sourceText)) return;
    if (isSilenced(text)) return;
  });
}

createRoot(document.getElementById("root")!).render(<App />);
