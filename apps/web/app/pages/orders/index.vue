<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const auth = useAuthStore();

const { data, refresh } = await useAsyncData("my-orders", () =>
  auth.authFetch<{ items: any[]; total: number }>("/orders"),
);

// See checkout.vue for why this refetch is needed on a fresh page load.
onMounted(refresh);

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

useSeoMeta({ title: "My Orders" });
</script>

<template>
  <div class="mx-auto max-w-3xl px-6 py-14">
    <h1 class="mb-10 font-display text-3xl">My Orders</h1>

    <p v-if="!data?.items.length" class="text-sm text-ink-950/50">You haven't placed any orders yet.</p>
    <ul v-else class="space-y-3">
      <li v-for="order in data.items" :key="order.id">
        <NuxtLink :to="`/orders/${order.id}`" class="flex items-center justify-between rounded-xl border border-ink-950/10 p-5 text-sm hover:border-ink-950/30">
          <div>
            <p class="font-medium">Order #{{ order.orderNumber }}</p>
            <p class="text-ink-950/50">{{ new Date(order.placedAt).toLocaleDateString() }} · {{ order.items.length }} item(s)</p>
          </div>
          <div class="text-right">
            <p class="font-semibold">{{ formatPrice(order.totalAmount) }}</p>
            <p class="text-ink-950/50">{{ order.status }}</p>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
