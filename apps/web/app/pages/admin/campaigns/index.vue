<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin-auth" });

const adminAuth = useAdminAuthStore();
const { confirm } = useConfirm();

const { data: campaigns, refresh } = await useAsyncData("admin-campaigns", () =>
  adminAuth.authFetch<any[]>("/admin/campaigns"),
);
const { data: collections } = await useAsyncData("admin-campaigns-collections", () =>
  adminAuth.authFetch<any[]>("/admin/collections"),
);

const showForm = ref(false);
const editingId = ref<string | null>(null);
const form = reactive({
  name: "",
  slug: "",
  tagline: "",
  description: "",
  heroImageUrl: "",
  heroVideoUrl: "",
  themeColor: "",
  collectionId: "",
  isActive: true,
});

function resetForm() {
  Object.assign(form, {
    name: "", slug: "", tagline: "", description: "", heroImageUrl: "", heroVideoUrl: "",
    themeColor: "", collectionId: "", isActive: true,
  });
  editingId.value = null;
}

function startCreate() {
  resetForm();
  showForm.value = true;
}

function startEdit(campaign: any) {
  editingId.value = campaign.id;
  Object.assign(form, {
    name: campaign.name,
    slug: campaign.slug,
    tagline: campaign.tagline ?? "",
    description: campaign.description ?? "",
    heroImageUrl: campaign.heroImageUrl ?? "",
    heroVideoUrl: campaign.heroVideoUrl ?? "",
    themeColor: campaign.themeColor ?? "",
    collectionId: campaign.collectionId ?? "",
    isActive: campaign.isActive,
  });
  showForm.value = true;
}

async function submit() {
  const body = { ...form, collectionId: form.collectionId || undefined };
  if (editingId.value) {
    await adminAuth.authFetch(`/admin/campaigns/${editingId.value}`, { method: "PATCH", body });
  } else {
    await adminAuth.authFetch("/admin/campaigns", { method: "POST", body });
  }
  showForm.value = false;
  resetForm();
  await refresh();
}

async function remove(campaign: any) {
  const ok = await confirm({ title: "Delete campaign?", message: `"${campaign.name}" will be permanently removed.` });
  if (!ok) return;
  await adminAuth.authFetch(`/admin/campaigns/${campaign.id}`, { method: "DELETE" });
  await refresh();
}

useSeoMeta({ title: "Campaigns" });
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="font-display text-2xl font-extrabold uppercase tracking-tight">Campaigns</h1>
      <button class="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-cream" @click="startCreate">+ New Campaign</button>
    </div>

    <div v-if="showForm" class="mb-8 rounded-xl border border-ink-950/10 p-6">
      <h2 class="mb-4 font-display text-lg">{{ editingId ? "Edit" : "Create" }} Campaign</h2>
      <form class="space-y-4" @submit.prevent="submit">
        <div class="grid grid-cols-2 gap-4">
          <input v-model="form.name" placeholder="Name" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <input v-model="form.slug" placeholder="Slug (auto if blank)" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        </div>
        <input v-model="form.tagline" placeholder="Tagline" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        <textarea v-model="form.description" placeholder="Description" rows="2" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        <AdminImagePicker v-model="form.heroImageUrl" label="Hero image" />
        <AdminImagePicker v-model="form.heroVideoUrl" label="Hero video (optional)" />
        <div class="grid grid-cols-2 gap-4">
          <input v-model="form.themeColor" type="color" class="h-10 w-full rounded-lg border border-ink-950/15" />
          <select v-model="form.collectionId" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm">
            <option value="">No linked collection</option>
            <option v-for="c in collections" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <label class="flex items-center gap-2 text-sm"><input v-model="form.isActive" type="checkbox" /> Active</label>

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
          <th>Collection</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="campaign in campaigns" :key="campaign.id" class="border-b border-ink-950/5">
          <td class="py-3 font-medium">{{ campaign.name }}</td>
          <td class="text-ink-950/60">{{ campaign.slug }}</td>
          <td class="text-ink-950/60">{{ campaign.collection?.name ?? "—" }}</td>
          <td><span :class="campaign.isActive ? 'text-green-600' : 'text-ink-950/40'">{{ campaign.isActive ? "Active" : "Inactive" }}</span></td>
          <td class="space-x-3 text-right">
            <button class="text-ink-950/60 hover:text-ink-950" @click="startEdit(campaign)">Edit</button>
            <button class="text-red-500 hover:text-red-700" @click="remove(campaign)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
