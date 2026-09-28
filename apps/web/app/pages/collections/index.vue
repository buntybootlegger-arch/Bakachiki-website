<script setup lang="ts">
const api = useApi();
const { data: collections } = await useAsyncData("collections-index", () => api<any[]>("/collections"));

const gridRef = ref<HTMLElement | null>(null);
useSectionAnimation(gridRef, "staggerUp", { stagger: true });

useSeoMeta({ title: "Collections", description: "Curated, cross-category drops from Bakachiki." });
</script>

<template>
  <div class="mx-auto max-w-8xl px-6 py-14">
    <h1 class="mb-10 font-display text-4xl font-extrabold uppercase tracking-tight md:text-5xl">Collections</h1>
    <div ref="gridRef" class="grid grid-cols-1 gap-6 md:grid-cols-3">
      <NuxtLink
        v-for="collection in collections"
        :key="collection.id"
        :to="`/collections/${collection.slug}`"
        class="group relative overflow-hidden rounded-2xl bg-ink-900"
      >
        <img
          :src="collection.coverImageUrl ?? 'https://placehold.co/800x1000?text=%20'"
          :alt="collection.name"
          class="aspect-[4/5] w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
        />
        <div class="absolute inset-0 flex flex-col justify-end gap-1 bg-gradient-to-t from-ink-950/80 to-transparent p-6">
          <span class="font-display text-2xl font-extrabold uppercase text-cream">{{ collection.name }}</span>
          <span v-if="collection.description" class="text-sm text-cream/70">{{ collection.description }}</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
