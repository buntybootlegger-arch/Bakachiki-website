<script setup lang="ts">
const cart = useCartStore();
const prefersReduced = usePrefersReducedMotion();

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

async function onBackdropEnter(el: Element, done: () => void) {
  if (prefersReduced.value) return done();
  const { gsap } = await import("gsap");
  gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.25, onComplete: done });
}
async function onBackdropLeave(el: Element, done: () => void) {
  if (prefersReduced.value) return done();
  const { gsap } = await import("gsap");
  gsap.to(el, { opacity: 0, duration: 0.2, onComplete: done });
}
async function onDrawerEnter(el: Element, done: () => void) {
  if (prefersReduced.value) return done();
  const { gsap } = await import("gsap");
  gsap.fromTo(el, { xPercent: 100 }, { xPercent: 0, duration: 0.4, ease: "power3.out", onComplete: done });
}
async function onDrawerLeave(el: Element, done: () => void) {
  if (prefersReduced.value) return done();
  const { gsap } = await import("gsap");
  gsap.to(el, { xPercent: 100, duration: 0.3, ease: "power2.in", onComplete: done });
}
</script>

<template>
  <Teleport to="body">
    <Transition :css="false" @enter="onBackdropEnter" @leave="onBackdropLeave">
      <div v-if="cart.isDrawerOpen" class="fixed inset-0 z-50 bg-ink-950/50" @click="cart.closeDrawer()" />
    </Transition>

    <Transition :css="false" @enter="onDrawerEnter" @leave="onDrawerLeave">
      <aside
        v-if="cart.isDrawerOpen"
        class="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l-2 border-ink-950 bg-cream shadow-2xl"
      >
        <div class="flex items-center justify-between border-b-2 border-ink-950 px-6 py-5">
          <h2 class="font-display text-lg font-extrabold uppercase tracking-tight">Your Bag ({{ cart.itemCount }})</h2>
          <button aria-label="Close cart" class="text-2xl leading-none" @click="cart.closeDrawer()">&times;</button>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-4">
          <p v-if="!cart.cart?.items.length" class="mt-10 text-center text-sm text-ink-950/50">
            Your bag is empty.
          </p>
          <TransitionGroup tag="ul" class="space-y-5" enter-active-class="transition-all duration-300" leave-active-class="transition-all duration-200 absolute" enter-from-class="opacity-0 -translate-x-2" leave-to-class="opacity-0 translate-x-2">
            <li v-for="item in cart.cart?.items" :key="item.id" class="flex gap-4">
              <img
                :src="item.thumbnailUrl ?? 'https://placehold.co/120x150?text=%20'"
                :alt="item.productName"
                class="h-24 w-20 rounded-md object-cover"
              />
              <div class="flex flex-1 flex-col">
                <div class="flex items-start justify-between">
                  <div>
                    <NuxtLink :to="`/product/${item.productSlug}`" class="text-sm font-medium hover:text-accent" @click="cart.closeDrawer()">
                      {{ item.productName }}
                    </NuxtLink>
                    <p v-if="item.variantLabel" class="text-xs text-ink-950/50">{{ item.variantLabel }}</p>
                  </div>
                  <button class="text-xs text-ink-950/40 hover:text-ink-950" @click="cart.removeItem(item.id)">Remove</button>
                </div>
                <div class="mt-auto flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <button
                      class="h-6 w-6 rounded-full border border-ink-950/20 text-xs"
                      :disabled="item.quantity <= 1"
                      @click="cart.updateItem(item.id, item.quantity - 1)"
                    >
                      −
                    </button>
                    <span class="w-4 text-center text-sm">{{ item.quantity }}</span>
                    <button
                      class="h-6 w-6 rounded-full border border-ink-950/20 text-xs"
                      @click="cart.updateItem(item.id, item.quantity + 1)"
                    >
                      +
                    </button>
                  </div>
                  <p class="text-sm font-semibold">{{ formatPrice(item.lineTotal) }}</p>
                </div>
              </div>
            </li>
          </TransitionGroup>
        </div>

        <div class="border-t-2 border-ink-950 px-6 py-5">
          <div class="mb-4 flex items-center justify-between text-sm font-medium">
            <span>Subtotal</span>
            <span class="font-semibold">{{ formatPrice(cart.cart?.subtotal ?? 0) }}</span>
          </div>
          <NuxtLink
            to="/checkout"
            class="block rounded-full bg-ink-950 py-3 text-center font-display text-sm font-bold uppercase tracking-wide text-cream transition-transform hover:scale-[1.02]"
            @click="cart.closeDrawer()"
          >
            View Bag &amp; Checkout
          </NuxtLink>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>
