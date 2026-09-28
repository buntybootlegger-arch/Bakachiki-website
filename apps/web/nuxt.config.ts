export default defineNuxtConfig({
  compatibilityDate: "2026-01-01",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt"],
  css: ["~/assets/css/main.css"],
  components: [
    { path: "~/components/storefront", pathPrefix: false },
    { path: "~/components/homepage-sections", pathPrefix: false },
    { path: "~/components/admin", pathPrefix: false },
    { path: "~/components/decor", pathPrefix: false },
  ],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://localhost:4000",
    },
  },
  routeRules: {
    // Admin session tokens live only in client memory (never in a cookie the
    // server can read), so admin pages cannot be usefully server-rendered —
    // every useAsyncData call would run unauthenticated on the server and 401.
    "/admin/**": { ssr: false },
  },
  app: {
    head: {
      titleTemplate: "%s · Bakachiki",
      meta: [{ name: "viewport", content: "width=device-width, initial-scale=1" }],
      link: [{ rel: "icon", type: "image/png", href: "/favicon.png" }],
    },
    pageTransition: { name: "page", mode: "out-in" },
  },
});
