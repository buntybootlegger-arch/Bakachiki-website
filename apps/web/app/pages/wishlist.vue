<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const auth = useAuthStore();
const cart = useCartStore();

const { data: items, refresh } = await useAsyncData("wishlist", () => auth.authFetch<any[]>("/wishlist"));

async function remove(productId: string) {
  await auth.authFetch(`/wishlist/${productId}`, { method: "DELETE" });
  await refresh();
}

async function moveToCart(productId: string) {
  await cart.addItem({ productId, quantity: 1 });
  await remove(productId);
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

useSeoMeta({ title: "Wishlist" });
</script>

<template>
  <div class="mx-auto max-w-4xl px-6 py-14">
    <h1 class="mb-10 font-display text-3xl">Wishlist</h1>
    <p v-if="!items?.length" class="text-sm text-ink-950/50">Your wishlist is empty.</p>
    <ul v-else class="space-y-4">
      <li v-for="item in items" :key="item.id" class="flex items-center gap-4 rounded-xl border border-ink-950/10 p-4">
        <img :src="item.thumbnailUrl ?? 'https://placehold.co/120x150?text=%20'" :alt="item.name" class="h-20 w-16 rounded-md object-cover" />
        <div class="flex-1">
          <NuxtLink :to="`/product/${item.slug}`" class="font-medium hover:text-accent">{{ item.name }}</NuxtLink>
          <p class="text-sm text-ink-950/60">{{ formatPrice(item.salePrice ?? item.price) }}</p>
        </div>
        <button class="rounded-full bg-ink-950 px-4 py-2 text-xs font-semibold text-paper" @click="moveToCart(item.productId)">
          Move to Bag
        </button>
        <button class="text-sm text-ink-950/40 hover:text-ink-950" @click="remove(item.productId)">Remove</button>
      </li>
    </ul>
  </div>
</template>
