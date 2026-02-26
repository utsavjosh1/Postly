import { apiClient } from "../lib/api-client";

export interface CheckoutResponse {
  checkout_url: string;
}

export const paymentService = {
  getStaticCheckout: async (productId: string) => {
    const response = await apiClient.get<CheckoutResponse>(
      `/payments/checkout?productId=${productId}`,
    );
    return response.data;
  },

  createCheckoutSession: async (productId: string, quantity: number = 1) => {
    const response = await apiClient.post<CheckoutResponse>(
      "/payments/checkout/session",
      {
        product_cart: [{ product_id: productId, quantity }],
      },
    );
    return response.data;
  },

  getCustomerPortal: async (customerId: string) => {
    const response = await apiClient.get<{ portal_url: string }>(
      `/payments/customer-portal?customer_id=${customerId}`,
    );
    return response.data;
  },
};
