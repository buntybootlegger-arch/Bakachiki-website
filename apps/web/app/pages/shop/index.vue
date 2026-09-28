<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const api = useApi();

const page = computed(() => Number(route.query.page ?? 1));

const query = computed(() => ({
  categorySlug: route.query.category as string | undefined,
  brandSlug: route.query.brand as string | undefined,
  search: route.query.search as string | undefined,
  featured: route.query.featured ? true : undefined,
  newArrival: route.query.newArrival ? true : undefined,
  bestSeller: route.query.bestSeller ? true : undefined,
  sort: (route.query.sort as string | undefined) ?? "newest",
  page: page.value,
  pageSize: 12,
}));

const { data, pending, refresh } = await useAsyncData(
  () => `shop-${JSON.stringify(query.value)}`,
  () => api<{ items: any[]; total: number; totalPages: number }>("/products", { query: query.value }),
  { watch: [query] },
);

const { data: categories } = await useAsyncData("shop-categories", () => api<any[]>("/categories"));
const { data: brands } = await useAsyncData("shop-brands", () => api<any[]>("/brands"));

function updateQuery(patch: Record<string, string | undefined>) {
  router.push({ query: { ...route.query, ...patch, page: undefined } });
}

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A–Z" },
];

useSeoMeta({ title: "Shop" });
</script>

<template>
  <div class="mx-auto max-w-8xl px-6 py-10">
    <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <h1 class="font-display text-4xl font-extrabold uppercase tracking-tight md:text-5xl">Shop</h1>
      <div class="flex flex-wrap items-center gap-3 text-sm">
        <select
          class="rounded-full border-2 border-ink-950 bg-transparent px-4 py-2"
          :value="route.query.category ?? ''"
          @change="updateQuery({ category: ($event.target as HTMLSelectElement).value || undefined })"
        >
          <option value="">All Categories</option>
          <option v-for="c in categories" :key="c.id" :value="c.slug">{{ c.name }}</option>
        </select>
        <select
          class="rounded-full border-2 border-ink-950 bg-transparent px-4 py-2"
          :value="route.query.brand ?? ''"
          @change="updateQuery({ brand: ($event.target as HTMLSelectElement).value || undefined })"
        >
          <option value="">All Brands</option>
          <option v-for="b in brands" :key="b.id" :value="b.slug">{{ b.name }}</option>
        </select>
        <select
          class="rounded-full border-2 border-ink-950 bg-transparent px-4 py-2"
          :value="route.query.sort ?? 'newest'"
          @change="updateQuery({ sort: ($event.target as HTMLSelectElement).value })"
        >
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <p v-if="pending" class="text-sm text-ink-950/50">Loading…</p>
    <p v-else-if="!data?.items.length" class="text-sm text-ink-950/50">No products found.</p>
    <ProductGrid v-else :products="data.items" />

    <div v-if="data && data.totalPages > 1" class="mt-12 flex justify-center gap-2">
      <button
        v-for="p in data.totalPages"
        :key="p"
        class="h-9 w-9 rounded-full text-sm font-semibold"
        :class="p === page ? 'bg-ink-950 text-cream' : 'border-2 border-ink-950'"
        @click="router.push({ query: { ...route.query, page: p } })"
      >
        {{ p }}
      </button>
    </div>
  </div>
</template>
