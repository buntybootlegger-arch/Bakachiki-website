<script setup lang="ts">
const route = useRoute();
const api = useApi();
const slug = computed(() => route.params.slug as string);

const { data: lookbook } = await useAsyncData(() => `lookbook-${slug.value}`, () =>
  api<any>(`/lookbooks/${slug.value}`).catch(() => null),
);

if (!lookbook.value) {
  throw createError({ statusCode: 404, statusMessage: "Lookbook not found" });
}

useSeoMeta({
  title: () => lookbook.value?.seoTitle || lookbook.value?.title,
  description: () => lookbook.value?.seoDescription,
});
</script>

<template>
  <div>
    <div class="mx-auto max-w-8xl px-6 pt-14 text-center">
      <h1 class="font-display text-4xl font-extrabold uppercase tracking-tight md:text-6xl">{{ lookbook.title }}</h1>
    </div>

    <LookbookSlide v-for="slide in lookbook.slides" :key="slide.id" :slide="slide" />
  </div>
</template>
