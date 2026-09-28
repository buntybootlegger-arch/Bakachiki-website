import { defineStore } from "pinia";

interface AdminProfile {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: { id: string; name: string };
}

export const useAdminAuthStore = defineStore("adminAuth", {
  state: () => ({
    accessToken: null as string | null,
    admin: null as AdminProfile | null,
    initialized: false,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.accessToken && state.admin),
    can: (state) => (_permission: string) => Boolean(state.admin), // fine-grained checks are enforced server-side
  },
  actions: {
    async login(payload: { email: string; password: string }) {
      const api = useApi();
      const res = await api<{ accessToken: string; roleName: string }>("/admin-auth/login", {
        method: "POST",
        body: payload,
      });
      this.accessToken = res.accessToken;
      await this.fetchMe();
    },

    async logout() {
      try {
        await this.authFetch("/admin-auth/logout", { method: "POST" });
      } finally {
        this.accessToken = null;
        this.admin = null;
      }
    },

    async tryRefresh() {
      if (this.initialized) return;
      const api = useApi();
      try {
        const res = await api<{ accessToken: string }>("/admin-auth/refresh", { method: "POST" });
        this.accessToken = res.accessToken;
        await this.fetchMe();
      } catch {
        this.accessToken = null;
        this.admin = null;
      } finally {
        this.initialized = true;
      }
    },

    async fetchMe() {
      this.admin = await this.authFetch<AdminProfile>("/admin-auth/me");
    },

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
            const refreshed = await api<{ accessToken: string }>("/admin-auth/refresh", { method: "POST" });
            this.accessToken = refreshed.accessToken;
            return await run();
          } catch {
            this.accessToken = null;
            this.admin = null;
          }
        }
        throw err;
      }
    },
  },
});
