<script setup lang="ts">
const cart = useCartStore();

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

useSeoMeta({ title: "Your Bag" });
</script>

<template>
  <div class="mx-auto max-w-4xl px-6 py-14">
    <h1 class="mb-10 font-display text-3xl">Your Bag</h1>

    <div v-if="!cart.cart?.items.length" class="py-20 text-center">
      <p class="text-ink-950/50">Your bag is empty.</p>
      <NuxtLink to="/shop" class="mt-4 inline-block rounded-full bg-ink-950 px-6 py-3 text-sm font-semibold text-paper">
        Continue Shopping
      </NuxtLink>
    </div>

    <div v-else class="grid gap-10 md:grid-cols-3">
      <ul class="space-y-6 md:col-span-2">
        <li v-for="item in cart.cart.items" :key="item.id" class="flex gap-4 border-b border-ink-950/10 pb-6">
          <img :src="item.thumbnailUrl ?? 'https://placehold.co/160x200?text=%20'" :alt="item.productName" class="h-32 w-24 rounded-md object-cover" />
          <div class="flex flex-1 flex-col">
            <div class="flex items-start justify-between">
              <div>
                <NuxtLink :to="`/product/${item.productSlug}`" class="font-medium hover:text-accent">{{ item.productName }}</NuxtLink>
                <p v-if="item.variantLabel" class="text-sm text-ink-950/50">{{ item.variantLabel }}</p>
              </div>
              <button class="text-sm text-ink-950/40 hover:text-ink-950" @click="cart.removeItem(item.id)">Remove</button>
            </div>
            <div class="mt-auto flex items-center justify-between">
              <div class="flex items-center gap-3 rounded-full border border-ink-950/15 px-3 py-1.5">
                <button :disabled="item.quantity <= 1" @click="cart.updateItem(item.id, item.quantity - 1)">−</button>
                <span class="w-4 text-center text-sm">{{ item.quantity }}</span>
                <button @click="cart.updateItem(item.id, item.quantity + 1)">+</button>
              </div>
              <p class="font-medium">{{ formatPrice(item.lineTotal) }}</p>
            </div>
          </div>
        </li>
      </ul>

      <div class="rounded-2xl bg-ink-900/5 p-6">
        <h2 class="font-display text-lg">Order Summary</h2>
        <div class="mt-4 flex items-center justify-between text-sm">
          <span>Subtotal</span>
          <span>{{ formatPrice(cart.cart.subtotal) }}</span>
        </div>
        <p class="mt-2 text-xs text-ink-950/50">Shipping and taxes calculated at checkout.</p>
        <NuxtLink
          to="/checkout"
          class="mt-6 block w-full rounded-full bg-ink-950 py-3 text-center text-sm font-semibold text-paper"
        >
          Checkout
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
