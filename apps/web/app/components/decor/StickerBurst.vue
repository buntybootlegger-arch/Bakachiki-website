<script setup lang="ts">
withDefaults(
  defineProps<{ text?: string; bg?: string; fg?: string; className?: string }>(),
  { text: "NEW", bg: "var(--accent-primary)", fg: "#0e0e10", className: "" },
);
</script>

<template>
  <div
    class="pointer-events-none absolute flex h-24 w-24 -rotate-12 items-center justify-center text-center"
    :class="className"
  >
    <svg viewBox="0 0 100 100" class="absolute inset-0 h-full w-full" aria-hidden="true">
      <path
        :fill="bg"
        d="M50 2 61 15 78 8 82 26 100 30 92 47 100 64 82 68 78 86 61 79 50 92 39 79 22 86 18 68 0 64 8 47 0 30 18 26 22 8 39 15Z"
      />
    </svg>
    <span
      class="relative font-display text-xs font-extrabold uppercase tracking-tight"
      :style="{ color: fg }"
    >
      {{ text }}
    </span>
  </div>
</template>
