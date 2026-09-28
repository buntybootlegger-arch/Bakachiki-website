<script setup lang="ts">
definePageMeta({ middleware: "auth" });

interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const auth = useAuthStore();
const cart = useCartStore();
const router = useRouter();

const { data: addresses, refresh: refreshAddresses } = await useAsyncData("checkout-addresses", () =>
  auth.authFetch<Address[]>("/users/me/addresses"),
);

onMounted(async () => {
  // Customer auth tokens live in memory client-side only (see
  // middleware/auth.ts) — on a fresh/hard page load, this page's own
  // useAsyncData above ran server-side with no token and cached an
  // unauthenticated result. The middleware's tryRefresh() has resolved by
  // the time onMounted fires (it runs before this component even mounts),
  // so refetch now that a real token exists.
  await refreshAddresses();
  if (!cart.cart) await cart.fetchCart();
  if (cart.cart && cart.cart.items.length === 0) router.replace("/cart");
});

const selectedAddressId = ref<string | null>(null);
watchEffect(() => {
  if (!selectedAddressId.value && addresses.value?.length) {
    const def = addresses.value.find((a) => a.isDefault) ?? addresses.value[0];
    selectedAddressId.value = def?.id ?? null;
  }
});

const showAddressForm = ref(false);
const addressForm = reactive({
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
  const created = await auth.authFetch<Address>("/users/me/addresses", { method: "POST", body: addressForm });
  showAddressForm.value = false;
  Object.assign(addressForm, { fullName: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "", isDefault: false });
  await refreshAddresses();
  selectedAddressId.value = created.id;
}

const shippingQuote = ref<{ amount: number; label: string; codAvailable: boolean } | null>(null);
const shippingError = ref("");

async function fetchShippingQuote() {
  const addr = addresses.value?.find((a) => a.id === selectedAddressId.value);
  if (!addr) return;
  shippingError.value = "";
  shippingQuote.value = null;
  try {
    shippingQuote.value = await auth.authFetch("/shipping/quote", {
      method: "POST",
      body: { state: addr.state, country: addr.country },
    });
  } catch (err: any) {
    shippingError.value = err?.data?.message ?? "Could not calculate shipping for this address";
    if (paymentMethod.value === "COD") paymentMethod.value = "PAYU";
  }
}
watch(selectedAddressId, fetchShippingQuote, { immediate: true });

const couponCode = ref("");
const couponResult = ref<{ valid: true; discountAmount: number; freeShipping: boolean } | null>(null);
const couponMessage = ref("");

async function applyCoupon() {
  if (!couponCode.value.trim()) return;
  couponMessage.value = "";
  const result = await auth.authFetch<any>("/coupons/preview", { method: "POST", body: { code: couponCode.value } });
  if (result.valid) {
    couponResult.value = result;
    couponMessage.value = "";
  } else {
    couponResult.value = null;
    couponMessage.value = result.message;
  }
}

function removeCoupon() {
  couponResult.value = null;
  couponCode.value = "";
  couponMessage.value = "";
}

const paymentMethod = ref<"PAYU" | "COD">("PAYU");

const subtotal = computed(() => cart.cart?.subtotal ?? 0);
const discount = computed(() => couponResult.value?.discountAmount ?? 0);
const shippingAmount = computed(() =>
  couponResult.value?.freeShipping ? 0 : (shippingQuote.value?.amount ?? 0),
);
// Tax (GST) is computed authoritatively server-side per line item at order
// placement — not re-derived here, so this page never shows an invented number.
const estimatedTotal = computed(() => Math.max(0, subtotal.value - discount.value) + shippingAmount.value);

const placing = ref(false);
const placeError = ref("");

async function placeOrder() {
  if (!selectedAddressId.value) {
    placeError.value = "Please select a shipping address";
    return;
  }
  placing.value = true;
  placeError.value = "";
  try {
    const result = await auth.authFetch<any>("/checkout/place-order", {
      method: "POST",
      body: {
        shippingAddressId: selectedAddressId.value,
        couponCode: couponResult.value ? couponCode.value : undefined,
        paymentGateway: paymentMethod.value,
      },
    });

    if (result.payment) {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = result.payment.actionUrl;
      for (const [key, value] of Object.entries(result.payment.fields as Record<string, string>)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } else {
      await router.push(`/checkout/confirmation?orderId=${result.orderId}`);
    }
  } catch (err: any) {
    placeError.value = err?.data?.message ?? "Could not place your order";
  } finally {
    placing.value = false;
  }
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

useSeoMeta({ title: "Checkout" });
</script>

<template>
  <div class="mx-auto max-w-5xl px-6 py-14">
    <h1 class="mb-10 font-display text-3xl">Checkout</h1>

    <div class="grid gap-10 md:grid-cols-3">
      <div class="space-y-8 md:col-span-2">
        <section>
          <div class="mb-4 flex items-center justify-between">
            <h2 class="font-display text-xl">Shipping Address</h2>
            <button class="text-sm font-medium underline" @click="showAddressForm = !showAddressForm">
              {{ showAddressForm ? "Cancel" : "Add Address" }}
            </button>
          </div>

          <form v-if="showAddressForm" class="mb-6 grid grid-cols-1 gap-3 rounded-xl bg-ink-900/5 p-5 sm:grid-cols-2" @submit.prevent="submitAddress">
            <input v-model="addressForm.fullName" placeholder="Full name" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm sm:col-span-2" />
            <input v-model="addressForm.phone" placeholder="Phone" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm sm:col-span-2" />
            <input v-model="addressForm.line1" placeholder="Address line 1" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm sm:col-span-2" />
            <input v-model="addressForm.line2" placeholder="Address line 2" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm sm:col-span-2" />
            <input v-model="addressForm.city" placeholder="City" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
            <input v-model="addressForm.state" placeholder="State" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
            <input v-model="addressForm.postalCode" placeholder="Postal code" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
            <input v-model="addressForm.country" placeholder="Country" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
            <label class="flex items-center gap-2 text-sm sm:col-span-2"><input v-model="addressForm.isDefault" type="checkbox" /> Set as default</label>
            <button type="submit" class="mt-2 rounded-full bg-ink-950 py-2.5 text-sm font-semibold text-paper sm:col-span-2">Save Address</button>
          </form>

          <p v-if="!addresses?.length" class="text-sm text-ink-950/50">Add an address to continue.</p>
          <div v-else class="space-y-3">
            <label
              v-for="addr in addresses"
              :key="addr.id"
              class="flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm"
              :class="selectedAddressId === addr.id ? 'border-ink-950' : 'border-ink-950/10'"
            >
              <input v-model="selectedAddressId" type="radio" :value="addr.id" class="mt-1" />
              <div>
                <p class="font-medium">
                  {{ addr.fullName }}
                  <span v-if="addr.isDefault" class="ml-2 rounded-full bg-accent px-2 py-0.5 text-[10px] uppercase">Default</span>
                </p>
                <p class="text-ink-950/60">{{ addr.line1 }}, {{ addr.line2 ? addr.line2 + ", " : "" }}{{ addr.city }}, {{ addr.state }} {{ addr.postalCode }}</p>
                <p class="text-ink-950/60">{{ addr.phone }}</p>
              </div>
            </label>
          </div>
        </section>

        <section>
          <h2 class="mb-4 font-display text-xl">Shipping Method</h2>
          <p v-if="shippingError" class="text-sm text-red-500">{{ shippingError }}</p>
          <p v-else-if="couponResult?.freeShipping" class="text-sm">Free shipping (coupon applied)</p>
          <p v-else-if="shippingQuote" class="text-sm">{{ shippingQuote.label }} — {{ formatPrice(shippingQuote.amount) }}</p>
          <p v-else class="text-sm text-ink-950/50">Select an address to calculate shipping.</p>
        </section>

        <section>
          <h2 class="mb-4 font-display text-xl">Coupon</h2>
          <div v-if="couponResult" class="flex items-center justify-between rounded-xl border border-ink-950/10 p-4 text-sm">
            <span>"{{ couponCode }}" applied — {{ formatPrice(couponResult.discountAmount) }} off</span>
            <button class="text-ink-950/40 hover:text-ink-950" @click="removeCoupon">Remove</button>
          </div>
          <form v-else class="flex gap-3" @submit.prevent="applyCoupon">
            <input v-model="couponCode" placeholder="Coupon code" class="flex-1 rounded-lg border border-ink-950/15 px-3 py-2 text-sm uppercase" />
            <button type="submit" class="rounded-full border border-ink-950/15 px-5 py-2 text-sm font-medium">Apply</button>
          </form>
          <p v-if="couponMessage" class="mt-2 text-sm text-red-500">{{ couponMessage }}</p>
        </section>

        <section>
          <h2 class="mb-4 font-display text-xl">Payment Method</h2>
          <div class="space-y-3">
            <label class="flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm" :class="paymentMethod === 'PAYU' ? 'border-ink-950' : 'border-ink-950/10'">
              <input v-model="paymentMethod" type="radio" value="PAYU" />
              Pay online (Card / UPI / Netbanking via PayU)
            </label>
            <label
              class="flex items-center gap-3 rounded-xl border p-4 text-sm"
              :class="[
                paymentMethod === 'COD' ? 'border-ink-950' : 'border-ink-950/10',
                shippingQuote && !shippingQuote.codAvailable ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
              ]"
            >
              <input
                v-model="paymentMethod"
                type="radio"
                value="COD"
                :disabled="Boolean(shippingQuote) && !shippingQuote?.codAvailable"
              />
              Cash on Delivery
            </label>
          </div>
        </section>
      </div>

      <div class="h-fit rounded-2xl bg-ink-900/5 p-6">
        <h2 class="font-display text-lg">Order Summary</h2>
        <ul class="mt-4 space-y-2 text-sm text-ink-950/60">
          <li v-for="item in cart.cart?.items ?? []" :key="item.id" class="flex justify-between">
            <span>{{ item.productName }} × {{ item.quantity }}</span>
            <span>{{ formatPrice(item.lineTotal) }}</span>
          </li>
        </ul>
        <div class="mt-4 space-y-2 border-t border-ink-950/10 pt-4 text-sm">
          <div class="flex justify-between"><span>Subtotal</span><span>{{ formatPrice(subtotal) }}</span></div>
          <div v-if="discount" class="flex justify-between text-green-700"><span>Discount</span><span>-{{ formatPrice(discount) }}</span></div>
          <div class="flex justify-between"><span>Shipping</span><span>{{ formatPrice(shippingAmount) }}</span></div>
          <p class="text-xs text-ink-950/40">Tax (GST) is calculated on the final invoice.</p>
        </div>
        <div class="mt-4 flex justify-between border-t border-ink-950/10 pt-4 font-semibold">
          <span>Estimated Total</span>
          <span>{{ formatPrice(estimatedTotal) }}</span>
        </div>

        <p v-if="placeError" class="mt-4 text-sm text-red-500">{{ placeError }}</p>
        <button
          :disabled="placing || !selectedAddressId"
          class="mt-6 w-full rounded-full bg-ink-950 py-3 text-sm font-semibold text-paper disabled:cursor-not-allowed disabled:opacity-40"
          @click="placeOrder"
        >
          {{ placing ? "Placing order..." : "Place Order" }}
        </button>
      </div>
    </div>
  </div>
</template>
