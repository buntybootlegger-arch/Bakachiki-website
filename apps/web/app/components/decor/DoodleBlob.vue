<script setup lang="ts">
withDefaults(defineProps<{ color?: string; className?: string }>(), {
  color: "currentColor",
  className: "",
});
</script>

<template>
  <svg
    class="pointer-events-none absolute"
    :class="className"
    viewBox="0 0 200 200"
    fill="none"
    aria-hidden="true"
  >
    <path
      :fill="color"
      d="M52 22c22-14 55-10 70 8 13 16 8 34 22 48 15 15 18 40 2 55-17 16-45 10-64 20-21 11-46 8-60-10-13-16-4-38-14-58-10-20 2-46 22-58 7-4 14-3 22-5Z"
    />
  </svg>
</template>
