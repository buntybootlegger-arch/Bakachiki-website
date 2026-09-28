import type { ProductListItemDTO } from "./catalog";

export type LookbookMediaKind = "IMAGE" | "VIDEO";

export interface LookbookSlideDTO {
  id: string;
  mediaUrl: string;
  mediaType: LookbookMediaKind;
  caption?: string | null;
  position: number;
  productIds: string[];
}

export interface LookbookSlideDetailDTO extends LookbookSlideDTO {
  products: ProductListItemDTO[];
}

export interface LookbookDTO {
  id: string;
  title: string;
  slug: string;
  coverImageUrl?: string | null;
  isActive: boolean;
  position: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface LookbookDetailDTO extends LookbookDTO {
  slides: LookbookSlideDetailDTO[];
}
