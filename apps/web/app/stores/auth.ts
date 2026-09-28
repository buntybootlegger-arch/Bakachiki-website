import { defineStore } from "pinia";

interface CustomerProfile {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    accessToken: null as string | null,
    user: null as CustomerProfile | null,
    initialized: false,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.accessToken && state.user),
  },
  actions: {
    async register(payload: { email: string; password: string; firstName?: string; lastName?: string }) {
      const api = useApi();
      const res = await api<{ accessToken: string }>("/auth/register", {
        method: "POST",
        body: payload,
      });
      this.accessToken = res.accessToken;
      await this.fetchMe();
    },

    async login(payload: { email: string; password: string }) {
      const api = useApi();
      const res = await api<{ accessToken: string }>("/auth/login", {
        method: "POST",
        body: payload,
      });
      this.accessToken = res.accessToken;
      await this.fetchMe();
      await useCartStore().mergeGuestCart();
    },

    async logout() {
      const api = useApi();
      try {
        await this.authFetch("/auth/logout", { method: "POST" });
      } finally {
        this.accessToken = null;
        this.user = null;
      }
    },

    /** Attempts a silent refresh using the httpOnly refresh cookie. Safe to call on app init. */
    async tryRefresh() {
      if (this.initialized) return;
      const api = useApi();
      try {
        const res = await api<{ accessToken: string }>("/auth/refresh", { method: "POST" });
        this.accessToken = res.accessToken;
        await this.fetchMe();
      } catch {
        this.accessToken = null;
        this.user = null;
      } finally {
        this.initialized = true;
      }
    },

    async fetchMe() {
      this.user = await this.authFetch<CustomerProfile>("/auth/me");
    },

    /** $fetch wrapper that attaches the bearer token and retries once after a silent refresh on 401. */
    async authFetch<T>(path: string, options: Record<string, unknown> = {}): Promise<T> {
      const api = useApi();
      const run = () =>
        api<T>(path, {
          ...options,
          headers: {
            ...(options.headers as Record<string, string> | undefined),
            ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
          },
        });
      try {
        return await run();
      } catch (err) {
        const statusCode = (err as { statusCode?: number; response?: { status?: number } })
          .statusCode ?? (err as { response?: { status?: number } }).response?.status;
        if (statusCode === 401 && this.accessToken) {
          try {
            const refreshed = await api<{ accessToken: string }>("/auth/refresh", { method: "POST" });
            this.accessToken = refreshed.accessToken;
            return await run();
          } catch {
            this.accessToken = null;
            this.user = null;
          }
        }
        throw err;
      }
    },
  },
});
