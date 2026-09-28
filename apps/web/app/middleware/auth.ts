export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return; // access tokens live in memory client-side only
  const auth = useAuthStore();
  if (!auth.initialized) await auth.tryRefresh();
  if (!auth.isLoggedIn) {
    return navigateTo(`/login?redirect=${encodeURIComponent(useRoute().fullPath)}`);
  }
});
