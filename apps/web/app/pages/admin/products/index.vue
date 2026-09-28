<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin-auth" });

const adminAuth = useAdminAuthStore();
const { confirm } = useConfirm();
const search = ref("");

const { data, refresh, pending } = await useAsyncData(
  () => `admin-products-${search.value}`,
  () => adminAuth.authFetch<{ items: any[]; total: number }>("/admin/products", { query: { search: search.value || undefined, pageSize: 50 } }),
  { watch: [search] },
);

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

async function remove(product: any) {
  const ok = await confirm({ title: "Delete product?", message: `"${product.name}" will be permanently removed.` });
  if (!ok) return;
  await adminAuth.authFetch(`/admin/products/${product.id}`, { method: "DELETE" });
  await refresh();
}

useSeoMeta({ title: "Products" });
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="font-display text-2xl">Products</h1>
      <NuxtLink to="/admin/products/new" class="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-paper">
        + New Product
      </NuxtLink>
    </div>

    <input
      v-model="search"
      placeholder="Search by name or SKU…"
      class="mb-6 w-full max-w-sm rounded-lg border border-ink-950/15 px-3 py-2 text-sm"
    />

    <p v-if="pending" class="text-sm text-ink-950/50">Loading…</p>
    <table v-else class="w-full text-sm">
      <thead>
        <tr class="border-b border-ink-950/10 text-left text-xs uppercase tracking-wide text-ink-950/40">
          <th class="py-2">Product</th>
          <th>SKU</th>
          <th>Category</th>
          <th>Price</th>
          <th>Stock</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in data?.items" :key="product.id" class="border-b border-ink-950/5">
          <td class="flex items-center gap-3 py-3">
            <img :src="product.images?.[0]?.url ?? 'https://placehold.co/60x75?text=%20'" alt="" class="h-10 w-8 rounded object-cover" />
            <span class="font-medium">{{ product.name }}</span>
          </td>
          <td class="text-ink-950/60">{{ product.sku }}</td>
          <td class="text-ink-950/60">{{ product.category?.name }}</td>
          <td>{{ formatPrice(product.salePrice ?? product.price) }}</td>
          <td :class="product.stock <= product.lowStockThreshold ? 'text-red-500' : ''">{{ product.stock }}</td>
          <td class="space-x-3 text-right">
            <NuxtLink :to="`/admin/products/${product.id}`" class="text-ink-950/60 hover:text-ink-950">Edit</NuxtLink>
            <button class="text-red-500 hover:text-red-700" @click="remove(product)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
