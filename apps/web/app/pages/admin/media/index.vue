<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin-auth" });

const adminAuth = useAdminAuthStore();
const { confirm } = useConfirm();
const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);

const { data: media, refresh } = await useAsyncData("admin-media", () => adminAuth.authFetch<any[]>("/admin/media"));

async function onUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append("file", file);
    await adminAuth.authFetch("/admin/media/upload", { method: "POST", body: formData });
    await refresh();
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
}

async function remove(item: any) {
  const ok = await confirm({ title: "Delete file?", message: `"${item.originalName}" will be permanently removed.` });
  if (!ok) return;
  await adminAuth.authFetch(`/admin/media/${item.id}`, { method: "DELETE" });
  await refresh();
}

async function copyUrl(url: string) {
  await navigator.clipboard.writeText(url);
}

function formatSize(bytes: number) {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

useSeoMeta({ title: "Media Library" });
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="font-display text-2xl">Media Library</h1>
      <label class="cursor-pointer rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-paper">
        {{ uploading ? "Uploading…" : "+ Upload File" }}
        <input ref="fileInput" type="file" class="hidden" accept="image/*,video/mp4,video/webm,application/pdf" @change="onUpload" />
      </label>
    </div>

    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
      <div v-for="item in media" :key="item.id" class="group relative overflow-hidden rounded-xl border border-ink-950/10">
        <img v-if="item.type === 'IMAGE' || item.type === 'GIF'" :src="item.url" :alt="item.originalName" class="aspect-square w-full object-cover" />
        <video v-else-if="item.type === 'VIDEO'" :src="item.url" class="aspect-square w-full object-cover" muted />
        <div v-else class="flex aspect-square w-full items-center justify-center bg-ink-900/5 text-xs">PDF</div>

        <div class="absolute inset-0 flex flex-col justify-between bg-ink-950/0 p-2 opacity-0 transition-opacity group-hover:bg-ink-950/50 group-hover:opacity-100">
          <p class="truncate text-[10px] text-paper">{{ item.originalName }} · {{ formatSize(item.sizeBytes) }}</p>
          <div class="flex justify-end gap-2">
            <button class="rounded bg-paper px-2 py-1 text-[10px] font-semibold" @click="copyUrl(item.url)">Copy URL</button>
            <button class="rounded bg-red-600 px-2 py-1 text-[10px] font-semibold text-white" @click="remove(item)">Delete</button>
          </div>
        </div>
      </div>
    </div>
    <p v-if="!media?.length" class="text-sm text-ink-950/50">No media uploaded yet.</p>
  </div>
</template>
