<script setup lang="ts">
const route = useRoute();
const api = useApi();
const slug = computed(() => route.params.slug as string);

const { data: category } = await useAsyncData(() => `category-${slug.value}`, () =>
  api<any>(`/categories/slug/${slug.value}`),
);

if (!category.value) {
  throw createError({ statusCode: 404, statusMessage: "Category not found" });
}

const { data: products, pending } = await useAsyncData(
  () => `category-products-${slug.value}`,
  () => api<{ items: any[] }>("/products", { query: { categorySlug: slug.value, pageSize: 24 } }),
  { watch: [slug] },
);

useSeoMeta({
  title: () => category.value?.seoTitle || category.value?.name,
  description: () => category.value?.seoDescription || category.value?.description,
});
</script>

<template>
  <div>
    <div v-if="category?.bannerUrl" class="relative h-56 overflow-hidden md:h-80">
      <img :src="category.bannerUrl" :alt="category.name" class="h-full w-full object-cover" />
      <div class="absolute inset-0 flex items-end bg-gradient-to-t from-ink-950/60 to-transparent p-8">
        <h1 class="font-display text-3xl text-paper md:text-5xl">{{ category.name }}</h1>
      </div>
    </div>
    <h1 v-else class="mx-auto max-w-8xl px-6 pt-10 font-display text-3xl">{{ category?.name }}</h1>

    <div class="mx-auto max-w-8xl px-6 py-10">
      <p v-if="category?.description" class="mb-8 max-w-2xl text-sm text-ink-950/60">{{ category.description }}</p>
      <p v-if="pending" class="text-sm text-ink-950/50">Loading…</p>
      <p v-else-if="!products?.items.length" class="text-sm text-ink-950/50">No products in this category yet.</p>
      <ProductGrid v-else :products="products.items" />
    </div>
  </div>
</template>
