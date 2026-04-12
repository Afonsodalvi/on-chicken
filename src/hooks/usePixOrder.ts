import { useMutation, useQuery } from "@tanstack/react-query";
import { createPixOrder, getOrderStatus, type CreateOrderRequest } from "@/lib/pix-api";

export function useCreatePixOrder() {
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => createPixOrder(data),
  });
}

export function useOrderStatus(orderId: string | null, email: string | null) {
  return useQuery({
    queryKey: ["pix-order", orderId],
    queryFn: () => getOrderStatus(orderId!, email!),
    enabled: !!orderId && !!email,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Stop polling when terminal state reached
      if (status === "minted" || status === "failed" || status === "expired" || status === "refunded") {
        return false;
      }
      return 5000; // Poll every 5s while pending/paid/minting
    },
  });
}
