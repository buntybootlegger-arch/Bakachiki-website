<script setup lang="ts">
const auth = useAuthStore();
const cart = useCartStore();
const wishlist = useWishlistStore();

onMounted(async () => {
  await auth.tryRefresh();
  await cart.fetchCart();
  await wishlist.fetchIds();
});
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <GrainOverlay />
    <SiteHeader />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
    <CartDrawer />
  </div>
</template>
