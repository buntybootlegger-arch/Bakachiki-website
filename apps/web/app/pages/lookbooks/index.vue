<script setup lang="ts">
const api = useApi();
const { data: lookbooks } = await useAsyncData("lookbooks-index", () => api<any[]>("/lookbooks"));

const gridRef = ref<HTMLElement | null>(null);
useSectionAnimation(gridRef, "staggerUp", { stagger: true });

useSeoMeta({ title: "Lookbooks", description: "Editorial styling stories from Bakachiki." });
</script>

<template>
  <div class="mx-auto max-w-8xl px-6 py-14">
    <h1 class="mb-10 font-display text-4xl font-extrabold uppercase tracking-tight md:text-5xl">Lookbooks</h1>
    <div ref="gridRef" class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <NuxtLink
        v-for="lookbook in lookbooks"
        :key="lookbook.id"
        :to="`/lookbooks/${lookbook.slug}`"
        class="group relative overflow-hidden rounded-2xl bg-ink-900"
      >
        <img
          :src="lookbook.coverImageUrl ?? 'https://placehold.co/1600x900?text=%20'"
          :alt="lookbook.title"
          class="aspect-video w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
        />
        <div class="absolute inset-0 flex items-end bg-gradient-to-t from-ink-950/70 to-transparent p-6">
          <span class="font-display text-2xl font-extrabold uppercase text-cream">{{ lookbook.title }}</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
