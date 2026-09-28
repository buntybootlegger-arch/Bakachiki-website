<script setup lang="ts">
const cart = useCartStore();
const auth = useAuthStore();
const searchQuery = ref("");
const isMobileMenuOpen = ref(false);

function submitSearch() {
  if (!searchQuery.value.trim()) return;
  navigateTo({ path: "/shop", query: { search: searchQuery.value.trim() } });
  isMobileMenuOpen.value = false;
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b-2 border-ink-950 bg-cream">
    <div class="border-b-2 border-ink-950 bg-ink-950 py-1.5 text-cream">
      <MarqueeText
        text="FUNKY  //  BOLD  //  STREET  //  PREMIUM  //  "
        :repeat="6"
        :speed="50"
        text-class="text-xs"
      />
    </div>

    <div class="mx-auto flex max-w-8xl items-center justify-between gap-6 px-6 py-3">
      <button
        class="md:hidden"
        aria-label="Toggle menu"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
      >
        <span class="block h-0.5 w-6 bg-ink-950" />
        <span class="mt-1.5 block h-0.5 w-6 bg-ink-950" />
        <span class="mt-1.5 block h-0.5 w-6 bg-ink-950" />
      </button>

      <NuxtLink to="/" class="shrink-0">
        <Logo size="sm" />
      </NuxtLink>

      <nav class="hidden items-center gap-8 font-display text-sm font-bold uppercase tracking-wide md:flex">
        <NuxtLink to="/shop" class="transition-colors hover:text-accent">Shop</NuxtLink>
        <NuxtLink to="/collections" class="transition-colors hover:text-accent">Collections</NuxtLink>
        <NuxtLink to="/lookbooks" class="transition-colors hover:text-accent">Lookbooks</NuxtLink>
        <NuxtLink to="/shop?newArrival=1" class="transition-colors hover:text-accent">New In</NuxtLink>
      </nav>

      <div class="flex items-center gap-4">
        <form class="hidden items-center gap-2 rounded-full border-2 border-ink-950 px-3 py-1.5 lg:flex" @submit.prevent="submitSearch">
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search products…"
            class="w-40 bg-transparent text-sm outline-none placeholder:text-ink-950/40"
          />
        </form>

        <NuxtLink to="/wishlist" aria-label="Wishlist" class="transition-transform hover:scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-5 w-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 20.5s-7.5-4.6-10-9.3C.6 8 2 4.5 5.4 4c2-.3 3.9.7 4.6 2.3.7-1.6 2.6-2.6 4.6-2.3C18 4.5 19.4 8 22 11.2c-2.5 4.7-10 9.3-10 9.3Z" />
          </svg>
        </NuxtLink>

        <button id="cart-icon-target" aria-label="Cart" class="relative transition-transform hover:scale-110" @click="cart.openDrawer()">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-5 w-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l3-8H5.4M7 13 5.4 5M7 13l-1.7 6.2A1 1 0 0 0 6.3 20.5H17M17 13l1.6-4M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
          </svg>
          <span
            v-if="cart.itemCount > 0"
            class="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-ink-950"
          >
            {{ cart.itemCount }}
          </span>
        </button>

        <NuxtLink :to="auth.isLoggedIn ? '/account' : '/login'" aria-label="Account" class="transition-transform hover:scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-5 w-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0" />
          </svg>
        </NuxtLink>
      </div>
    </div>

    <div v-if="isMobileMenuOpen" class="border-t-2 border-ink-950 px-6 py-4 md:hidden">
      <form class="mb-4 flex items-center gap-2 rounded-full border-2 border-ink-950 px-3 py-1.5" @submit.prevent="submitSearch">
        <input v-model="searchQuery" type="search" placeholder="Search products…" class="w-full bg-transparent text-sm outline-none" />
      </form>
      <nav class="flex flex-col gap-3 font-display text-sm font-bold uppercase tracking-wide">
        <NuxtLink to="/shop" @click="isMobileMenuOpen = false">Shop</NuxtLink>
        <NuxtLink to="/collections" @click="isMobileMenuOpen = false">Collections</NuxtLink>
        <NuxtLink to="/lookbooks" @click="isMobileMenuOpen = false">Lookbooks</NuxtLink>
        <NuxtLink to="/shop?newArrival=1" @click="isMobileMenuOpen = false">New In</NuxtLink>
      </nav>
    </div>
  </header>
</template>
