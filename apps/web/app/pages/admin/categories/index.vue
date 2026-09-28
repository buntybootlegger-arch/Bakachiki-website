<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin-auth" });

const adminAuth = useAdminAuthStore();
const { confirm } = useConfirm();

const { data: categories, refresh } = await useAsyncData("admin-categories", () =>
  adminAuth.authFetch<any[]>("/admin/categories"),
);

const showForm = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  bannerUrl: "",
  parentId: "",
  isActive: true,
});

function resetForm() {
  Object.assign(form, { name: "", slug: "", description: "", imageUrl: "", bannerUrl: "", parentId: "", isActive: true });
  editingId.value = null;
}

function startCreate() {
  resetForm();
  showForm.value = true;
}

function startEdit(category: any) {
  editingId.value = category.id;
  Object.assign(form, {
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    imageUrl: category.imageUrl ?? "",
    bannerUrl: category.bannerUrl ?? "",
    parentId: category.parentId ?? "",
    isActive: category.isActive,
  });
  showForm.value = true;
}

async function submit() {
  const payload = { ...form, parentId: form.parentId || undefined };
  if (editingId.value) {
    await adminAuth.authFetch(`/admin/categories/${editingId.value}`, { method: "PATCH", body: payload });
  } else {
    await adminAuth.authFetch("/admin/categories", { method: "POST", body: payload });
  }
  showForm.value = false;
  resetForm();
  await refresh();
}

async function remove(category: any) {
  const ok = await confirm({
    title: "Delete category?",
    message: `"${category.name}" will be permanently removed.`,
  });
  if (!ok) return;
  await adminAuth.authFetch(`/admin/categories/${category.id}`, { method: "DELETE" });
  await refresh();
}

useSeoMeta({ title: "Categories" });
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="font-display text-2xl">Categories</h1>
      <button class="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-paper" @click="startCreate">
        + New Category
      </button>
    </div>

    <div v-if="showForm" class="mb-8 rounded-xl border border-ink-950/10 p-6">
      <h2 class="mb-4 font-display text-lg">{{ editingId ? "Edit" : "Create" }} Category</h2>
      <form class="grid grid-cols-2 gap-4" @submit.prevent="submit">
        <input v-model="form.name" placeholder="Name" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        <input v-model="form.slug" placeholder="Slug (auto if blank)" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        <select v-model="form.parentId" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm">
          <option value="">No parent</option>
          <option v-for="c in categories?.filter((c) => c.id !== editingId)" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <label class="flex items-center gap-2 text-sm"><input v-model="form.isActive" type="checkbox" /> Active</label>
        <textarea v-model="form.description" placeholder="Description" class="col-span-2 rounded-lg border border-ink-950/15 px-3 py-2 text-sm" rows="2" />
        <AdminImagePicker v-model="form.imageUrl" label="Thumbnail" />
        <AdminImagePicker v-model="form.bannerUrl" label="Banner" />
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
        <tr v-for="category in categories" :key="category.id" class="border-b border-ink-950/5">
          <td class="py-3 font-medium">{{ category.name }}</td>
          <td class="text-ink-950/60">{{ category.slug }}</td>
          <td>{{ category._count?.products ?? 0 }}</td>
          <td>
            <span :class="category.isActive ? 'text-green-600' : 'text-ink-950/40'">
              {{ category.isActive ? "Active" : "Inactive" }}
            </span>
          </td>
          <td class="space-x-3 text-right">
            <button class="text-ink-950/60 hover:text-ink-950" @click="startEdit(category)">Edit</button>
            <button class="text-red-500 hover:text-red-700" @click="remove(category)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
