<script setup lang="ts">
import type { VideoBannerSectionConfig } from "@bakachiki/shared";

const props = defineProps<{ config: VideoBannerSectionConfig }>();

const sectionRef = ref<HTMLElement | null>(null);
useSectionAnimation(sectionRef, props.config.animation?.preset ?? "fadeUp");
</script>

<template>
  <section ref="sectionRef" class="reveal-up relative mx-auto max-w-8xl overflow-hidden px-6 py-10 md:py-16">
    <div class="relative overflow-hidden rounded-2xl">
      <video
        class="h-64 w-full object-cover md:h-[32rem]"
        :src="config.videoUrl"
        :poster="config.posterImageUrl"
        autoplay
        muted
        loop
        playsinline
      />
      <div v-if="config.heading" class="absolute inset-0 flex flex-col items-start justify-end gap-3 bg-ink-950/30 p-8 text-cream md:p-16">
        <h2 class="font-display text-3xl font-extrabold uppercase tracking-tight md:text-5xl">{{ config.heading }}</h2>
        <p v-if="config.subheading" class="max-w-sm text-sm md:text-base">{{ config.subheading }}</p>
        <NuxtLink
          v-if="config.ctaText && config.ctaUrl"
          :to="config.ctaUrl"
          class="mt-2 rounded-full bg-accent px-6 py-2 font-display text-sm font-bold uppercase text-ink-950"
        >
          {{ config.ctaText }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
