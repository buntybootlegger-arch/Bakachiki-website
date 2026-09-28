<script setup lang="ts">
withDefaults(defineProps<{ size?: "sm" | "md" | "lg" }>(), { size: "md" });
</script>

<template>
  <span
    class="inline-flex flex-col items-center leading-none"
    :class="{ 'gap-1': size !== 'sm', 'gap-0.5': size === 'sm' }"
  >
    <img
      src="~/assets/logo/mark.png"
      alt="Bakachiki"
      class="object-contain"
      :class="{ 'h-8 w-8': size === 'sm', 'h-11 w-11': size === 'md', 'h-16 w-16': size === 'lg' }"
    />
    <span
      class="font-display font-extrabold uppercase tracking-tight"
      :class="{ 'text-xs': size === 'sm', 'text-sm': size === 'md', 'text-lg': size === 'lg' }"
    >
      Bakachiki
    </span>
  </span>
</template>
