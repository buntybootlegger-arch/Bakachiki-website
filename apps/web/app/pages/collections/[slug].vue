<script setup lang="ts">
const route = useRoute();
const api = useApi();
const slug = computed(() => route.params.slug as string);

const { data: collection } = await useAsyncData(() => `collection-${slug.value}`, () =>
  api<any>(`/collections/slug/${slug.value}`).catch(() => null),
);

if (!collection.value) {
  throw createError({ statusCode: 404, statusMessage: "Collection not found" });
}

useSeoMeta({
  title: () => collection.value?.seoTitle || collection.value?.name,
  description: () => collection.value?.seoDescription || collection.value?.description,
});
</script>

<template>
  <div>
    <div class="relative h-64 overflow-hidden md:h-96">
      <img
        :src="collection.coverImageUrl ?? 'https://placehold.co/1920x900?text=%20'"
        :alt="collection.name"
        class="h-full w-full object-cover"
      />
      <div class="absolute inset-0 flex flex-col items-start justify-end gap-2 bg-gradient-to-t from-ink-950/80 to-transparent p-8">
        <h1 class="font-display text-4xl font-extrabold uppercase tracking-tight text-cream md:text-6xl">{{ collection.name }}</h1>
        <p v-if="collection.description" class="max-w-xl text-sm text-cream/80">{{ collection.description }}</p>
      </div>
    </div>

    <div class="mx-auto max-w-8xl px-6 py-14">
      <p v-if="!collection.products?.length" class="text-sm text-ink-950/50">No products in this collection yet.</p>
      <ProductGrid v-else :products="collection.products" />
    </div>
  </div>
</template>
