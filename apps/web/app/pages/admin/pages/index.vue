<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin-auth" });

const adminAuth = useAdminAuthStore();

const { data: pages, refresh } = await useAsyncData("admin-pages", () =>
  adminAuth.authFetch<any[]>("/admin/pages"),
);

const showForm = ref(false);
const title = ref("");
const slug = ref("");

async function createPage() {
  await adminAuth.authFetch("/admin/pages", { method: "POST", body: { title: title.value, slug: slug.value } });
  title.value = "";
  slug.value = "";
  showForm.value = false;
  await refresh();
}

useSeoMeta({ title: "Pages" });
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="font-display text-2xl font-extrabold uppercase tracking-tight">Pages</h1>
      <button class="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-cream" @click="showForm = !showForm">
        + New Landing Page
      </button>
    </div>

    <form v-if="showForm" class="mb-8 flex gap-3 rounded-xl border border-ink-950/10 p-6" @submit.prevent="createPage">
      <input v-model="title" placeholder="Title" required class="flex-1 rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      <input v-model="slug" placeholder="URL slug (e.g. summer-sale)" required class="flex-1 rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      <button type="submit" class="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-cream">Create</button>
    </form>

    <ul class="space-y-3">
      <li v-for="page in pages" :key="page.id" class="flex items-center justify-between rounded-xl border border-ink-950/10 p-4">
        <div>
          <p class="font-medium">{{ page.title }}</p>
          <p class="text-xs uppercase tracking-wide text-ink-950/40">/{{ page.slug }} · {{ page._count?.sections ?? 0 }} sections</p>
        </div>
        <NuxtLink :to="`/admin/pages/${page.id}`" class="rounded-full border border-ink-950/15 px-4 py-1.5 text-sm">
          Edit Sections
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
