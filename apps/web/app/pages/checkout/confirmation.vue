<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const auth = useAuthStore();
const route = useRoute();
const orderId = computed(() => String(route.query.orderId ?? ""));

// Source of truth is the order record itself, never the redirect's query
// params — a PayU postback status is never trusted client-side either.
const { data: order, pending, error, refresh } = await useAsyncData(
  () => `order-${orderId.value}`,
  () => auth.authFetch<any>(`/orders/${orderId.value}`),
  { watch: [orderId] },
);

// This page is reached via PayU's redirect — a hard browser navigation, not
// an SPA route change — so it hits the same stale-SSR-fetch issue described
// in checkout.vue every single time. Refetch once the client token is live.
onMounted(refresh);

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting payment",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

useSeoMeta({ title: "Order Confirmation" });
</script>

<template>
  <div class="mx-auto max-w-2xl px-6 py-16 text-center">
    <div v-if="pending">
      <p class="text-sm text-ink-950/50">Loading your order...</p>
    </div>
    <div v-else-if="error || !order">
      <h1 class="font-display text-2xl">We couldn't find that order</h1>
      <NuxtLink to="/orders" class="mt-4 inline-block text-sm font-medium underline">View your orders</NuxtLink>
    </div>
    <div v-else>
      <p class="font-display text-sm uppercase tracking-wide text-accent">{{ STATUS_LABEL[order.status] ?? order.status }}</p>
      <h1 class="mt-2 font-display text-3xl">
        {{ order.status === "PENDING" ? "Order received" : "Thank you for your order" }}
      </h1>
      <p class="mt-2 text-ink-950/60">Order #{{ order.orderNumber }}</p>

      <div class="mt-8 rounded-2xl border border-ink-950/10 p-6 text-left">
        <ul class="space-y-2 text-sm text-ink-950/70">
          <li v-for="item in order.items" :key="item.id" class="flex justify-between">
            <span>{{ item.productName }} × {{ item.quantity }}</span>
            <span>{{ formatPrice(item.lineTotal) }}</span>
          </li>
        </ul>
        <div class="mt-4 flex justify-between border-t border-ink-950/10 pt-4 font-semibold">
          <span>Total</span>
          <span>{{ formatPrice(order.totalAmount) }}</span>
        </div>
      </div>

      <div class="mt-8 flex justify-center gap-4">
        <NuxtLink :to="`/orders/${order.id}`" class="rounded-full bg-ink-950 px-6 py-3 text-sm font-semibold text-paper">
          View Order
        </NuxtLink>
        <NuxtLink to="/shop" class="rounded-full border border-ink-950/15 px-6 py-3 text-sm font-medium">
          Continue Shopping
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
