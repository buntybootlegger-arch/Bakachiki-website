<script setup lang="ts">
withDefaults(defineProps<{ color?: string; className?: string }>(), {
  color: "currentColor",
  className: "",
});

const patternId = `halftone-${useId()}`;
</script>

<template>
  <svg
    class="pointer-events-none absolute"
    :class="className"
    viewBox="0 0 120 120"
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <pattern :id="patternId" width="10" height="10" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.6" :fill="color" />
      </pattern>
    </defs>
    <rect width="120" height="120" :fill="`url(#${patternId})`" />
  </svg>
</template>
