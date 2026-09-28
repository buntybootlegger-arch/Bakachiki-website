import type { SiteSettingsPublicDTO } from "@bakachiki/shared";

/** Fetches admin-configured theme colors once and applies them as CSS vars,
 * so color changes in the admin Settings panel take effect without a rebuild. */
export default defineNuxtPlugin(async () => {
  const api = useApi();
  try {
    const settings = await api<SiteSettingsPublicDTO>("/settings/public");
    document.documentElement.style.setProperty("--accent-primary", settings.colorAccentPrimary);
    document.documentElement.style.setProperty("--accent-secondary", settings.colorAccentSecondary);
  } catch {
    // Fall back to the CSS defaults in main.css if settings can't be fetched.
  }
});
