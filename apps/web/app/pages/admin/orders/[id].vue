<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin-auth" });

const adminAuth = useAdminAuthStore();
const route = useRoute();
const id = String(route.params.id);

const { data: order, refresh } = await useAsyncData(`admin-order-${id}`, () =>
  adminAuth.authFetch<any>(`/admin/orders/${id}`),
);

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["RETURN_REQUESTED"],
  CANCELLED: [],
  RETURN_REQUESTED: ["RETURNED"],
  RETURNED: ["REFUNDED"],
  REFUNDED: [],
};

const nextStatuses = computed(() => (order.value ? (ALLOWED_TRANSITIONS[order.value.status] ?? []) : []));
const selectedNextStatus = ref("");
const statusNote = ref("");
const updating = ref(false);

async function updateStatus() {
  if (!selectedNextStatus.value) return;
  updating.value = true;
  try {
    await adminAuth.authFetch(`/admin/orders/${id}/status`, {
      method: "PATCH",
      body: { status: selectedNextStatus.value, note: statusNote.value || undefined },
    });
    selectedNextStatus.value = "";
    statusNote.value = "";
    await refresh();
  } finally {
    updating.value = false;
  }
}

const downloadingInvoice = ref(false);
async function downloadInvoice() {
  downloadingInvoice.value = true;
  try {
    const blob = await adminAuth.authFetch<Blob>(`/admin/orders/${id}/invoice`, { responseType: "blob" });
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

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

useSeoMeta({ title: () => (order.value ? `Order #${order.value.orderNumber}` : "Order") });
</script>

<template>
  <div>
    <NuxtLink to="/admin/orders" class="text-sm font-medium underline">&larr; Orders</NuxtLink>

    <div v-if="order" class="mt-6">
      <div class="flex items-center justify-between">
        <h1 class="font-display text-2xl">Order #{{ order.orderNumber }}</h1>
        <span class="rounded-full bg-ink-900/5 px-3 py-1 text-xs font-medium uppercase">{{ order.status }}</span>
      </div>
      <p class="mt-1 text-sm text-ink-950/50">
        Placed {{ new Date(order.placedAt).toLocaleString() }} by {{ order.user?.email }}
      </p>

      <div class="mt-8 grid gap-6 md:grid-cols-2">
        <div class="rounded-xl border border-ink-950/10 p-5 text-sm">
          <h2 class="mb-2 font-display text-base">Shipping To</h2>
          <p>{{ order.shipToName }}</p>
          <p class="text-ink-950/60">{{ order.shipToLine1 }}, {{ order.shipToLine2 ? order.shipToLine2 + ", " : "" }}{{ order.shipToCity }}, {{ order.shipToState }} {{ order.shipToPostalCode }}</p>
          <p class="text-ink-950/60">{{ order.shipToPhone }}</p>
        </div>
        <div class="rounded-xl border border-ink-950/10 p-5 text-sm">
          <h2 class="mb-2 font-display text-base">Payment</h2>
          <div v-for="p in order.payments" :key="p.id" class="flex justify-between text-ink-950/60">
            <span>{{ p.gateway }} — {{ p.status }}</span>
            <span>{{ formatPrice(p.amount) }}</span>
          </div>
        </div>
      </div>

      <div class="mt-6 rounded-xl border border-ink-950/10 p-5">
        <h2 class="mb-3 font-display text-base">Items</h2>
        <ul class="space-y-2 text-sm text-ink-950/70">
          <li v-for="item in order.items" :key="item.id" class="flex justify-between">
            <span>{{ item.productName }}<span v-if="item.variantLabel" class="text-ink-950/40"> ({{ item.variantLabel }})</span> × {{ item.quantity }}</span>
            <span>{{ formatPrice(item.lineTotal) }}</span>
          </li>
        </ul>
        <div class="mt-4 space-y-1 border-t border-ink-950/10 pt-4 text-sm">
          <div class="flex justify-between text-ink-950/60"><span>Subtotal</span><span>{{ formatPrice(order.subtotal) }}</span></div>
          <div v-if="order.discountAmount" class="flex justify-between text-green-700"><span>Discount{{ order.coupon ? ` (${order.coupon.code})` : "" }}</span><span>-{{ formatPrice(order.discountAmount) }}</span></div>
          <div class="flex justify-between text-ink-950/60"><span>Shipping</span><span>{{ formatPrice(order.shippingAmount) }}</span></div>
          <div class="flex justify-between text-ink-950/60"><span>Tax (GST)</span><span>{{ formatPrice(order.taxAmount) }}</span></div>
          <div class="flex justify-between border-t border-ink-950/10 pt-2 font-semibold"><span>Total</span><span>{{ formatPrice(order.totalAmount) }}</span></div>
        </div>
      </div>

      <div class="mt-6 rounded-xl border border-ink-950/10 p-5">
        <h2 class="mb-3 font-display text-base">Status Timeline</h2>
        <ul class="space-y-1 text-sm">
          <li v-for="h in order.statusHistory" :key="h.id" class="flex justify-between text-ink-950/60">
            <span>{{ h.status }}<span v-if="h.note" class="text-ink-950/40"> — {{ h.note }}</span></span>
            <span>{{ new Date(h.createdAt).toLocaleString() }}</span>
          </li>
        </ul>

        <div v-if="nextStatuses.length" class="mt-4 flex flex-wrap items-end gap-3 border-t border-ink-950/10 pt-4">
          <div>
            <label class="mb-1 block text-xs uppercase tracking-wide text-ink-950/40">Move to</label>
            <select v-model="selectedNextStatus" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm">
              <option value="">Select status…</option>
              <option v-for="s in nextStatuses" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <input v-model="statusNote" placeholder="Note (optional)" class="flex-1 rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <button
            :disabled="!selectedNextStatus || updating"
            class="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-40"
            @click="updateStatus"
          >
            Update
          </button>
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
