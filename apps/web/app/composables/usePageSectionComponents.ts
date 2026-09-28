import type { Component } from "vue";
import HeroSection from "~/components/homepage-sections/HeroSection.vue";
import BannerSection from "~/components/homepage-sections/BannerSection.vue";
import ProductGridSection from "~/components/homepage-sections/ProductGridSection.vue";
import CategoryGridSection from "~/components/homepage-sections/CategoryGridSection.vue";
import MarqueeSection from "~/components/homepage-sections/MarqueeSection.vue";
import VideoBannerSection from "~/components/homepage-sections/VideoBannerSection.vue";
import PosterGridSection from "~/components/homepage-sections/PosterGridSection.vue";
import CollectionGridSection from "~/components/homepage-sections/CollectionGridSection.vue";
import CampaignTeaserSection from "~/components/homepage-sections/CampaignTeaserSection.vue";
import LookbookTeaserSection from "~/components/homepage-sections/LookbookTeaserSection.vue";
import RichTextSection from "~/components/homepage-sections/RichTextSection.vue";

/** Maps a PageSectionType to its renderer component, shared by the homepage and any admin-created landing page. */
export function usePageSectionComponents(): Record<string, Component> {
  return {
    HERO: HeroSection,
    BANNER: BannerSection,
    PRODUCT_GRID: ProductGridSection,
    CATEGORY_GRID: CategoryGridSection,
    MARQUEE: MarqueeSection,
    VIDEO_BANNER: VideoBannerSection,
    POSTER_GRID: PosterGridSection,
    COLLECTION_GRID: CollectionGridSection,
    CAMPAIGN_TEASER: CampaignTeaserSection,
    LOOKBOOK_TEASER: LookbookTeaserSection,
    RICH_TEXT: RichTextSection,
  };
}
