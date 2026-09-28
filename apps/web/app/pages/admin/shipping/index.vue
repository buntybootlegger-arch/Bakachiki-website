<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin-auth" });

const adminAuth = useAdminAuthStore();
const { confirm } = useConfirm();

const { data: zones, refresh } = await useAsyncData("admin-shipping-zones", () =>
  adminAuth.authFetch<any[]>("/admin/shipping/zones"),
);

const showZoneForm = ref(false);
const zoneForm = reactive({ name: "", countries: "IN", states: "", isActive: true });

async function submitZone() {
  await adminAuth.authFetch("/admin/shipping/zones", {
    method: "POST",
    body: {
      name: zoneForm.name,
      countries: zoneForm.countries.split(",").map((s) => s.trim()).filter(Boolean),
      states: zoneForm.states.split(",").map((s) => s.trim()).filter(Boolean),
      isActive: zoneForm.isActive,
    },
  });
  showZoneForm.value = false;
  Object.assign(zoneForm, { name: "", countries: "IN", states: "", isActive: true });
  await refresh();
}

async function removeZone(zone: any) {
  const ok = await confirm({ title: "Delete zone?", message: `"${zone.name}" and its rates will be permanently removed.` });
  if (!ok) return;
  await adminAuth.authFetch(`/admin/shipping/zones/${zone.id}`, { method: "DELETE" });
  await refresh();
}

const rateFormZoneId = ref<string | null>(null);
const rateForm = reactive({ label: "", baseRate: 0, perKgRate: 0, freeShippingThreshold: undefined as number | undefined, codAvailable: true });

function startRate(zoneId: string) {
  rateFormZoneId.value = zoneId;
  Object.assign(rateForm, { label: "", baseRate: 0, perKgRate: 0, freeShippingThreshold: undefined, codAvailable: true });
}

async function submitRate() {
  if (!rateFormZoneId.value) return;
  await adminAuth.authFetch("/admin/shipping/rates", { method: "POST", body: { ...rateForm, zoneId: rateFormZoneId.value } });
  rateFormZoneId.value = null;
  await refresh();
}

async function removeRate(rate: any) {
  const ok = await confirm({ title: "Delete rate?", message: `"${rate.label}" will be permanently removed.` });
  if (!ok) return;
  await adminAuth.authFetch(`/admin/shipping/rates/${rate.id}`, { method: "DELETE" });
  await refresh();
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

useSeoMeta({ title: "Shipping" });
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="font-display text-2xl">Shipping</h1>
      <button class="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-paper" @click="showZoneForm = !showZoneForm">
        {{ showZoneForm ? "Cancel" : "+ New Zone" }}
      </button>
    </div>

    <form v-if="showZoneForm" class="mb-8 grid grid-cols-2 gap-4 rounded-xl border border-ink-950/10 p-6" @submit.prevent="submitZone">
      <input v-model="zoneForm.name" placeholder="Zone name (e.g. India)" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      <input v-model="zoneForm.countries" placeholder="Countries (comma-separated, e.g. IN)" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      <input v-model="zoneForm.states" placeholder="States (comma-separated, blank = whole country)" class="col-span-2 rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      <label class="flex items-center gap-2 text-sm"><input v-model="zoneForm.isActive" type="checkbox" /> Active</label>
      <button type="submit" class="col-span-2 rounded-full bg-ink-950 py-2.5 text-sm font-semibold text-paper">Save Zone</button>
    </form>

    <div class="space-y-6">
      <div v-for="zone in zones" :key="zone.id" class="rounded-xl border border-ink-950/10 p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">{{ zone.name }}</p>
            <p class="text-xs text-ink-950/50">
              {{ zone.countries.join(", ") }} · {{ zone.states.length ? zone.states.join(", ") : "Whole country" }}
              · <span :class="zone.isActive ? 'text-green-600' : 'text-ink-950/40'">{{ zone.isActive ? "Active" : "Inactive" }}</span>
            </p>
          </div>
          <div class="space-x-3 text-sm">
            <button class="text-ink-950/60 hover:text-ink-950" @click="startRate(zone.id)">+ Add Rate</button>
            <button class="text-red-500 hover:text-red-700" @click="removeZone(zone)">Delete</button>
          </div>
        </div>

        <table v-if="zone.rates?.length" class="mt-4 w-full text-sm">
          <thead>
            <tr class="border-b border-ink-950/10 text-left text-xs uppercase tracking-wide text-ink-950/40">
              <th class="py-2">Label</th>
              <th>Base</th>
              <th>Per kg</th>
              <th>Free above</th>
              <th>COD</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rate in zone.rates" :key="rate.id" class="border-b border-ink-950/5">
              <td class="py-2">{{ rate.label }}</td>
              <td>{{ formatPrice(rate.baseRate) }}</td>
              <td>{{ formatPrice(rate.perKgRate) }}</td>
              <td>{{ rate.freeShippingThreshold != null ? formatPrice(rate.freeShippingThreshold) : "—" }}</td>
              <td>{{ rate.codAvailable ? "Yes" : "No" }}</td>
              <td class="text-right"><button class="text-red-500 hover:text-red-700" @click="removeRate(rate)">Delete</button></td>
            </tr>
          </tbody>
        </table>
        <p v-else class="mt-3 text-sm text-ink-950/50">No rates yet — add one to make this zone usable at checkout.</p>

        <form v-if="rateFormZoneId === zone.id" class="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-ink-900/5 p-4" @submit.prevent="submitRate">
          <input v-model="rateForm.label" placeholder="Label (e.g. Standard Shipping)" required class="col-span-2 rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <label class="text-sm">
            Base rate
            <input v-model.number="rateForm.baseRate" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          </label>
          <label class="text-sm">
            Per kg rate
            <input v-model.number="rateForm.perKgRate" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          </label>
          <label class="text-sm">
            Free shipping above
            <input v-model.number="rateForm.freeShippingThreshold" type="number" min="0" step="0.01" class="mt-1 w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          </label>
          <label class="flex items-center gap-2 text-sm"><input v-model="rateForm.codAvailable" type="checkbox" /> COD available</label>
          <div class="col-span-2 flex gap-3">
            <button type="submit" class="rounded-full bg-ink-950 px-5 py-2 text-sm font-semibold text-paper">Save Rate</button>
            <button type="button" class="rounded-full border border-ink-950/15 px-5 py-2 text-sm" @click="rateFormZoneId = null">Cancel</button>
          </div>
        </form>
      </div>
    </div>
    <p v-if="!zones?.length" class="text-sm text-ink-950/50">No shipping zones yet. Add one to enable checkout.</p>
  </div>
</template>
