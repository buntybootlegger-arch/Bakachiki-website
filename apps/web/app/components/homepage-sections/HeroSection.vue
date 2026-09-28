<script setup lang="ts">
import type { HeroSectionConfig } from "@bakachiki/shared";

const props = defineProps<{ config: HeroSectionConfig }>();

const contentRef = ref<HTMLElement | null>(null);
useSectionAnimation(contentRef, props.config.animation?.preset ?? "fadeUp", { y: 20, duration: 1, delay: 0.1 });
</script>

<template>
  <section class="relative flex min-h-[75vh] items-end overflow-hidden bg-ink-950 text-cream md:min-h-[92vh]">
    <video
      v-if="config.mediaType === 'VIDEO' && config.videoUrl"
      class="absolute inset-0 h-full w-full object-cover opacity-80"
      :src="config.videoUrl"
      autoplay
      muted
      loop
      playsinline
    />
    <picture v-else class="absolute inset-0">
      <source v-if="config.mobileImageUrl" :srcset="config.mobileImageUrl" media="(max-width: 768px)" />
      <img :src="config.imageUrl" :alt="config.heading" class="h-full w-full object-cover opacity-80" />
    </picture>
    <div class="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
    <HalftoneDots color="var(--accent-primary)" class-name="right-0 top-0 h-40 w-40 opacity-30" />

    <div ref="contentRef" class="reveal-up relative z-10 max-w-8xl px-6 pb-16 md:px-12 md:pb-24">
      <h1 class="max-w-3xl font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-8xl">
        {{ config.heading }}
      </h1>
      <p v-if="config.subheading" class="mt-5 max-w-md text-base text-cream/80 md:text-lg">
        {{ config.subheading }}
      </p>
      <NuxtLink
        v-if="config.ctaText && config.ctaUrl"
        :to="config.ctaUrl"
        class="mt-8 inline-block rounded-full bg-accent px-8 py-3 font-display text-sm font-bold uppercase tracking-wide text-ink-950 transition-transform hover:scale-105"
      >
        {{ config.ctaText }}
      </NuxtLink>
    </div>
  </section>
</template>
