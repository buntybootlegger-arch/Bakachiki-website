<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin-auth" });

const adminAuth = useAdminAuthStore();
const { confirm } = useConfirm();

const { data: brands, refresh } = await useAsyncData("admin-brands", () =>
  adminAuth.authFetch<any[]>("/admin/brands"),
);

const showForm = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({ name: "", slug: "", logoUrl: "", isActive: true });

function resetForm() {
  Object.assign(form, { name: "", slug: "", logoUrl: "", isActive: true });
  editingId.value = null;
}

function startCreate() {
  resetForm();
  showForm.value = true;
}

function startEdit(brand: any) {
  editingId.value = brand.id;
  Object.assign(form, { name: brand.name, slug: brand.slug, logoUrl: brand.logoUrl ?? "", isActive: brand.isActive });
  showForm.value = true;
}

async function submit() {
  if (editingId.value) {
    await adminAuth.authFetch(`/admin/brands/${editingId.value}`, { method: "PATCH", body: form });
  } else {
    await adminAuth.authFetch("/admin/brands", { method: "POST", body: form });
  }
  showForm.value = false;
  resetForm();
  await refresh();
}

async function remove(brand: any) {
  const ok = await confirm({ title: "Delete brand?", message: `"${brand.name}" will be permanently removed.` });
  if (!ok) return;
  await adminAuth.authFetch(`/admin/brands/${brand.id}`, { method: "DELETE" });
  await refresh();
}

useSeoMeta({ title: "Brands" });
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="font-display text-2xl">Brands</h1>
      <button class="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-paper" @click="startCreate">+ New Brand</button>
    </div>

    <div v-if="showForm" class="mb-8 rounded-xl border border-ink-950/10 p-6">
      <h2 class="mb-4 font-display text-lg">{{ editingId ? "Edit" : "Create" }} Brand</h2>
      <form class="grid grid-cols-2 gap-4" @submit.prevent="submit">
        <input v-model="form.name" placeholder="Name" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        <input v-model="form.slug" placeholder="Slug (auto if blank)" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        <label class="flex items-center gap-2 text-sm"><input v-model="form.isActive" type="checkbox" /> Active</label>
        <AdminImagePicker v-model="form.logoUrl" label="Logo" />
        <div class="col-span-2 flex gap-3">
          <button type="submit" class="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-paper">Save</button>
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
        <tr v-for="brand in brands" :key="brand.id" class="border-b border-ink-950/5">
          <td class="py-3 font-medium">{{ brand.name }}</td>
          <td class="text-ink-950/60">{{ brand.slug }}</td>
          <td>{{ brand._count?.products ?? 0 }}</td>
          <td><span :class="brand.isActive ? 'text-green-600' : 'text-ink-950/40'">{{ brand.isActive ? "Active" : "Inactive" }}</span></td>
          <td class="space-x-3 text-right">
            <button class="text-ink-950/60 hover:text-ink-950" @click="startEdit(brand)">Edit</button>
            <button class="text-red-500 hover:text-red-700" @click="remove(brand)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
