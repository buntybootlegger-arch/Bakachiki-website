<script setup lang="ts">
import type { CategoryGridSectionConfig } from "@bakachiki/shared";

const props = defineProps<{ config: CategoryGridSectionConfig }>();

const api = useApi();
const { data: categories } = await useAsyncData(`homepage-categories-${props.config.categorySlugs.join(",")}`, async () => {
  const all = await api<any[]>("/categories");
  return all.filter((c) => props.config.categorySlugs.includes(c.slug));
});

const gridRef = ref<HTMLElement | null>(null);
useSectionAnimation(gridRef, props.config.animation?.preset ?? "staggerUp", { stagger: true });
</script>

<template>
  <section v-if="categories?.length" class="mx-auto max-w-8xl px-6 py-16">
    <h2 class="mb-8 font-display text-3xl font-extrabold uppercase tracking-tight md:text-4xl">{{ config.title }}</h2>
    <div ref="gridRef" class="grid grid-cols-2 gap-4 md:grid-cols-4">
      <NuxtLink
        v-for="category in categories"
        :key="category.id"
        :to="`/category/${category.slug}`"
        class="group relative overflow-hidden rounded-2xl bg-ink-900"
      >
        <img
          :src="category.imageUrl ?? 'https://placehold.co/400x400?text=%20'"
          :alt="category.name"
          class="aspect-square w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
        />
        <div class="absolute inset-0 flex items-end bg-gradient-to-t from-ink-950/70 to-transparent p-4">
          <span class="font-display text-sm font-bold uppercase tracking-wide text-cream">{{ category.name }}</span>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>
