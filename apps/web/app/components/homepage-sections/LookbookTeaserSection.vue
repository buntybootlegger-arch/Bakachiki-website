<script setup lang="ts">
import type { LookbookTeaserSectionConfig } from "@bakachiki/shared";

const props = defineProps<{ config: LookbookTeaserSectionConfig }>();

const api = useApi();
const { data: lookbook } = await useAsyncData(`homepage-lookbook-${props.config.lookbookSlug}`, () =>
  api<any>(`/lookbooks/${props.config.lookbookSlug}`).catch(() => null),
);

const sectionRef = ref<HTMLElement | null>(null);
useSectionAnimation(sectionRef, props.config.animation?.preset ?? "fadeUp");
</script>

<template>
  <section v-if="lookbook" ref="sectionRef" class="reveal-up mx-auto max-w-8xl px-6 py-10 md:py-16">
    <NuxtLink :to="`/lookbooks/${lookbook.slug}`" class="group relative block overflow-hidden rounded-2xl">
      <img
        :src="lookbook.coverImageUrl ?? 'https://placehold.co/1600x900?text=%20'"
        :alt="lookbook.title"
        class="h-72 w-full object-cover transition-transform duration-700 group-hover:scale-105 md:h-[28rem]"
      />
      <div class="absolute inset-0 flex flex-col items-start justify-end gap-2 bg-ink-950/30 p-8 text-cream md:p-16">
        <h2 class="font-display text-3xl font-extrabold uppercase tracking-tight md:text-6xl">
          {{ config.heading ?? lookbook.title }}
        </h2>
        <span class="mt-2 rounded-full bg-accent px-6 py-2 font-display text-sm font-bold uppercase text-ink-950">
          {{ config.ctaText ?? "View Lookbook" }}
        </span>
      </div>
    </NuxtLink>
  </section>
</template>
