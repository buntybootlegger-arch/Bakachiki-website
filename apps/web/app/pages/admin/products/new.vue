<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin-auth" });

const adminAuth = useAdminAuthStore();
const router = useRouter();

const { data: categories } = await useAsyncData("admin-form-categories", () => adminAuth.authFetch<any[]>("/admin/categories"));
const { data: brands } = await useAsyncData("admin-form-brands", () => adminAuth.authFetch<any[]>("/admin/brands"));

const form = reactive<any>({
  name: "",
  slug: "",
  sku: "",
  shortDescription: "",
  description: "",
  price: 0,
  salePrice: null,
  stock: 0,
  lowStockThreshold: 5,
  weightGrams: null,
  isActive: true,
  isFeatured: false,
  isNewArrival: false,
  isBestSeller: false,
  categoryId: "",
  brandId: "",
  images: [],
  variants: [],
  seoTitle: "",
  seoDescription: "",
  ogImageUrl: "",
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
    await adminAuth.authFetch("/admin/products", { method: "POST", body: payload });
    router.push("/admin/products");
  } catch (err: any) {
    error.value = err?.data?.message ?? "Could not create product";
  }
}

useSeoMeta({ title: "New Product" });
</script>

<template>
  <div class="max-w-4xl">
    <h1 class="mb-8 font-display text-2xl">New Product</h1>
    <p v-if="error" class="mb-4 text-sm text-red-500">{{ error }}</p>
    <AdminProductForm v-model="form" :categories="categories ?? []" :brands="brands ?? []" submit-label="Create Product" @submit="submit" />
  </div>
</template>
