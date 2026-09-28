<script setup lang="ts">
const props = withDefaults(
  defineProps<{ text: string; repeat?: number; speed?: number; className?: string; textClass?: string }>(),
  { repeat: 4, speed: 60, className: "", textClass: "text-2xl md:text-4xl" },
);

const trackRef = ref<HTMLElement | null>(null);
useMarquee(trackRef, { speed: props.speed });

const items = computed(() => Array.from({ length: props.repeat * 2 }, () => props.text));
</script>

<template>
  <div class="overflow-hidden whitespace-nowrap" :class="className">
    <div ref="trackRef" class="inline-flex w-max">
      <span
        v-for="(item, i) in items"
        :key="i"
        class="px-4 font-display font-extrabold uppercase tracking-tight"
        :class="textClass"
      >
        {{ item }}
      </span>
    </div>
  </div>
</template>
