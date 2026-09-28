<script setup lang="ts">
import type { BannerSectionConfig } from "@bakachiki/shared";

const props = defineProps<{ config: BannerSectionConfig }>();

const bannerRef = ref<HTMLElement | null>(null);
useSectionAnimation(bannerRef, props.config.animation?.preset ?? "fadeUp");
</script>

<template>
  <section ref="bannerRef" class="reveal-up mx-auto max-w-8xl px-6 py-10 md:py-16">
    <NuxtLink :to="config.ctaUrl ?? '/shop'" class="group relative block overflow-hidden rounded-2xl">
      <video
        v-if="config.mediaType === 'VIDEO' && config.videoUrl"
        class="h-64 w-full object-cover transition-transform duration-700 group-hover:scale-105 md:h-96"
        :src="config.videoUrl"
        autoplay
        muted
        loop
        playsinline
      />
      <img
        v-else
        :src="config.imageUrl"
        :alt="config.heading ?? 'Promotion'"
        class="h-64 w-full object-cover transition-transform duration-700 group-hover:scale-105 md:h-96"
      />
      <div v-if="config.heading" class="absolute inset-0 flex flex-col items-start justify-center gap-3 bg-ink-950/30 px-8 text-cream md:px-16">
        <h2 class="font-display text-3xl font-extrabold uppercase tracking-tight md:text-5xl">{{ config.heading }}</h2>
        <p v-if="config.subheading" class="max-w-sm text-sm md:text-base">{{ config.subheading }}</p>
        <span v-if="config.ctaText" class="mt-2 rounded-full bg-accent px-6 py-2 font-display text-sm font-bold uppercase text-ink-950">
          {{ config.ctaText }}
        </span>
      </div>
    </NuxtLink>
  </section>
</template>
