<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const auth = useAuthStore();
const route = useRoute();
const id = String(route.params.id);

const { data: order, refresh } = await useAsyncData(`order-detail-${id}`, () => auth.authFetch<any>(`/orders/${id}`));

// See checkout.vue for why this refetch is needed on a fresh page load.
onMounted(refresh);

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

// A plain <a href> can't attach the customer's bearer token (it lives in
// memory, not a cookie the browser sends automatically), so the invoice is
// fetched as a blob through the same authenticated client and downloaded
// via an object URL instead.
const downloadingInvoice = ref(false);
async function downloadInvoice() {
  downloadingInvoice.value = true;
  try {
    const blob = await auth.authFetch<Blob>(`/orders/${id}/invoice`, { responseType: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${order.value?.orderNumber ?? id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } finally {
    downloadingInvoice.value = false;
  }
}

useSeoMeta({ title: () => (order.value ? `Order #${order.value.orderNumber}` : "Order") });
</script>

<template>
  <div class="mx-auto max-w-3xl px-6 py-14">
    <NuxtLink to="/orders" class="text-sm font-medium underline">&larr; My Orders</NuxtLink>

    <div v-if="order" class="mt-6">
      <div class="flex items-center justify-between">
        <h1 class="font-display text-2xl">Order #{{ order.orderNumber }}</h1>
        <span class="rounded-full bg-ink-900/5 px-3 py-1 text-xs font-medium uppercase">{{ order.status }}</span>
      </div>
      <p class="mt-1 text-sm text-ink-950/50">Placed {{ new Date(order.placedAt).toLocaleString() }}</p>

      <div class="mt-8 grid gap-6 md:grid-cols-2">
        <div class="rounded-xl border border-ink-950/10 p-5 text-sm">
          <h2 class="mb-2 font-display text-base">Shipping To</h2>
          <p>{{ order.shipToName }}</p>
          <p class="text-ink-950/60">{{ order.shipToLine1 }}, {{ order.shipToLine2 ? order.shipToLine2 + ", " : "" }}{{ order.shipToCity }}, {{ order.shipToState }} {{ order.shipToPostalCode }}</p>
          <p class="text-ink-950/60">{{ order.shipToPhone }}</p>
        </div>
        <div class="rounded-xl border border-ink-950/10 p-5 text-sm">
          <h2 class="mb-2 font-display text-base">Status Timeline</h2>
          <ul class="space-y-1">
            <li v-for="h in order.statusHistory" :key="h.id" class="flex justify-between text-ink-950/60">
              <span>{{ h.status }}</span>
              <span>{{ new Date(h.createdAt).toLocaleDateString() }}</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-6 rounded-xl border border-ink-950/10 p-5">
        <ul class="space-y-2 text-sm text-ink-950/70">
          <li v-for="item in order.items" :key="item.id" class="flex justify-between">
            <span>{{ item.productName }}<span v-if="item.variantLabel" class="text-ink-950/40"> ({{ item.variantLabel }})</span> × {{ item.quantity }}</span>
            <span>{{ formatPrice(item.lineTotal) }}</span>
          </li>
        </ul>
        <div class="mt-4 space-y-1 border-t border-ink-950/10 pt-4 text-sm">
          <div class="flex justify-between text-ink-950/60"><span>Subtotal</span><span>{{ formatPrice(order.subtotal) }}</span></div>
          <div v-if="order.discountAmount" class="flex justify-between text-green-700"><span>Discount</span><span>-{{ formatPrice(order.discountAmount) }}</span></div>
          <div class="flex justify-between text-ink-950/60"><span>Shipping</span><span>{{ formatPrice(order.shippingAmount) }}</span></div>
          <div class="flex justify-between text-ink-950/60"><span>Tax (GST)</span><span>{{ formatPrice(order.taxAmount) }}</span></div>
          <div class="flex justify-between border-t border-ink-950/10 pt-2 font-semibold"><span>Total</span><span>{{ formatPrice(order.totalAmount) }}</span></div>
        </div>
      </div>

      <button
        :disabled="downloadingInvoice"
        class="mt-6 rounded-full border border-ink-950/15 px-6 py-3 text-sm font-medium disabled:opacity-50"
        @click="downloadInvoice"
      >
        {{ downloadingInvoice ? "Preparing..." : "Download Invoice" }}
      </button>
    </div>
  </div>
</template>
