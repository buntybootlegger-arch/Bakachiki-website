<script setup lang="ts">
import type { AnimationPreset } from "@bakachiki/shared";

interface ProductListItem {
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

const props = withDefaults(
  defineProps<{ products: ProductListItem[]; animationPreset?: AnimationPreset }>(),
  { animationPreset: "staggerUp" },
);

const gridRef = ref<HTMLElement | null>(null);
useSectionAnimation(gridRef, props.animationPreset, { stagger: true, y: 32 });
</script>

<template>
  <div ref="gridRef" class="grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
    <ProductCard v-for="product in products" :key="product.id" :product="product" />
  </div>
</template>
