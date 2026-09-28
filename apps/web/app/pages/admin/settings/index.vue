<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin-auth" });

const adminAuth = useAdminAuthStore();

const { data: settings } = await useAsyncData("admin-settings", () =>
  adminAuth.authFetch<any>("/admin/settings"),
);

const form = reactive({
  siteName: settings.value?.siteName ?? "Bakachiki",
  colorInk: settings.value?.colorInk ?? "#0e0e10",
  colorPaper: settings.value?.colorPaper ?? "#f5f1e6",
  colorAccentPrimary: settings.value?.colorAccentPrimary ?? "#c6ff3d",
  colorAccentSecondary: settings.value?.colorAccentSecondary ?? "#ff6a2b",
  defaultSeoTitle: settings.value?.defaultSeoTitle ?? "",
  defaultSeoDescription: settings.value?.defaultSeoDescription ?? "",
  defaultOgImageUrl: settings.value?.defaultOgImageUrl ?? "",
});

const saved = ref(false);

async function submit() {
  saved.value = false;
  await adminAuth.authFetch("/admin/settings", { method: "PATCH", body: form });
  saved.value = true;
}

useSeoMeta({ title: "Settings" });
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="mb-6 font-display text-2xl font-extrabold uppercase tracking-tight">Settings</h1>

    <form class="space-y-6" @submit.prevent="submit">
      <div>
        <label class="mb-1 block text-sm font-medium">Site name</label>
        <input v-model="form.siteName" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      </div>

      <div>
        <p class="mb-2 text-sm font-medium">Theme colors</p>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div v-for="field in ['colorInk', 'colorPaper', 'colorAccentPrimary', 'colorAccentSecondary']" :key="field">
            <label class="mb-1 block text-xs uppercase tracking-wide text-ink-950/50">{{ field.replace('color', '') }}</label>
            <div class="flex items-center gap-2">
              <input v-model="(form as any)[field]" type="color" class="h-9 w-9 rounded border border-ink-950/15" />
              <span class="rounded-full border-2 border-ink-950/10 px-2 py-1 text-xs" :style="{ backgroundColor: (form as any)[field] }">&nbsp;&nbsp;&nbsp;</span>
            </div>
          </div>
        </div>
        <p class="mt-2 text-xs text-ink-950/50">
          Only Accent Primary/Secondary drive the live storefront UI (buttons, links, badges) — Ink/Paper are
          reference values for future full-theme support.
        </p>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium">Default SEO title</label>
        <input v-model="form.defaultSeoTitle" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium">Default SEO description</label>
        <textarea v-model="form.defaultSeoDescription" rows="2" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      </div>
      <AdminImagePicker v-model="form.defaultOgImageUrl" label="Default social share image" />

      <div class="flex items-center gap-3">
        <button type="submit" class="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-cream">Save Settings</button>
        <span v-if="saved" class="text-sm text-green-600">Saved.</span>
      </div>
    </form>
  </div>
</template>
