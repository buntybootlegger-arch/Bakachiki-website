import type { ProductListItemDTO } from "./catalog";

export interface CollectionDTO {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  coverImageUrl?: string | null;
  isActive: boolean;
  position: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export interface CollectionDetailDTO extends CollectionDTO {
  products: ProductListItemDTO[];
}
