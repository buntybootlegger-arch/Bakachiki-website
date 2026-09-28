<script setup lang="ts">
const { state } = useConfirmState();
</script>

<template>
  <Teleport to="body">
    <div v-if="state.open" class="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/50 px-6">
      <div class="w-full max-w-sm rounded-xl bg-paper p-6 shadow-xl">
        <h3 class="font-display text-lg">{{ state.title }}</h3>
        <p class="mt-2 text-sm text-ink-950/60">{{ state.message }}</p>
        <div class="mt-6 flex justify-end gap-3">
          <button class="rounded-full border border-ink-950/15 px-4 py-2 text-sm" @click="state.resolve?.(false)">
            Cancel
          </button>
          <button class="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white" @click="state.resolve?.(true)">
            {{ state.confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
