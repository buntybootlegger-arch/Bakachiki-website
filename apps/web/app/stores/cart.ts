import { defineStore } from "pinia";

export interface CartItemView {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  thumbnailUrl: string | null;
  variantId: string | null;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CartView {
  id: string;
  token: string;
  items: CartItemView[];
  subtotal: number;
  itemCount: number;
}

export const useCartStore = defineStore("cart", {
  state: () => ({
    cart: null as CartView | null,
    isDrawerOpen: false,
    loading: false,
  }),
  getters: {
    itemCount: (state) => state.cart?.itemCount ?? 0,
  },
  actions: {
    private_fetchWithAuth<T>(path: string, options: Record<string, unknown> = {}): Promise<T> {
      const auth = useAuthStore();
      if (auth.accessToken) {
        return auth.authFetch<T>(path, options);
      }
      const api = useApi();
      return api<T>(path, options);
    },

    async fetchCart() {
      this.loading = true;
      try {
        this.cart = await this.private_fetchWithAuth<CartView>("/cart");
      } finally {
        this.loading = false;
      }
    },

    async addItem(payload: { productId: string; variantId?: string; quantity: number }) {
      this.cart = await this.private_fetchWithAuth<CartView>("/cart/items", {
        method: "POST",
        body: payload,
      });
      this.isDrawerOpen = true;
    },

    async updateItem(itemId: string, quantity: number) {
      this.cart = await this.private_fetchWithAuth<CartView>(`/cart/items/${itemId}`, {
        method: "PATCH",
        body: { quantity },
      });
    },

    async removeItem(itemId: string) {
      this.cart = await this.private_fetchWithAuth<CartView>(`/cart/items/${itemId}`, {
        method: "DELETE",
      });
    },

    async mergeGuestCart() {
      const auth = useAuthStore();
      if (!auth.accessToken) return;
      this.cart = await auth.authFetch<CartView>("/cart/merge", { method: "POST" });
    },

    openDrawer() {
      this.isDrawerOpen = true;
    },
    closeDrawer() {
      this.isDrawerOpen = false;
    },
  },
});
