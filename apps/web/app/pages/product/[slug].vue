<script setup lang="ts">
const route = useRoute();
const api = useApi();
const cart = useCartStore();
const wishlist = useWishlistStore();
const { fly } = useFlyToCart();
const { pulse } = useWishlistPulse();
const heartRef = ref<HTMLElement | null>(null);

const slug = computed(() => route.params.slug as string);

const { data: product } = await useAsyncData(() => `product-${slug.value}`, () =>
  api<any>(`/products/slug/${slug.value}`),
);

if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: "Product not found" });
}

const activeImageIndex = ref(0);
const selectedVariantId = ref<string | null>(product.value.variants?.[0]?.id ?? null);
const quantity = ref(1);
const adding = ref(false);
const imageRef = ref<HTMLImageElement | null>(null);

const selectedVariant = computed(() =>
  product.value?.variants?.find((v: any) => v.id === selectedVariantId.value) ?? null,
);

const displayPrice = computed(() => {
  if (selectedVariant.value) return selectedVariant.value.salePrice ?? selectedVariant.value.price;
  return product.value?.salePrice ?? product.value?.price ?? 0;
});
const originalPrice = computed(() => (selectedVariant.value ? selectedVariant.value.price : product.value?.price));
const inStock = computed(() => (selectedVariant.value ? selectedVariant.value.stock > 0 : product.value?.inStock));

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

async function addToCart() {
  if (adding.value || !inStock.value) return;
  adding.value = true;
  try {
    if (imageRef.value) await fly(imageRef.value);
    await cart.addItem({
      productId: product.value.id,
      variantId: selectedVariantId.value ?? undefined,
      quantity: quantity.value,
    });
  } finally {
    adding.value = false;
  }
}

async function toggleWishlist() {
  await wishlist.toggle(product.value.id);
  if (heartRef.value) await pulse(heartRef.value);
}

const { data: related } = await useAsyncData(
  () => `related-${slug.value}`,
  () =>
    api<{ items: any[] }>("/products", {
      query: { categorySlug: product.value?.category?.slug, pageSize: 4 },
    }),
);

useSeoMeta({
  title: () => product.value?.seoTitle || product.value?.name,
  description: () => product.value?.seoDescription || product.value?.shortDescription,
  ogImage: () => product.value?.ogImageUrl || product.value?.thumbnailUrl,
});
</script>

<template>
  <div v-if="product" class="mx-auto max-w-8xl px-6 py-10">
    <div class="grid gap-10 md:grid-cols-2">
      <div>
        <div class="overflow-hidden rounded-2xl bg-ink-900/5">
          <img
            ref="imageRef"
            :src="product.images?.[activeImageIndex]?.url ?? 'https://placehold.co/800x1000?text=%20'"
            :alt="product.name"
            class="aspect-[4/5] w-full object-cover"
          />
        </div>
        <div v-if="product.images?.length > 1" class="mt-4 flex gap-3">
          <button
            v-for="(img, i) in product.images"
            :key="img.id"
            class="h-16 w-14 overflow-hidden rounded-lg border-2"
            :class="i === activeImageIndex ? 'border-ink-950' : 'border-transparent'"
            @click="activeImageIndex = i"
          >
            <img :src="img.url" :alt="img.altText ?? product.name" class="h-full w-full object-cover" />
          </button>
        </div>
      </div>

      <div>
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-wide text-ink-950/50">{{ product.brandName }}</p>
            <h1 class="mt-1 font-display text-3xl font-extrabold uppercase tracking-tight md:text-4xl">{{ product.name }}</h1>
          </div>
          <button
            ref="heartRef"
            aria-label="Toggle wishlist"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink-950 transition-transform hover:scale-110"
            @click="toggleWishlist"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              :fill="wishlist.isWishlisted(product.id) ? 'var(--accent-primary)' : 'none'"
              stroke="currentColor"
              stroke-width="1.8"
              class="h-5 w-5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 20.5s-7.5-4.6-10-9.3C.6 8 2 4.5 5.4 4c2-.3 3.9.7 4.6 2.3.7-1.6 2.6-2.6 4.6-2.3C18 4.5 19.4 8 22 11.2c-2.5 4.7-10 9.3-10 9.3Z" />
            </svg>
          </button>
        </div>
        <div class="mt-3 flex items-center gap-3">
          <span v-if="originalPrice !== displayPrice" class="text-ink-950/40 line-through">{{ formatPrice(originalPrice) }}</span>
          <span class="text-2xl font-semibold">{{ formatPrice(displayPrice) }}</span>
        </div>

        <p v-if="product.shortDescription" class="mt-5 text-sm text-ink-950/70">{{ product.shortDescription }}</p>

        <div v-if="product.variants?.length" class="mt-6">
          <p class="mb-2 text-sm font-medium">Options</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="variant in product.variants"
              :key="variant.id"
              class="rounded-full border px-4 py-2 text-sm transition-colors"
              :class="selectedVariantId === variant.id ? 'border-ink-950 bg-ink-950 text-paper' : 'border-ink-950/20'"
              :disabled="variant.stock === 0"
              @click="selectedVariantId = variant.id"
            >
              {{ [variant.size, variant.color].filter(Boolean).join(' / ') || variant.sku }}
              <span v-if="variant.stock === 0" class="ml-1 text-xs">(out)</span>
            </button>
          </div>
        </div>

        <div class="mt-6 flex items-center gap-4">
          <div class="flex items-center gap-3 rounded-full border border-ink-950/15 px-4 py-2">
            <button :disabled="quantity <= 1" @click="quantity--">−</button>
            <span class="w-4 text-center">{{ quantity }}</span>
            <button @click="quantity++">+</button>
          </div>
          <button
            class="flex-1 rounded-full bg-ink-950 py-3 text-sm font-semibold text-paper transition-transform hover:scale-[1.02] disabled:opacity-30"
            :disabled="!inStock || adding"
            @click="addToCart"
          >
            {{ inStock ? "Add to Bag" : "Out of Stock" }}
          </button>
        </div>

        <p v-if="product.description" class="mt-10 max-w-none whitespace-pre-line text-sm text-ink-950/80">{{ product.description }}</p>
      </div>
    </div>

    <section v-if="related?.items?.length" class="mt-20">
      <h2 class="mb-8 font-display text-2xl">You Might Also Like</h2>
      <ProductGrid :products="related.items.filter((p) => p.id !== product.id)" />
    </section>
  </div>
</template>
