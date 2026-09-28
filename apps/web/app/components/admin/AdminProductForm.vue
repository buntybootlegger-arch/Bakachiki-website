<script setup lang="ts">
const props = defineProps<{
  modelValue: any;
  categories: any[];
  brands: any[];
  submitLabel?: string;
}>();
const emit = defineEmits<{ submit: []; "update:modelValue": [any] }>();

const form = props.modelValue;

function addImage() {
  form.images.push({ url: "", altText: "", position: form.images.length });
}
function removeImage(index: number) {
  form.images.splice(index, 1);
}

function addVariant() {
  form.variants.push({ sku: "", size: "", color: "", price: form.price || 0, salePrice: null, stock: 0, imageUrl: "" });
}
function removeVariant(index: number) {
  form.variants.splice(index, 1);
}
</script>

<template>
  <form class="space-y-8" @submit.prevent="emit('submit')">
    <section class="grid grid-cols-2 gap-4">
      <h2 class="col-span-2 font-display text-lg">Basics</h2>
      <input v-model="form.name" placeholder="Product name" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      <input v-model="form.slug" placeholder="Slug (auto if blank)" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      <input v-model="form.sku" placeholder="SKU" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      <select v-model="form.categoryId" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm">
        <option value="" disabled>Select category</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <select v-model="form.brandId" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm">
        <option value="">No brand</option>
        <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
      </select>
      <textarea v-model="form.shortDescription" placeholder="Short description" class="col-span-2 rounded-lg border border-ink-950/15 px-3 py-2 text-sm" rows="2" />
      <textarea v-model="form.description" placeholder="Full description" class="col-span-2 rounded-lg border border-ink-950/15 px-3 py-2 text-sm" rows="4" />
    </section>

    <section class="grid grid-cols-3 gap-4">
      <h2 class="col-span-3 font-display text-lg">Pricing & Stock</h2>
      <input v-model.number="form.price" type="number" step="0.01" min="0" placeholder="Price" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      <input v-model.number="form.salePrice" type="number" step="0.01" min="0" placeholder="Sale price" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      <input v-model.number="form.stock" type="number" min="0" placeholder="Stock" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      <input v-model.number="form.lowStockThreshold" type="number" min="0" placeholder="Low stock threshold" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      <input v-model.number="form.weightGrams" type="number" min="0" placeholder="Weight (grams)" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
    </section>

    <section class="flex flex-wrap gap-6">
      <label class="flex items-center gap-2 text-sm"><input v-model="form.isActive" type="checkbox" /> Active</label>
      <label class="flex items-center gap-2 text-sm"><input v-model="form.isFeatured" type="checkbox" /> Featured</label>
      <label class="flex items-center gap-2 text-sm"><input v-model="form.isNewArrival" type="checkbox" /> New Arrival</label>
      <label class="flex items-center gap-2 text-sm"><input v-model="form.isBestSeller" type="checkbox" /> Best Seller</label>
    </section>

    <section>
      <div class="mb-3 flex items-center justify-between">
        <h2 class="font-display text-lg">Images</h2>
        <button type="button" class="text-sm font-medium underline" @click="addImage">+ Add image</button>
      </div>
      <div class="space-y-3">
        <div v-for="(image, i) in form.images" :key="i" class="flex items-end gap-3">
          <div class="flex-1"><AdminImagePicker v-model="image.url" /></div>
          <input v-model="image.altText" placeholder="Alt text" class="w-40 rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <button type="button" class="text-sm text-red-500" @click="removeImage(i)">Remove</button>
        </div>
      </div>
    </section>

    <section>
      <div class="mb-3 flex items-center justify-between">
        <h2 class="font-display text-lg">Variants</h2>
        <button type="button" class="text-sm font-medium underline" @click="addVariant">+ Add variant</button>
      </div>
      <div class="space-y-3">
        <div v-for="(variant, i) in form.variants" :key="i" class="grid grid-cols-7 items-center gap-2">
          <input v-model="variant.sku" placeholder="SKU" required class="rounded-lg border border-ink-950/15 px-2 py-1.5 text-sm" />
          <input v-model="variant.size" placeholder="Size" class="rounded-lg border border-ink-950/15 px-2 py-1.5 text-sm" />
          <input v-model="variant.color" placeholder="Color" class="rounded-lg border border-ink-950/15 px-2 py-1.5 text-sm" />
          <input v-model.number="variant.price" type="number" step="0.01" placeholder="Price" required class="rounded-lg border border-ink-950/15 px-2 py-1.5 text-sm" />
          <input v-model.number="variant.salePrice" type="number" step="0.01" placeholder="Sale price" class="rounded-lg border border-ink-950/15 px-2 py-1.5 text-sm" />
          <input v-model.number="variant.stock" type="number" placeholder="Stock" required class="rounded-lg border border-ink-950/15 px-2 py-1.5 text-sm" />
          <button type="button" class="text-sm text-red-500" @click="removeVariant(i)">Remove</button>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-2 gap-4">
      <h2 class="col-span-2 font-display text-lg">SEO</h2>
      <input v-model="form.seoTitle" placeholder="SEO title" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      <input v-model="form.seoDescription" placeholder="Meta description" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      <AdminImagePicker v-model="form.ogImageUrl" label="OG Image" />
    </section>

    <button type="submit" class="rounded-full bg-ink-950 px-6 py-3 text-sm font-semibold text-paper">
      {{ submitLabel ?? "Save Product" }}
    </button>
  </form>
</template>
