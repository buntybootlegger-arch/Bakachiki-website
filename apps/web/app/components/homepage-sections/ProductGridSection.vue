<script setup lang="ts">
import type { ProductGridSectionConfig } from "@bakachiki/shared";

const props = defineProps<{ config: ProductGridSectionConfig }>();

const api = useApi();

const query = computed(() => {
  const q: Record<string, unknown> = { pageSize: props.config.limit ?? 8 };
  if (props.config.source === "FEATURED") q.featured = true;
  if (props.config.source === "NEW_ARRIVALS") q.newArrival = true;
  if (props.config.source === "BEST_SELLERS") q.bestSeller = true;
  if (props.config.source === "CATEGORY" && props.config.categorySlug) q.categorySlug = props.config.categorySlug;
  return q;
});

const { data } = await useAsyncData(`homepage-grid-${JSON.stringify(query.value)}`, () =>
  api<{ items: any[] }>("/products", { query: query.value }),
);
</script>

<template>
  <section v-if="data?.items?.length" class="mx-auto max-w-8xl px-6 py-16">
    <div class="mb-8 flex items-end justify-between">
      <div>
        <h2 class="font-display text-3xl font-extrabold uppercase tracking-tight md:text-4xl">{{ config.title }}</h2>
        <p v-if="config.subtitle" class="mt-1 text-sm text-ink-950/60">{{ config.subtitle }}</p>
      </div>
      <NuxtLink to="/shop" class="hidden font-display text-sm font-bold uppercase underline decoration-2 underline-offset-4 md:block">
        View all
      </NuxtLink>
    </div>
    <ProductGrid :products="data.items" :animation-preset="config.animation?.preset ?? 'staggerUp'" />
  </section>
</template>
