/**
 * Page section types supported by the storefront's dynamic page renderer.
 * A `Page` is an ordered stack of `PageSection`s; the homepage is the page
 * at slug "home". Add new types here + a matching component in
 * apps/web/app/components/homepage-sections when extending the builder.
 */
export const PAGE_SECTION_TYPES = [
  "HERO",
  "BANNER",
  "PRODUCT_GRID",
  "CATEGORY_GRID",
  "MARQUEE",
  "VIDEO_BANNER",
  "POSTER_GRID",
  "COLLECTION_GRID",
  "CAMPAIGN_TEASER",
  "LOOKBOOK_TEASER",
  "RICH_TEXT",
] as const;

export type PageSectionType = (typeof PAGE_SECTION_TYPES)[number];

/**
 * Curated set of GSAP-driven entrance/behavior presets a section can opt
 * into from the admin builder, so animation choice is data, not hardcoded
 * per section. "none" skips animation entirely (respecting reduced motion
 * is always enforced client-side regardless of the chosen preset).
 */
export const ANIMATION_PRESETS = [
  "fadeUp",
  "fadeIn",
  "staggerUp",
  "parallax",
  "marquee",
  "scaleReveal",
  "none",
] as const;

export type AnimationPreset = (typeof ANIMATION_PRESETS)[number];

export interface SectionAnimationConfig {
  preset: AnimationPreset;
}

export type MediaKind = "IMAGE" | "VIDEO";

export interface HeroSectionConfig {
  heading: string;
  subheading?: string;
  mediaType?: MediaKind;
  imageUrl: string;
  mobileImageUrl?: string;
  videoUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  animation?: SectionAnimationConfig;
}

export interface BannerSectionConfig {
  mediaType?: MediaKind;
  imageUrl: string;
  mobileImageUrl?: string;
  videoUrl?: string;
  heading?: string;
  subheading?: string;
  ctaText?: string;
  ctaUrl?: string;
  animation?: SectionAnimationConfig;
}

export interface ProductGridSectionConfig {
  title: string;
  subtitle?: string;
  source: "FEATURED" | "NEW_ARRIVALS" | "BEST_SELLERS" | "CATEGORY";
  categorySlug?: string;
  limit?: number;
  animation?: SectionAnimationConfig;
}

export interface CategoryGridSectionConfig {
  title: string;
  categorySlugs: string[];
  animation?: SectionAnimationConfig;
}

export interface MarqueeSectionConfig {
  text: string;
  repeat?: number;
  speed?: number;
  direction?: "left" | "right";
}

export interface VideoBannerSectionConfig {
  videoUrl: string;
  posterImageUrl?: string;
  heading?: string;
  subheading?: string;
  ctaText?: string;
  ctaUrl?: string;
  animation?: SectionAnimationConfig;
}

export interface PosterGridSectionConfig {
  title?: string;
  posters: { imageUrl: string; heading?: string; ctaUrl?: string }[];
  animation?: SectionAnimationConfig;
}

export interface CollectionGridSectionConfig {
  title: string;
  subtitle?: string;
  collectionSlugs: string[];
  animation?: SectionAnimationConfig;
}

export interface CampaignTeaserSectionConfig {
  campaignSlug: string;
  heading?: string;
  ctaText?: string;
  animation?: SectionAnimationConfig;
}

export interface LookbookTeaserSectionConfig {
  lookbookSlug: string;
  heading?: string;
  ctaText?: string;
  animation?: SectionAnimationConfig;
}

export interface RichTextSectionConfig {
  heading?: string;
  body: string;
  align?: "left" | "center";
  animation?: SectionAnimationConfig;
}

export type PageSectionConfig =
  | HeroSectionConfig
  | BannerSectionConfig
  | ProductGridSectionConfig
  | CategoryGridSectionConfig
  | MarqueeSectionConfig
  | VideoBannerSectionConfig
  | PosterGridSectionConfig
  | CollectionGridSectionConfig
  | CampaignTeaserSectionConfig
  | LookbookTeaserSectionConfig
  | RichTextSectionConfig;

export interface PageSectionDTO {
  id: string;
  type: PageSectionType;
  order: number;
  isActive: boolean;
  config: PageSectionConfig;
}

export interface PageDTO {
  id: string;
  slug: string;
  title: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
  isActive: boolean;
  sections: PageSectionDTO[];
}
