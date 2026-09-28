<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin-auth" });

const adminAuth = useAdminAuthStore();
const { confirm } = useConfirm();

const { data: collections, refresh } = await useAsyncData("admin-collections", () =>
  adminAuth.authFetch<any[]>("/admin/collections"),
);
const { data: productsResponse } = await useAsyncData("admin-collections-products", () =>
  adminAuth.authFetch<{ items: any[] }>("/admin/products", { query: { pageSize: 200 } }),
);
const allProducts = computed(() => productsResponse.value?.items ?? []);
const productSearch = ref("");
const filteredProducts = computed(() =>
  allProducts.value.filter((p) => p.name.toLowerCase().includes(productSearch.value.toLowerCase())),
);

const showForm = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({
  name: "",
  slug: "",
  description: "",
  coverImageUrl: "",
  isActive: true,
  productIds: [] as string[],
});

function resetForm() {
  Object.assign(form, { name: "", slug: "", description: "", coverImageUrl: "", isActive: true, productIds: [] });
  editingId.value = null;
  productSearch.value = "";
}

function startCreate() {
  resetForm();
  showForm.value = true;
}

async function startEdit(collection: any) {
  const detail = await adminAuth.authFetch<any>(`/admin/collections/${collection.id}`);
  editingId.value = collection.id;
  Object.assign(form, {
    name: detail.name,
    slug: detail.slug,
    description: detail.description ?? "",
    coverImageUrl: detail.coverImageUrl ?? "",
    isActive: detail.isActive,
    productIds: (detail.products ?? []).map((p: any) => p.id),
  });
  showForm.value = true;
}

async function submit() {
  const { productIds, ...body } = form;
  let id = editingId.value;
  if (id) {
    await adminAuth.authFetch(`/admin/collections/${id}`, { method: "PATCH", body });
  } else {
    const created = await adminAuth.authFetch<any>("/admin/collections", { method: "POST", body });
    id = created.id;
  }
  await adminAuth.authFetch(`/admin/collections/${id}/products`, { method: "PUT", body: { productIds } });
  showForm.value = false;
  resetForm();
  await refresh();
}

async function remove(collection: any) {
  const ok = await confirm({ title: "Delete collection?", message: `"${collection.name}" will be permanently removed.` });
  if (!ok) return;
  await adminAuth.authFetch(`/admin/collections/${collection.id}`, { method: "DELETE" });
  await refresh();
}

useSeoMeta({ title: "Collections" });
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="font-display text-2xl font-extrabold uppercase tracking-tight">Collections</h1>
      <button class="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-cream" @click="startCreate">+ New Collection</button>
    </div>

    <div v-if="showForm" class="mb-8 rounded-xl border border-ink-950/10 p-6">
      <h2 class="mb-4 font-display text-lg">{{ editingId ? "Edit" : "Create" }} Collection</h2>
      <form class="space-y-4" @submit.prevent="submit">
        <div class="grid grid-cols-2 gap-4">
          <input v-model="form.name" placeholder="Name" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <input v-model="form.slug" placeholder="Slug (auto if blank)" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        </div>
        <textarea v-model="form.description" placeholder="Description" rows="2" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        <AdminImagePicker v-model="form.coverImageUrl" label="Cover image" />
        <label class="flex items-center gap-2 text-sm"><input v-model="form.isActive" type="checkbox" /> Active</label>

        <div>
          <p class="mb-2 text-sm font-medium">Products ({{ form.productIds.length }} selected)</p>
          <input v-model="productSearch" placeholder="Search products…" class="mb-2 w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <div class="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-ink-950/10 p-3">
            <label v-for="p in filteredProducts" :key="p.id" class="flex items-center gap-2 text-sm">
              <input v-model="form.productIds" type="checkbox" :value="p.id" /> {{ p.name }}
            </label>
          </div>
        </div>

        <div class="flex gap-3">
          <button type="submit" class="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-cream">Save</button>
          <button type="button" class="rounded-full border border-ink-950/15 px-5 py-2.5 text-sm" @click="showForm = false">Cancel</button>
        </div>
      </form>
    </div>

    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-ink-950/10 text-left text-xs uppercase tracking-wide text-ink-950/40">
          <th class="py-2">Name</th>
          <th>Slug</th>
          <th>Products</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="collection in collections" :key="collection.id" class="border-b border-ink-950/5">
          <td class="py-3 font-medium">{{ collection.name }}</td>
          <td class="text-ink-950/60">{{ collection.slug }}</td>
          <td>{{ collection._count?.products ?? 0 }}</td>
          <td><span :class="collection.isActive ? 'text-green-600' : 'text-ink-950/40'">{{ collection.isActive ? "Active" : "Inactive" }}</span></td>
          <td class="space-x-3 text-right">
            <button class="text-ink-950/60 hover:text-ink-950" @click="startEdit(collection)">Edit</button>
            <button class="text-red-500 hover:text-red-700" @click="remove(collection)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
