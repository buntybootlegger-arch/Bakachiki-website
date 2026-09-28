export interface ProductImageDTO {
  id: string;
  url: string;
  altText?: string | null;
  position: number;
}

export interface ProductVariantDTO {
  id: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  price: number;
  salePrice?: number | null;
  stock: number;
  imageUrl?: string | null;
}

export interface ProductListItemDTO {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  thumbnailUrl?: string | null;
  brandName?: string | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  inStock: boolean;
}

export interface ProductDetailDTO extends ProductListItemDTO {
  sku: string;
  shortDescription?: string | null;
  description?: string | null;
  categoryId: string;
  brandId?: string | null;
  images: ProductImageDTO[];
  variants: ProductVariantDTO[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  imageUrl?: string | null;
  bannerUrl?: string | null;
  description?: string | null;
  position: number;
}

export interface BrandDTO {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}
