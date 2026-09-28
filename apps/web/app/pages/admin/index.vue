<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin-auth" });

const adminAuth = useAdminAuthStore();

const { data: products } = await useAsyncData("admin-dashboard-products", () =>
  adminAuth.authFetch<{ total: number; items: any[] }>("/admin/products", { query: { pageSize: 100 } }),
);
const { data: categories } = await useAsyncData("admin-dashboard-categories", () =>
  adminAuth.authFetch<any[]>("/admin/categories"),
);
const { data: brands } = await useAsyncData("admin-dashboard-brands", () =>
  adminAuth.authFetch<any[]>("/admin/brands"),
);
const { data: admins } = await useAsyncData("admin-dashboard-admins", () =>
  adminAuth.authFetch<any[]>("/admins"),
);
const { data: orderSummary } = await useAsyncData("admin-dashboard-orders", () =>
  adminAuth.authFetch<{ totalOrders: number; totalRevenue: number }>("/admin/orders/summary"),
);

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

const lowStockProducts = computed(() =>
  (products.value?.items ?? []).filter((p: any) => p.stock <= (p.lowStockThreshold ?? 5)),
);

useSeoMeta({ title: "Dashboard" });
</script>

<template>
  <div>
    <h1 class="mb-8 font-display text-2xl">Dashboard</h1>

    <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
      <div class="rounded-xl border border-ink-950/10 p-5">
        <p class="text-xs uppercase tracking-wide text-ink-950/40">Total Orders</p>
        <p class="mt-2 text-3xl font-semibold">{{ orderSummary?.totalOrders ?? 0 }}</p>
      </div>
      <div class="rounded-xl border border-ink-950/10 p-5">
        <p class="text-xs uppercase tracking-wide text-ink-950/40">Total Revenue</p>
        <p class="mt-2 text-3xl font-semibold">{{ formatPrice(orderSummary?.totalRevenue ?? 0) }}</p>
      </div>
      <div class="rounded-xl border border-ink-950/10 p-5">
        <p class="text-xs uppercase tracking-wide text-ink-950/40">Products</p>
        <p class="mt-2 text-3xl font-semibold">{{ products?.total ?? 0 }}</p>
      </div>
      <div class="rounded-xl border border-ink-950/10 p-5">
        <p class="text-xs uppercase tracking-wide text-ink-950/40">Categories</p>
        <p class="mt-2 text-3xl font-semibold">{{ categories?.length ?? 0 }}</p>
      </div>
      <div class="rounded-xl border border-ink-950/10 p-5">
        <p class="text-xs uppercase tracking-wide text-ink-950/40">Brands</p>
        <p class="mt-2 text-3xl font-semibold">{{ brands?.length ?? 0 }}</p>
      </div>
      <div class="rounded-xl border border-ink-950/10 p-5">
        <p class="text-xs uppercase tracking-wide text-ink-950/40">Admins</p>
        <p class="mt-2 text-3xl font-semibold">{{ admins?.length ?? 0 }}</p>
      </div>
    </div>

    <div class="mt-10">
      <h2 class="mb-4 font-display text-lg">Low Stock Alerts</h2>
      <p v-if="!lowStockProducts.length" class="text-sm text-ink-950/50">Nothing running low right now.</p>
      <ul v-else class="divide-y divide-ink-950/10 rounded-xl border border-ink-950/10">
        <li v-for="p in lowStockProducts" :key="p.id" class="flex items-center justify-between px-4 py-3 text-sm">
          <span>{{ p.name }} <span class="text-ink-950/40">({{ p.sku }})</span></span>
          <span class="font-medium text-red-500">{{ p.stock }} left</span>
        </li>
      </ul>
    </div>

    <p class="mt-10 text-xs text-ink-950/40">
      A full Analytics &amp; BI dashboard (trends, top products, cohort views) arrives in a later phase.
    </p>
  </div>
</template>
