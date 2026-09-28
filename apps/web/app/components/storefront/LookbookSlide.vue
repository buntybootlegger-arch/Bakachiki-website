<script setup lang="ts">
defineProps<{
  slide: {
    id: string;
    mediaUrl: string;
    mediaType: "IMAGE" | "VIDEO";
    caption?: string | null;
    products: any[];
  };
}>();

const slideRef = ref<HTMLElement | null>(null);
useSectionAnimation(slideRef, "scaleReveal", { duration: 0.9 });
</script>

<template>
  <section ref="slideRef" class="reveal-scale mx-auto max-w-5xl px-6 py-10 md:py-16">
    <div class="overflow-hidden rounded-2xl bg-ink-900">
      <video v-if="slide.mediaType === 'VIDEO'" :src="slide.mediaUrl" class="w-full object-cover" autoplay muted loop playsinline />
      <img v-else :src="slide.mediaUrl" :alt="slide.caption ?? 'Look'" class="w-full object-cover" />
    </div>
    <p v-if="slide.caption" class="mt-4 text-center font-marker text-lg text-ink-950/80">{{ slide.caption }}</p>

    <div v-if="slide.products?.length" class="mt-6">
      <p class="mb-3 text-center text-xs font-bold uppercase tracking-wide text-ink-950/50">Shop the Look</p>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ProductCard v-for="product in slide.products" :key="product.id" :product="product" />
      </div>
    </div>
  </section>
</template>
