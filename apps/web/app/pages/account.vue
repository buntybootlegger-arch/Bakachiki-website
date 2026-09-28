<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const auth = useAuthStore();
const router = useRouter();

const { data: addresses, refresh: refreshAddresses } = await useAsyncData("my-addresses", () =>
  auth.authFetch<any[]>("/users/me/addresses"),
);

const showAddressForm = ref(false);
const form = reactive({
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "IN",
  isDefault: false,
});

async function submitAddress() {
  await auth.authFetch("/users/me/addresses", { method: "POST", body: form });
  showAddressForm.value = false;
  Object.assign(form, { fullName: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "", isDefault: false });
  await refreshAddresses();
}

async function removeAddress(id: string) {
  await auth.authFetch(`/users/me/addresses/${id}`, { method: "DELETE" });
  await refreshAddresses();
}

async function logout() {
  await auth.logout();
  router.push("/");
}

// Customer auth tokens live in memory client-side only (see
// middleware/auth.ts) — on a fresh/hard page load, the addresses fetch
// above ran server-side with no token. The middleware's tryRefresh() has
// resolved by the time onMounted fires, so refetch with the real token.
onMounted(refreshAddresses);

useSeoMeta({ title: "My Account" });
</script>

<template>
  <div class="mx-auto max-w-3xl px-6 py-14">
    <div class="mb-10 flex items-center justify-between">
      <!--
        ClientOnly, not a plain binding: auth.user is set by middleware
        BEFORE this component mounts (see middleware/auth.ts), so on a
        fresh page load the server-rendered "" and the client's already-
        resolved value mismatch at hydration time. Vue intentionally does
        not repaint text-only hydration mismatches, so without ClientOnly
        this greeting stays permanently blank until some unrelated update
        touches it.
      -->
      <div>
        <ClientOnly>
          <h1 class="font-display text-3xl">Hi, {{ auth.user?.firstName || auth.user?.email }}</h1>
          <p class="text-sm text-ink-950/50">{{ auth.user?.email }}</p>
        </ClientOnly>
      </div>
      <button class="text-sm font-medium underline" @click="logout">Log out</button>
    </div>

    <NuxtLink to="/orders" class="mb-10 block rounded-xl border border-ink-950/10 p-4 text-sm font-medium hover:border-ink-950/30">
      Order History &rarr;
    </NuxtLink>

    <section>
      <div class="mb-4 flex items-center justify-between">
        <h2 class="font-display text-xl">Saved Addresses</h2>
        <button class="text-sm font-medium underline" @click="showAddressForm = !showAddressForm">
          {{ showAddressForm ? "Cancel" : "Add Address" }}
        </button>
      </div>

      <form v-if="showAddressForm" class="mb-8 grid grid-cols-1 gap-3 rounded-xl bg-ink-900/5 p-5 sm:grid-cols-2" @submit.prevent="submitAddress">
        <input v-model="form.fullName" placeholder="Full name" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm sm:col-span-2" />
        <input v-model="form.phone" placeholder="Phone" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm sm:col-span-2" />
        <input v-model="form.line1" placeholder="Address line 1" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm sm:col-span-2" />
        <input v-model="form.line2" placeholder="Address line 2" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm sm:col-span-2" />
        <input v-model="form.city" placeholder="City" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        <input v-model="form.state" placeholder="State" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        <input v-model="form.postalCode" placeholder="Postal code" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        <input v-model="form.country" placeholder="Country" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        <label class="flex items-center gap-2 text-sm sm:col-span-2"><input v-model="form.isDefault" type="checkbox" /> Set as default</label>
        <button type="submit" class="mt-2 rounded-full bg-ink-950 py-2.5 text-sm font-semibold text-paper sm:col-span-2">Save Address</button>
      </form>

      <ul v-if="addresses?.length" class="space-y-3">
        <li v-for="addr in addresses" :key="addr.id" class="flex items-start justify-between rounded-xl border border-ink-950/10 p-4 text-sm">
          <div>
            <p class="font-medium">{{ addr.fullName }} <span v-if="addr.isDefault" class="ml-2 rounded-full bg-accent px-2 py-0.5 text-[10px] uppercase">Default</span></p>
            <p class="text-ink-950/60">{{ addr.line1 }}, {{ addr.line2 ? addr.line2 + ', ' : '' }}{{ addr.city }}, {{ addr.state }} {{ addr.postalCode }}</p>
            <p class="text-ink-950/60">{{ addr.phone }}</p>
          </div>
          <button class="text-ink-950/40 hover:text-ink-950" @click="removeAddress(addr.id)">Remove</button>
        </li>
      </ul>
      <p v-else class="text-sm text-ink-950/50">No saved addresses yet.</p>
    </section>
  </div>
</template>
