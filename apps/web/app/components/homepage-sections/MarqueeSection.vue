<script setup lang="ts">
import type { MarqueeSectionConfig } from "@bakachiki/shared";

const props = defineProps<{ config: MarqueeSectionConfig }>();
</script>

<template>
  <section class="border-y-2 border-ink-950 bg-accent py-4 text-ink-950">
    <MarqueeText :text="config.text" :repeat="config.repeat" :speed="config.speed" />
  </section>
</template>
