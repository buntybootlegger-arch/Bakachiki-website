export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return;
  const adminAuth = useAdminAuthStore();
  if (!adminAuth.initialized) await adminAuth.tryRefresh();
  if (!adminAuth.isLoggedIn) {
    return navigateTo("/admin/login");
  }
});
