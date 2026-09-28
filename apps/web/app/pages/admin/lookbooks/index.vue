<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin-auth" });

const adminAuth = useAdminAuthStore();
const { confirm } = useConfirm();

const { data: lookbooks, refresh } = await useAsyncData("admin-lookbooks", () =>
  adminAuth.authFetch<any[]>("/admin/lookbooks"),
);
const { data: productsResponse } = await useAsyncData("admin-lookbooks-products", () =>
  adminAuth.authFetch<{ items: any[] }>("/admin/products", { query: { pageSize: 200 } }),
);
const allProducts = computed(() => productsResponse.value?.items ?? []);

const showForm = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({ title: "", slug: "", coverImageUrl: "", isActive: true });
const slides = ref<{ mediaUrl: string; mediaType: "IMAGE" | "VIDEO"; caption: string; productIds: string[] }[]>([]);

function resetForm() {
  Object.assign(form, { title: "", slug: "", coverImageUrl: "", isActive: true });
  slides.value = [];
  editingId.value = null;
}

function startCreate() {
  resetForm();
  showForm.value = true;
}

async function startEdit(lookbook: any) {
  const detail = await adminAuth.authFetch<any>(`/admin/lookbooks/${lookbook.id}`);
  editingId.value = lookbook.id;
  Object.assign(form, {
    title: detail.title,
    slug: detail.slug,
    coverImageUrl: detail.coverImageUrl ?? "",
    isActive: detail.isActive,
  });
  slides.value = (detail.slides ?? []).map((s: any) => ({
    mediaUrl: s.mediaUrl,
    mediaType: s.mediaType,
    caption: s.caption ?? "",
    productIds: s.productIds ?? [],
  }));
  showForm.value = true;
}

function addSlide() {
  slides.value.push({ mediaUrl: "", mediaType: "IMAGE", caption: "", productIds: [] });
}
function removeSlide(index: number) {
  slides.value.splice(index, 1);
}

async function submit() {
  let id = editingId.value;
  if (id) {
    await adminAuth.authFetch(`/admin/lookbooks/${id}`, { method: "PATCH", body: form });
  } else {
    const created = await adminAuth.authFetch<any>("/admin/lookbooks", { method: "POST", body: form });
    id = created.id;
  }
  await adminAuth.authFetch(`/admin/lookbooks/${id}/slides`, {
    method: "PUT",
    body: { slides: slides.value.map((s, i) => ({ ...s, position: i })) },
  });
  showForm.value = false;
  resetForm();
  await refresh();
}

async function remove(lookbook: any) {
  const ok = await confirm({ title: "Delete lookbook?", message: `"${lookbook.title}" will be permanently removed.` });
  if (!ok) return;
  await adminAuth.authFetch(`/admin/lookbooks/${lookbook.id}`, { method: "DELETE" });
  await refresh();
}

useSeoMeta({ title: "Lookbooks" });
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="font-display text-2xl font-extrabold uppercase tracking-tight">Lookbooks</h1>
      <button class="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-cream" @click="startCreate">+ New Lookbook</button>
    </div>

    <div v-if="showForm" class="mb-8 rounded-xl border border-ink-950/10 p-6">
      <h2 class="mb-4 font-display text-lg">{{ editingId ? "Edit" : "Create" }} Lookbook</h2>
      <form class="space-y-6" @submit.prevent="submit">
        <div class="grid grid-cols-2 gap-4">
          <input v-model="form.title" placeholder="Title" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <input v-model="form.slug" placeholder="Slug (auto if blank)" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        </div>
        <AdminImagePicker v-model="form.coverImageUrl" label="Cover image" />
        <label class="flex items-center gap-2 text-sm"><input v-model="form.isActive" type="checkbox" /> Active</label>

        <div>
          <div class="mb-2 flex items-center justify-between">
            <p class="text-sm font-medium">Slides</p>
            <button type="button" class="text-sm underline" @click="addSlide">+ Add slide</button>
          </div>
          <div v-for="(slide, i) in slides" :key="i" class="mb-4 space-y-2 rounded-lg border border-ink-950/10 p-3">
            <div class="flex items-center justify-between">
              <span class="text-xs uppercase tracking-wide text-ink-950/40">Slide {{ i + 1 }}</span>
              <button type="button" class="text-xs text-red-500" @click="removeSlide(i)">Remove</button>
            </div>
            <select v-model="slide.mediaType" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm">
              <option value="IMAGE">Image</option>
              <option value="VIDEO">Video</option>
            </select>
            <AdminImagePicker v-model="slide.mediaUrl" label="Media" />
            <input v-model="slide.caption" placeholder="Caption (optional)" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
            <details>
              <summary class="cursor-pointer text-xs text-ink-950/50">{{ slide.productIds.length }} tagged products</summary>
              <div class="mt-2 grid max-h-40 grid-cols-2 gap-1 overflow-y-auto">
                <label v-for="p in allProducts" :key="p.id" class="flex items-center gap-2 text-xs">
                  <input v-model="slide.productIds" type="checkbox" :value="p.id" /> {{ p.name }}
                </label>
              </div>
            </details>
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
          <th class="py-2">Title</th>
          <th>Slug</th>
          <th>Slides</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="lookbook in lookbooks" :key="lookbook.id" class="border-b border-ink-950/5">
          <td class="py-3 font-medium">{{ lookbook.title }}</td>
          <td class="text-ink-950/60">{{ lookbook.slug }}</td>
          <td>{{ lookbook._count?.slides ?? 0 }}</td>
          <td><span :class="lookbook.isActive ? 'text-green-600' : 'text-ink-950/40'">{{ lookbook.isActive ? "Active" : "Inactive" }}</span></td>
          <td class="space-x-3 text-right">
            <button class="text-ink-950/60 hover:text-ink-950" @click="startEdit(lookbook)">Edit</button>
            <button class="text-red-500 hover:text-red-700" @click="remove(lookbook)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
