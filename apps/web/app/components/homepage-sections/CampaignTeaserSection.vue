<script setup lang="ts">
import type { CampaignTeaserSectionConfig } from "@bakachiki/shared";

const props = defineProps<{ config: CampaignTeaserSectionConfig }>();

const api = useApi();
const { data: campaign } = await useAsyncData(`homepage-campaign-${props.config.campaignSlug}`, () =>
  api<any>(`/campaigns/${props.config.campaignSlug}`).catch(() => null),
);

const sectionRef = ref<HTMLElement | null>(null);
useSectionAnimation(sectionRef, props.config.animation?.preset ?? "fadeUp");
</script>

<template>
  <section v-if="campaign" ref="sectionRef" class="reveal-up mx-auto max-w-8xl px-6 py-10 md:py-16">
    <NuxtLink :to="`/campaigns/${campaign.slug}`" class="group relative block overflow-hidden rounded-2xl">
      <img
        :src="campaign.heroImageUrl ?? 'https://placehold.co/1920x900?text=%20'"
        :alt="campaign.name"
        class="h-72 w-full object-cover transition-transform duration-700 group-hover:scale-105 md:h-[28rem]"
      />
      <div class="absolute inset-0 flex flex-col items-start justify-end gap-2 bg-ink-950/30 p-8 text-cream md:p-16">
        <span class="font-marker text-lg" :style="{ color: campaign.themeColor ?? 'var(--accent-primary)' }">
          {{ config.heading ?? campaign.name }}
        </span>
        <h2 class="font-display text-3xl font-extrabold uppercase tracking-tight md:text-6xl">{{ campaign.tagline ?? campaign.name }}</h2>
        <span class="mt-2 rounded-full bg-accent px-6 py-2 font-display text-sm font-bold uppercase text-ink-950">
          {{ config.ctaText ?? "Explore" }}
        </span>
      </div>
    </NuxtLink>
  </section>
</template>
