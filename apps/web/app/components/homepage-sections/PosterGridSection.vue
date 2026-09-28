<script setup lang="ts">
import type { PosterGridSectionConfig } from "@bakachiki/shared";

const props = defineProps<{ config: PosterGridSectionConfig }>();

const gridRef = ref<HTMLElement | null>(null);
useSectionAnimation(gridRef, props.config.animation?.preset ?? "staggerUp", { stagger: true });
</script>

<template>
  <section v-if="config.posters?.length" class="mx-auto max-w-8xl px-6 py-16">
    <h2 v-if="config.title" class="mb-8 font-display text-3xl font-extrabold uppercase tracking-tight md:text-4xl">
      {{ config.title }}
    </h2>
    <div ref="gridRef" class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <NuxtLink
        v-for="(poster, i) in config.posters"
        :key="i"
        :to="poster.ctaUrl ?? '/shop'"
        class="group relative overflow-hidden rounded-2xl bg-ink-900"
      >
        <img :src="poster.imageUrl" :alt="poster.heading ?? 'Poster'" class="h-80 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div v-if="poster.heading" class="absolute inset-0 flex items-end bg-gradient-to-t from-ink-950/70 to-transparent p-6">
          <span class="font-display text-xl font-extrabold uppercase text-cream">{{ poster.heading }}</span>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>
