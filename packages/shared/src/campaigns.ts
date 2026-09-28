import type { CollectionDTO } from "./collections";

export interface CampaignDTO {
  id: string;
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  heroImageUrl?: string | null;
  heroVideoUrl?: string | null;
  themeColor?: string | null;
  collectionId?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  isActive: boolean;
  position: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
}

export interface CampaignDetailDTO extends CampaignDTO {
  collection?: CollectionDTO | null;
}
