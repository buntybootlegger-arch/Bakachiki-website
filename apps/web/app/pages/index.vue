<script setup lang="ts">
import type { PageDTO } from "@bakachiki/shared";

const sectionComponentMap = usePageSectionComponents();

const api = useApi();
const { data: page } = await useAsyncData("home-page", () => api<PageDTO>("/pages/home"));

useSeoMeta({
  title: () => page.value?.seoTitle || "Wear the Noise",
  description: () => page.value?.seoDescription || "Bold, funky, streetwear-inspired fashion — new drops weekly.",
});
</script>

<template>
  <div>
    <component
      :is="sectionComponentMap[section.type]"
      v-for="section in page?.sections ?? []"
      :key="section.id"
      :config="section.config"
    />
  </div>
</template>
