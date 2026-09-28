<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin-auth" });

const adminAuth = useAdminAuthStore();
const { confirm } = useConfirm();

const { data, refresh } = await useAsyncData("admin-coupons", () =>
  adminAuth.authFetch<{ items: any[]; total: number }>("/admin/coupons", { query: { pageSize: 100 } }),
);

const showForm = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({
  code: "",
  type: "PERCENTAGE" as "PERCENTAGE" | "FIXED" | "FREE_SHIPPING",
  value: 0,
  minOrderAmount: undefined as number | undefined,
  maxDiscountAmount: undefined as number | undefined,
  usageLimit: undefined as number | undefined,
  usageLimitPerCustomer: undefined as number | undefined,
  startAt: "",
  endAt: "",
  isActive: true,
});

function resetForm() {
  Object.assign(form, {
    code: "",
    type: "PERCENTAGE",
    value: 0,
    minOrderAmount: undefined,
    maxDiscountAmount: undefined,
    usageLimit: undefined,
    usageLimitPerCustomer: undefined,
    startAt: "",
    endAt: "",
    isActive: true,
  });
  editingId.value = null;
}

function startCreate() {
  resetForm();
  showForm.value = true;
}

function startEdit(coupon: any) {
  editingId.value = coupon.id;
  Object.assign(form, {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minOrderAmount: coupon.minOrderAmount ?? undefined,
    maxDiscountAmount: coupon.maxDiscountAmount ?? undefined,
    usageLimit: coupon.usageLimit ?? undefined,
    usageLimitPerCustomer: coupon.usageLimitPerCustomer ?? undefined,
    startAt: coupon.startAt ? coupon.startAt.slice(0, 10) : "",
    endAt: coupon.endAt ? coupon.endAt.slice(0, 10) : "",
    isActive: coupon.isActive,
  });
  showForm.value = true;
}

async function submit() {
  const body = { ...form, startAt: form.startAt || undefined, endAt: form.endAt || undefined };
  if (editingId.value) {
    await adminAuth.authFetch(`/admin/coupons/${editingId.value}`, { method: "PATCH", body });
  } else {
    await adminAuth.authFetch("/admin/coupons", { method: "POST", body });
  }
  showForm.value = false;
  resetForm();
  await refresh();
}

async function remove(coupon: any) {
  const ok = await confirm({ title: "Delete coupon?", message: `"${coupon.code}" will be permanently removed.` });
  if (!ok) return;
  await adminAuth.authFetch(`/admin/coupons/${coupon.id}`, { method: "DELETE" });
  await refresh();
}

function formatValue(coupon: any) {
  if (coupon.type === "PERCENTAGE") return `${coupon.value}%`;
  if (coupon.type === "FIXED") return `₹${coupon.value}`;
  return "Free shipping";
}

useSeoMeta({ title: "Coupons" });
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="font-display text-2xl">Coupons</h1>
      <button class="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-paper" @click="startCreate">+ New Coupon</button>
    </div>

    <div v-if="showForm" class="mb-8 rounded-xl border border-ink-950/10 p-6">
      <h2 class="mb-4 font-display text-lg">{{ editingId ? "Edit" : "Create" }} Coupon</h2>
      <form class="grid grid-cols-2 gap-4" @submit.prevent="submit">
        <input v-model="form.code" placeholder="Code (e.g. SAVE10)" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm uppercase" />
        <select v-model="form.type" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm">
          <option value="PERCENTAGE">Percentage</option>
          <option value="FIXED">Fixed amount</option>
          <option value="FREE_SHIPPING">Free shipping</option>
        </select>
        <label class="text-sm">
          Value ({{ form.type === "PERCENTAGE" ? "%" : "₹" }})
          <input v-model.number="form.value" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        </label>
        <label class="text-sm">
          Min order amount
          <input v-model.number="form.minOrderAmount" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        </label>
        <label class="text-sm">
          Max discount amount
          <input v-model.number="form.maxDiscountAmount" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        </label>
        <label class="text-sm">
          Total usage limit
          <input v-model.number="form.usageLimit" type="number" min="1" class="mt-1 w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        </label>
        <label class="text-sm">
          Usage limit per customer
          <input v-model.number="form.usageLimitPerCustomer" type="number" min="1" class="mt-1 w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        </label>
        <label class="text-sm">
          Starts
          <input v-model="form.startAt" type="date" class="mt-1 w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        </label>
        <label class="text-sm">
          Ends
          <input v-model="form.endAt" type="date" class="mt-1 w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        </label>
        <label class="flex items-center gap-2 text-sm"><input v-model="form.isActive" type="checkbox" /> Active</label>
        <div class="col-span-2 flex gap-3">
          <button type="submit" class="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-paper">Save</button>
          <button type="button" class="rounded-full border border-ink-950/15 px-5 py-2.5 text-sm" @click="showForm = false">Cancel</button>
        </div>
      </form>
    </div>

    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-ink-950/10 text-left text-xs uppercase tracking-wide text-ink-950/40">
          <th class="py-2">Code</th>
          <th>Value</th>
          <th>Window</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="coupon in data?.items" :key="coupon.id" class="border-b border-ink-950/5">
          <td class="py-3 font-medium">{{ coupon.code }}</td>
          <td class="text-ink-950/60">{{ formatValue(coupon) }}</td>
          <td class="text-ink-950/60">
            <span v-if="coupon.startAt || coupon.endAt">
              {{ coupon.startAt ? new Date(coupon.startAt).toLocaleDateString() : "…" }} –
              {{ coupon.endAt ? new Date(coupon.endAt).toLocaleDateString() : "…" }}
            </span>
            <span v-else>Always</span>
          </td>
          <td><span :class="coupon.isActive ? 'text-green-600' : 'text-ink-950/40'">{{ coupon.isActive ? "Active" : "Inactive" }}</span></td>
          <td class="space-x-3 text-right">
            <button class="text-ink-950/60 hover:text-ink-950" @click="startEdit(coupon)">Edit</button>
            <button class="text-red-500 hover:text-red-700" @click="remove(coupon)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
