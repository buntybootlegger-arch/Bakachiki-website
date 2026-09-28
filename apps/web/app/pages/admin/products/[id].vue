<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin-auth" });

const route = useRoute();
const router = useRouter();
const adminAuth = useAdminAuthStore();
const id = route.params.id as string;

const { data: categories } = await useAsyncData("admin-form-categories", () => adminAuth.authFetch<any[]>("/admin/categories"));
const { data: brands } = await useAsyncData("admin-form-brands", () => adminAuth.authFetch<any[]>("/admin/brands"));
const { data: product } = await useAsyncData(`admin-product-${id}`, () => adminAuth.authFetch<any>(`/admin/products/${id}`));

if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: "Product not found" });
}

const form = reactive<any>({
  name: product.value.name,
  slug: product.value.slug,
  sku: product.value.sku,
  shortDescription: product.value.shortDescription ?? "",
  description: product.value.description ?? "",
  price: Number(product.value.price),
  salePrice: product.value.salePrice ? Number(product.value.salePrice) : null,
  stock: product.value.stock,
  lowStockThreshold: product.value.lowStockThreshold,
  weightGrams: product.value.weightGrams,
  isActive: product.value.isActive,
  isFeatured: product.value.isFeatured,
  isNewArrival: product.value.isNewArrival,
  isBestSeller: product.value.isBestSeller,
  categoryId: product.value.categoryId,
  brandId: product.value.brandId ?? "",
  images: product.value.images.map((img: any) => ({ url: img.url, altText: img.altText ?? "", position: img.position })),
  variants: product.value.variants.map((v: any) => ({
    sku: v.sku,
    size: v.size ?? "",
    color: v.color ?? "",
    price: Number(v.price),
    salePrice: v.salePrice ? Number(v.salePrice) : null,
    stock: v.stock,
    imageUrl: v.imageUrl ?? "",
  })),
  seoTitle: product.value.seoTitle ?? "",
  seoDescription: product.value.seoDescription ?? "",
  ogImageUrl: product.value.ogImageUrl ?? "",
});

const error = ref<string | null>(null);

async function submit() {
  error.value = null;
  try {
    const payload = {
      ...form,
      brandId: form.brandId || undefined,
      salePrice: form.salePrice || undefined,
      weightGrams: form.weightGrams || undefined,
      variants: form.variants.map((v: any) => ({ ...v, salePrice: v.salePrice || undefined })),
    };
    await adminAuth.authFetch(`/admin/products/${id}`, { method: "PATCH", body: payload });
    router.push("/admin/products");
  } catch (err: any) {
    error.value = err?.data?.message ?? "Could not update product";
  }
}

useSeoMeta({ title: "Edit Product" });
</script>

<template>
  <div class="max-w-4xl">
    <h1 class="mb-8 font-display text-2xl">Edit Product</h1>
    <p v-if="error" class="mb-4 text-sm text-red-500">{{ error }}</p>
    <AdminProductForm v-model="form" :categories="categories ?? []" :brands="brands ?? []" submit-label="Save Changes" @submit="submit" />
  </div>
</template>
