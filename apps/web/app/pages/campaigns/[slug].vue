<script setup lang="ts">
const route = useRoute();
const api = useApi();
const slug = computed(() => route.params.slug as string);

const { data: campaign } = await useAsyncData(() => `campaign-${slug.value}`, () =>
  api<any>(`/campaigns/${slug.value}`).catch(() => null),
);

if (!campaign.value) {
  throw createError({ statusCode: 404, statusMessage: "Campaign not found" });
}

const { data: collectionDetail } = await useAsyncData(
  () => `campaign-collection-${slug.value}`,
  () =>
    campaign.value?.collection?.slug
      ? api<any>(`/collections/slug/${campaign.value.collection.slug}`)
      : Promise.resolve(null),
);

const heroRef = ref<HTMLElement | null>(null);
useSectionAnimation(heroRef, "fadeUp", { y: 20, duration: 1 });

useSeoMeta({
  title: () => campaign.value?.seoTitle || campaign.value?.name,
  description: () => campaign.value?.seoDescription || campaign.value?.description,
  ogImage: () => campaign.value?.ogImageUrl || campaign.value?.heroImageUrl,
});
</script>

<template>
  <div>
    <section class="relative flex min-h-[70vh] items-end overflow-hidden bg-ink-950 text-cream">
      <video
        v-if="campaign.heroVideoUrl"
        class="absolute inset-0 h-full w-full object-cover opacity-80"
        :src="campaign.heroVideoUrl"
        autoplay
        muted
        loop
        playsinline
      />
      <img
        v-else
        :src="campaign.heroImageUrl ?? 'https://placehold.co/1920x1080?text=%20'"
        :alt="campaign.name"
        class="absolute inset-0 h-full w-full object-cover opacity-80"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
      <div ref="heroRef" class="reveal-up relative z-10 max-w-8xl px-6 pb-16 md:px-12 md:pb-24">
        <span v-if="campaign.tagline" class="font-marker text-lg" :style="{ color: campaign.themeColor ?? 'var(--accent-primary)' }">
          {{ campaign.tagline }}
        </span>
        <h1 class="max-w-3xl font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight md:text-8xl">
          {{ campaign.name }}
        </h1>
      </div>
    </section>

    <div v-if="campaign.description" class="mx-auto max-w-2xl px-6 py-14 text-center">
      <p class="text-base leading-relaxed text-ink-950/80">{{ campaign.description }}</p>
    </div>

    <div v-if="collectionDetail?.products?.length" class="mx-auto max-w-8xl px-6 py-14">
      <h2 class="mb-8 font-display text-3xl font-extrabold uppercase tracking-tight">Shop the Drop</h2>
      <ProductGrid :products="collectionDetail.products" />
    </div>
  </div>
</template>
