<script setup lang="ts">
import type { RichTextSectionConfig } from "@bakachiki/shared";

const props = defineProps<{ config: RichTextSectionConfig }>();

const sectionRef = ref<HTMLElement | null>(null);
useSectionAnimation(sectionRef, props.config.animation?.preset ?? "fadeIn");
</script>

<template>
  <section
    ref="sectionRef"
    class="reveal-up mx-auto max-w-3xl px-6 py-14"
    :class="config.align === 'center' ? 'text-center' : 'text-left'"
  >
    <h2 v-if="config.heading" class="mb-4 font-display text-2xl font-extrabold uppercase tracking-tight md:text-3xl">
      {{ config.heading }}
    </h2>
    <p class="whitespace-pre-line text-base leading-relaxed text-ink-950/80">{{ config.body }}</p>
  </section>
</template>
