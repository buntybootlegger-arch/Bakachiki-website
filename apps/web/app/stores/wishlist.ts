import { defineStore } from "pinia";

interface WishlistApiItem {
  productId: string;
}

export const useWishlistStore = defineStore("wishlist", {
  state: () => ({
    productIds: new Set<string>(),
    initialized: false,
  }),
  actions: {
    isWishlisted(productId: string) {
      return this.productIds.has(productId);
    },

    async fetchIds() {
      const auth = useAuthStore();
      if (!auth.isLoggedIn) {
        this.initialized = true;
        return;
      }
      try {
        const items = await auth.authFetch<WishlistApiItem[]>("/wishlist");
        this.productIds = new Set(items.map((item) => item.productId));
      } finally {
        this.initialized = true;
      }
    },

    async toggle(productId: string) {
      const auth = useAuthStore();
      if (!auth.isLoggedIn) {
        await navigateTo("/login");
        return;
      }
      const wishlisted = this.productIds.has(productId);
      if (wishlisted) {
        this.productIds.delete(productId);
        await auth.authFetch(`/wishlist/${productId}`, { method: "DELETE" }).catch(() => {
          this.productIds.add(productId);
        });
      } else {
        this.productIds.add(productId);
        await auth.authFetch(`/wishlist/${productId}`, { method: "POST" }).catch(() => {
          this.productIds.delete(productId);
        });
      }
    },
  },
});
