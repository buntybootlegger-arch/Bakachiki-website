<script setup lang="ts">
const props = defineProps<{ modelValue: string | null | undefined; label?: string }>();
const emit = defineEmits<{ "update:modelValue": [string] }>();

const adminAuth = useAdminAuthStore();
const uploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const isVideo = computed(() => /\.(mp4|webm)$/i.test(props.modelValue ?? ""));

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append("file", file);
    const media = await adminAuth.authFetch<{ url: string }>("/admin/media/upload", {
      method: "POST",
      body: formData,
    });
    emit("update:modelValue", media.url);
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
}
</script>

<template>
  <div>
    <label v-if="label" class="mb-1 block text-sm font-medium">{{ label }}</label>
    <div class="flex items-center gap-3">
      <video
        v-if="modelValue && isVideo"
        :src="modelValue"
        muted
        class="h-16 w-16 rounded-lg border border-ink-950/10 object-cover"
      />
      <img
        v-else-if="modelValue"
        :src="modelValue"
        alt=""
        class="h-16 w-16 rounded-lg border border-ink-950/10 object-cover"
      />
      <div class="flex-1 space-y-2">
        <input
          :value="modelValue"
          placeholder="Image or video URL"
          class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
        <div class="flex items-center gap-2">
          <input ref="fileInput" type="file" accept="image/*,video/mp4,video/webm" class="text-xs" @change="onFileChange" />
          <span v-if="uploading" class="text-xs text-ink-950/50">Uploading…</span>
        </div>
      </div>
    </div>
  </div>
</template>
