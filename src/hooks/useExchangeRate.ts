import { useQuery } from "@tanstack/react-query";

interface ExchangeRateResponse {
  rates: { BRL: number };
}

async function fetchUsdToBrl(): Promise<number> {
  // Free API, no key needed, reliable for USD→BRL
  const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
  if (!res.ok) throw new Error("Failed to fetch exchange rate");
  const data: ExchangeRateResponse = await res.json();
  return data.rates.BRL;
}

export function useExchangeRate() {
  return useQuery({
    queryKey: ["exchange-rate-usd-brl"],
    queryFn: fetchUsdToBrl,
    staleTime: 1000 * 60 * 30, // 30 min
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
  });
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}
