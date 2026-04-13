// API client for PIX payment endpoints

export interface CreateOrderRequest {
  email: string;
  cpf: string;
  tokenId: number;
  quantity: number;
}

export interface CreateOrderResponse {
  orderId: string;
  pixQrCode: string | null;
  pixCopyPaste: string | null;
  expiresAt: string | null;
  amount: number;
  clientSecret: string;
}

export interface OrderStatusResponse {
  orderId: string;
  status: "pending" | "paid" | "minting" | "minted" | "mint_failed" | "failed" | "expired" | "refunded";
  txHash: string | null;
  walletAddress: string | null;
  mintedAt: string | null;
  tokenId: number;
  quantity: number;
}

/** Thrown when the PIX backend is unreachable or misconfigured (500 / network error). */
export class PixServiceUnavailableError extends Error {
  constructor(message = "PIX service unavailable") {
    super(message);
    this.name = "PixServiceUnavailableError";
  }
}

export async function createPixOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
  let res: Response;
  try {
    res = await fetch("/api/pix/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch {
    // Network error (ECONNREFUSED, offline, etc.)
    throw new PixServiceUnavailableError();
  }

  if (res.status === 404 || res.status >= 500) {
    // 404 = endpoint not deployed yet; 500+ = server misconfiguration
    throw new PixServiceUnavailableError();
  }

  if (!res.ok) {
    // Client error (400/422/429) — show the server's message
    const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function getOrderStatus(orderId: string, email: string): Promise<OrderStatusResponse> {
  const params = new URLSearchParams({ orderId, email });
  const res = await fetch(`/api/pix/order-status?${params}`);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Erro de conexão" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}
