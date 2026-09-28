<script setup lang="ts">
import type { CollectionGridSectionConfig } from "@bakachiki/shared";

const props = defineProps<{ config: CollectionGridSectionConfig }>();

const api = useApi();
const { data: collections } = await useAsyncData(
  `homepage-collections-${props.config.collectionSlugs.join(",")}`,
  async () => {
    const all = await api<any[]>("/collections");
    return all.filter((c) => props.config.collectionSlugs.includes(c.slug));
  },
);

const gridRef = ref<HTMLElement | null>(null);
useSectionAnimation(gridRef, props.config.animation?.preset ?? "staggerUp", { stagger: true });
</script>

<template>
  <section v-if="collections?.length" class="mx-auto max-w-8xl px-6 py-16">
    <div class="mb-8">
      <h2 class="font-display text-3xl font-extrabold uppercase tracking-tight md:text-4xl">{{ config.title }}</h2>
      <p v-if="config.subtitle" class="mt-1 text-sm text-ink-950/60">{{ config.subtitle }}</p>
    </div>
    <div ref="gridRef" class="grid grid-cols-1 gap-5 md:grid-cols-3">
      <NuxtLink
        v-for="collection in collections"
        :key="collection.id"
        :to="`/collections/${collection.slug}`"
        class="group relative overflow-hidden rounded-2xl bg-ink-900"
      >
        <img
          :src="collection.coverImageUrl ?? 'https://placehold.co/800x1000?text=%20'"
          :alt="collection.name"
          class="aspect-[4/5] w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
        />
        <div class="absolute inset-0 flex flex-col justify-end gap-1 bg-gradient-to-t from-ink-950/80 to-transparent p-6">
          <span class="font-display text-2xl font-extrabold uppercase text-cream">{{ collection.name }}</span>
          <span v-if="collection.description" class="text-sm text-cream/70">{{ collection.description }}</span>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>
