<script setup lang="ts">
interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  thumbnailUrl?: string | null;
  brandName?: string | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  inStock: boolean;
}

const props = defineProps<{ product: ProductListItem }>();

const cart = useCartStore();
const wishlist = useWishlistStore();
const { fly } = useFlyToCart();
const { pulse } = useWishlistPulse();
const prefersReduced = usePrefersReducedMotion();
const imageRef = ref<HTMLImageElement | null>(null);
const cardRef = ref<HTMLElement | null>(null);
const heartRef = ref<HTMLElement | null>(null);
const adding = ref(false);

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

async function addToCart() {
  if (adding.value || !props.product.inStock) return;
  adding.value = true;
  try {
    if (imageRef.value) await fly(imageRef.value);
    await cart.addItem({ productId: props.product.id, quantity: 1 });
  } finally {
    adding.value = false;
  }
}

async function toggleWishlist() {
  await wishlist.toggle(props.product.id);
  if (heartRef.value) await pulse(heartRef.value);
}

async function onHoverStart() {
  if (prefersReduced.value || !imageRef.value) return;
  const { gsap } = await import("gsap");
  gsap.to(imageRef.value, { scale: 1.06, duration: 0.4, ease: "power2.out" });
}
async function onHoverEnd() {
  if (prefersReduced.value || !imageRef.value) return;
  const { gsap } = await import("gsap");
  gsap.to(imageRef.value, { scale: 1, duration: 0.4, ease: "power2.out" });
}
</script>

<template>
  <div ref="cardRef" class="group relative" @mouseenter="onHoverStart" @mouseleave="onHoverEnd">
    <NuxtLink :to="`/product/${product.slug}`" class="block overflow-hidden rounded-xl bg-ink-900/5">
      <div class="relative aspect-[4/5] overflow-hidden">
        <img
          ref="imageRef"
          :src="product.thumbnailUrl ?? 'https://placehold.co/600x750?text=%20'"
          :alt="product.name"
          class="h-full w-full object-cover"
          loading="lazy"
        />
        <span
          v-if="product.isNewArrival"
          class="absolute left-3 top-3 rounded-full bg-ink-950 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wide text-cream"
        >
          New
        </span>
        <span
          v-else-if="product.salePrice"
          class="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wide text-ink-950"
        >
          Sale
        </span>
      </div>
    </NuxtLink>

    <button
      ref="heartRef"
      aria-label="Toggle wishlist"
      class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-cream/90 transition-transform hover:scale-110"
      @click="toggleWishlist"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        :fill="wishlist.isWishlisted(product.id) ? 'var(--accent-primary)' : 'none'"
        stroke="currentColor"
        stroke-width="1.8"
        class="h-4 w-4"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 20.5s-7.5-4.6-10-9.3C.6 8 2 4.5 5.4 4c2-.3 3.9.7 4.6 2.3.7-1.6 2.6-2.6 4.6-2.3C18 4.5 19.4 8 22 11.2c-2.5 4.7-10 9.3-10 9.3Z" />
      </svg>
    </button>

    <div class="mt-3 flex items-start justify-between gap-2">
      <div>
        <p v-if="product.brandName" class="text-xs uppercase tracking-wide text-ink-950/50">{{ product.brandName }}</p>
        <NuxtLink :to="`/product/${product.slug}`" class="text-sm font-medium hover:text-accent">{{ product.name }}</NuxtLink>
        <div class="mt-1 flex items-center gap-2 text-sm">
          <span v-if="product.salePrice" class="text-ink-950/40 line-through">{{ formatPrice(product.price) }}</span>
          <span class="font-semibold">{{ formatPrice(product.salePrice ?? product.price) }}</span>
        </div>
      </div>
      <button
        aria-label="Add to cart"
        class="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink-950 transition-transform hover:scale-110 hover:bg-accent disabled:opacity-30"
        :disabled="!product.inStock || adding"
        @click="addToCart"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-4 w-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m-7-7h14" />
        </svg>
      </button>
    </div>
    <p v-if="!product.inStock" class="mt-1 text-xs text-red-500">Out of stock</p>
  </div>
</template>
