<template>
  <footer class="mt-24 border-t-2 border-ink-950 bg-ink-950 text-cream">
    <div class="mx-auto max-w-8xl px-6 py-16">
      <p class="font-display text-[16vw] font-black uppercase leading-[0.8] tracking-tighter text-cream/10 md:text-[9vw]">
        Bakachiki
      </p>
    </div>
    <div class="mx-auto grid max-w-8xl gap-10 border-t border-cream/10 px-6 py-12 md:grid-cols-4">
      <div>
        <Logo size="sm" />
        <p class="mt-4 text-sm text-cream/60">
          Bold, funky, streetwear-inspired fashion for the loud and unbothered.
        </p>
      </div>
      <div>
        <p class="font-display text-sm font-bold uppercase tracking-wide text-cream/50">Shop</p>
        <ul class="mt-4 space-y-2 text-sm text-cream/80">
          <li><NuxtLink to="/shop">All Products</NuxtLink></li>
          <li><NuxtLink to="/collections">Collections</NuxtLink></li>
          <li><NuxtLink to="/lookbooks">Lookbooks</NuxtLink></li>
          <li><NuxtLink to="/shop?newArrival=1">New Arrivals</NuxtLink></li>
        </ul>
      </div>
      <div>
        <p class="font-display text-sm font-bold uppercase tracking-wide text-cream/50">Account</p>
        <ul class="mt-4 space-y-2 text-sm text-cream/80">
          <li><NuxtLink to="/account">My Account</NuxtLink></li>
          <li><NuxtLink to="/wishlist">Wishlist</NuxtLink></li>
          <li><NuxtLink to="/cart">Cart</NuxtLink></li>
        </ul>
      </div>
      <div>
        <p class="font-display text-sm font-bold uppercase tracking-wide text-cream/50">Help</p>
        <ul class="mt-4 space-y-2 text-sm text-cream/80">
          <li>support@bakachiki.dev</li>
          <li>Mon–Fri, 9am–6pm</li>
        </ul>
      </div>
    </div>
    <div class="border-t border-cream/10 px-6 py-6 text-center text-xs text-cream/40">
      © {{ new Date().getFullYear() }} Bakachiki. All rights reserved.
    </div>
  </footer>
</template>
