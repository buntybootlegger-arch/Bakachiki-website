<script setup lang="ts">
import type { PageDTO } from "@bakachiki/shared";

const route = useRoute();
const slug = computed(() => (Array.isArray(route.params.slug) ? route.params.slug.join("/") : route.params.slug));

const sectionComponentMap = usePageSectionComponents();

const api = useApi();
const { data: page } = await useAsyncData(() => `landing-page-${slug.value}`, () =>
  api<PageDTO>(`/pages/${slug.value}`).catch(() => null),
);

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: "Page not found" });
}

useSeoMeta({
  title: () => page.value?.seoTitle || page.value?.title,
  description: () => page.value?.seoDescription,
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
