export interface SiteSettingsPublicDTO {
  siteName: string;
  colorInk: string;
  colorPaper: string;
  colorAccentPrimary: string;
  colorAccentSecondary: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  defaultOgImageUrl?: string | null;
  socialLinks?: Record<string, string> | null;
}

export type SiteSettingsDTO = SiteSettingsPublicDTO;
