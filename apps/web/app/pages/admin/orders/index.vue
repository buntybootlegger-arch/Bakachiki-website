<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin-auth" });

const adminAuth = useAdminAuthStore();
const search = ref("");
const status = ref("");
const dateFrom = ref("");
const dateTo = ref("");

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
];

const { data, pending } = await useAsyncData(
  () => `admin-orders-${search.value}-${status.value}-${dateFrom.value}-${dateTo.value}`,
  () =>
    adminAuth.authFetch<{ items: any[]; total: number }>("/admin/orders", {
      query: {
        search: search.value || undefined,
        status: status.value || undefined,
        dateFrom: dateFrom.value || undefined,
        dateTo: dateTo.value || undefined,
        pageSize: 50,
      },
    }),
  { watch: [search, status, dateFrom, dateTo] },
);

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

useSeoMeta({ title: "Orders" });
</script>

<template>
  <div>
    <h1 class="mb-6 font-display text-2xl">Orders</h1>

    <div class="mb-6 flex flex-wrap gap-3">
      <input v-model="search" placeholder="Search order # or email…" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      <select v-model="status" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm">
        <option value="">All statuses</option>
        <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
      </select>
      <input v-model="dateFrom" type="date" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      <input v-model="dateTo" type="date" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
    </div>

    <p v-if="pending" class="text-sm text-ink-950/50">Loading…</p>
    <table v-else class="w-full text-sm">
      <thead>
        <tr class="border-b border-ink-950/10 text-left text-xs uppercase tracking-wide text-ink-950/40">
          <th class="py-2">Order</th>
          <th>Customer</th>
          <th>Date</th>
          <th>Status</th>
          <th>Total</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in data?.items" :key="order.id" class="border-b border-ink-950/5">
          <td class="py-3 font-medium">{{ order.orderNumber }}</td>
          <td class="text-ink-950/60">{{ order.user?.email }}</td>
          <td class="text-ink-950/60">{{ new Date(order.placedAt).toLocaleDateString() }}</td>
          <td class="text-ink-950/60">{{ order.status }}</td>
          <td>{{ formatPrice(order.totalAmount) }}</td>
          <td class="text-right">
            <NuxtLink :to="`/admin/orders/${order.id}`" class="text-ink-950/60 hover:text-ink-950">View</NuxtLink>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="!pending && !data?.items.length" class="mt-6 text-sm text-ink-950/50">No orders match these filters.</p>
  </div>
</template>
