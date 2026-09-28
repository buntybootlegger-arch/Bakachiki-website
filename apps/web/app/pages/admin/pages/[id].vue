<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin-auth" });

const route = useRoute();
const pageId = computed(() => route.params.id as string);
const adminAuth = useAdminAuthStore();
const { confirm } = useConfirm();

const { data: page } = await useAsyncData(`admin-page-${pageId.value}`, () =>
  adminAuth.authFetch<any>(`/admin/pages/${pageId.value}`),
);
const { data: sections, refresh } = await useAsyncData(`admin-page-sections-${pageId.value}`, () =>
  adminAuth.authFetch<any[]>(`/admin/pages/${pageId.value}/sections`),
);
const { data: categories } = await useAsyncData("admin-pages-categories", () =>
  adminAuth.authFetch<any[]>("/admin/categories"),
);
const { data: collections } = await useAsyncData("admin-pages-collections", () =>
  adminAuth.authFetch<any[]>("/admin/collections"),
);
const { data: campaigns } = await useAsyncData("admin-pages-campaigns", () =>
  adminAuth.authFetch<any[]>("/admin/campaigns"),
);
const { data: lookbooks } = await useAsyncData("admin-pages-lookbooks", () =>
  adminAuth.authFetch<any[]>("/admin/lookbooks"),
);

const sectionTypes = [
  "HERO",
  "BANNER",
  "VIDEO_BANNER",
  "MARQUEE",
  "PRODUCT_GRID",
  "CATEGORY_GRID",
  "COLLECTION_GRID",
  "POSTER_GRID",
  "CAMPAIGN_TEASER",
  "LOOKBOOK_TEASER",
  "RICH_TEXT",
];
const animationPresets = ["fadeUp", "fadeIn", "staggerUp", "parallax", "scaleReveal", "none"];

const showForm = ref(false);
const editingId = ref<string | null>(null);
const selectedType = ref("HERO");

function emptyConfig() {
  return {
    heading: "",
    subheading: "",
    mediaType: "IMAGE",
    imageUrl: "",
    mobileImageUrl: "",
    videoUrl: "",
    posterImageUrl: "",
    ctaText: "",
    ctaUrl: "",
    title: "",
    subtitle: "",
    source: "FEATURED",
    categorySlug: "",
    limit: 8,
    categorySlugs: [] as string[],
    collectionSlugs: [] as string[],
    text: "",
    repeat: 4,
    speed: 40,
    posters: [] as { imageUrl: string; heading: string; ctaUrl: string }[],
    campaignSlug: "",
    lookbookSlug: "",
    body: "",
    align: "left",
    animationPreset: "fadeUp",
  };
}

const config = reactive(emptyConfig());

function resetForm() {
  editingId.value = null;
  selectedType.value = "HERO";
  Object.assign(config, emptyConfig());
}

function startCreate() {
  resetForm();
  showForm.value = true;
}

function startEdit(section: any) {
  editingId.value = section.id;
  selectedType.value = section.type;
  Object.assign(config, emptyConfig(), section.config, {
    animationPreset: section.config.animation?.preset ?? "fadeUp",
  });
  showForm.value = true;
}

function addPoster() {
  config.posters.push({ imageUrl: "", heading: "", ctaUrl: "" });
}
function removePoster(index: number) {
  config.posters.splice(index, 1);
}

const HAS_ANIMATION = new Set([
  "HERO", "BANNER", "VIDEO_BANNER", "PRODUCT_GRID", "CATEGORY_GRID",
  "COLLECTION_GRID", "POSTER_GRID", "CAMPAIGN_TEASER", "LOOKBOOK_TEASER", "RICH_TEXT",
]);

function withAnimation(base: Record<string, unknown>) {
  if (!HAS_ANIMATION.has(selectedType.value)) return base;
  return { ...base, animation: { preset: config.animationPreset } };
}

function buildConfigPayload() {
  switch (selectedType.value) {
    case "HERO":
    case "BANNER":
      return withAnimation({
        heading: config.heading,
        subheading: config.subheading,
        mediaType: config.mediaType,
        imageUrl: config.imageUrl,
        mobileImageUrl: config.mobileImageUrl || undefined,
        videoUrl: config.videoUrl || undefined,
        ctaText: config.ctaText,
        ctaUrl: config.ctaUrl,
      });
    case "VIDEO_BANNER":
      return withAnimation({
        videoUrl: config.videoUrl,
        posterImageUrl: config.posterImageUrl || undefined,
        heading: config.heading,
        subheading: config.subheading,
        ctaText: config.ctaText,
        ctaUrl: config.ctaUrl,
      });
    case "MARQUEE":
      return { text: config.text, repeat: Number(config.repeat), speed: Number(config.speed) };
    case "PRODUCT_GRID":
      return withAnimation({
        title: config.title,
        subtitle: config.subtitle,
        source: config.source,
        categorySlug: config.source === "CATEGORY" ? config.categorySlug || undefined : undefined,
        limit: Number(config.limit),
      });
    case "CATEGORY_GRID":
      return withAnimation({ title: config.title, categorySlugs: config.categorySlugs });
    case "COLLECTION_GRID":
      return withAnimation({ title: config.title, subtitle: config.subtitle, collectionSlugs: config.collectionSlugs });
    case "POSTER_GRID":
      return withAnimation({ title: config.title, posters: config.posters });
    case "CAMPAIGN_TEASER":
      return withAnimation({ campaignSlug: config.campaignSlug, heading: config.heading, ctaText: config.ctaText });
    case "LOOKBOOK_TEASER":
      return withAnimation({ lookbookSlug: config.lookbookSlug, heading: config.heading, ctaText: config.ctaText });
    case "RICH_TEXT":
      return withAnimation({ heading: config.heading, body: config.body, align: config.align });
    default:
      return {};
  }
}

async function submit() {
  const payload = { type: selectedType.value, config: buildConfigPayload() };
  if (editingId.value) {
    await adminAuth.authFetch(`/admin/pages/${pageId.value}/sections/${editingId.value}`, { method: "PATCH", body: payload });
  } else {
    await adminAuth.authFetch(`/admin/pages/${pageId.value}/sections`, { method: "POST", body: payload });
  }
  showForm.value = false;
  resetForm();
  await refresh();
}

async function toggleActive(section: any) {
  await adminAuth.authFetch(`/admin/pages/${pageId.value}/sections/${section.id}`, {
    method: "PATCH",
    body: { isActive: !section.isActive },
  });
  await refresh();
}

async function move(section: any, direction: -1 | 1) {
  const list = sections.value ?? [];
  const index = list.findIndex((s) => s.id === section.id);
  const swapWith = list[index + direction];
  if (!swapWith) return;
  await adminAuth.authFetch(`/admin/pages/${pageId.value}/sections/reorder`, {
    method: "PUT",
    body: { items: [{ id: section.id, order: swapWith.order }, { id: swapWith.id, order: section.order }] },
  });
  await refresh();
}

async function remove(section: any) {
  const ok = await confirm({ title: "Delete section?", message: "This section will be removed from the page." });
  if (!ok) return;
  await adminAuth.authFetch(`/admin/pages/${pageId.value}/sections/${section.id}`, { method: "DELETE" });
  await refresh();
}

useSeoMeta({ title: () => page.value?.title ?? "Page Builder" });
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <NuxtLink to="/admin/pages" class="text-xs uppercase tracking-wide text-ink-950/40">← All Pages</NuxtLink>
        <h1 class="font-display text-2xl font-extrabold uppercase tracking-tight">{{ page?.title }}</h1>
        <p class="text-xs text-ink-950/40">/{{ page?.slug }}</p>
      </div>
      <button class="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-cream" @click="startCreate">+ Add Section</button>
    </div>

    <div v-if="showForm" class="mb-8 rounded-xl border border-ink-950/10 p-6">
      <h2 class="mb-4 font-display text-lg">{{ editingId ? "Edit" : "Add" }} Section</h2>
      <form class="space-y-4" @submit.prevent="submit">
        <select v-model="selectedType" :disabled="!!editingId" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm">
          <option v-for="t in sectionTypes" :key="t" :value="t">{{ t.replace(/_/g, ' ') }}</option>
        </select>

        <template v-if="selectedType === 'HERO' || selectedType === 'BANNER'">
          <input v-model="config.heading" placeholder="Heading" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <input v-model="config.subheading" placeholder="Subheading" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <select v-model="config.mediaType" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm">
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
          </select>
          <AdminImagePicker v-if="config.mediaType === 'IMAGE'" v-model="config.imageUrl" label="Image" />
          <AdminImagePicker v-if="config.mediaType === 'IMAGE'" v-model="config.mobileImageUrl" label="Mobile Image (optional)" />
          <AdminImagePicker v-if="config.mediaType === 'VIDEO'" v-model="config.videoUrl" label="Video" />
          <div class="grid grid-cols-2 gap-4">
            <input v-model="config.ctaText" placeholder="CTA text" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
            <input v-model="config.ctaUrl" placeholder="CTA URL" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          </div>
        </template>

        <template v-else-if="selectedType === 'VIDEO_BANNER'">
          <AdminImagePicker v-model="config.videoUrl" label="Video" />
          <AdminImagePicker v-model="config.posterImageUrl" label="Poster image (optional)" />
          <input v-model="config.heading" placeholder="Heading" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <input v-model="config.subheading" placeholder="Subheading" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <div class="grid grid-cols-2 gap-4">
            <input v-model="config.ctaText" placeholder="CTA text" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
            <input v-model="config.ctaUrl" placeholder="CTA URL" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          </div>
        </template>

        <template v-else-if="selectedType === 'MARQUEE'">
          <input v-model="config.text" placeholder="Marquee text" required class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <div class="grid grid-cols-2 gap-4">
            <input v-model.number="config.repeat" type="number" min="1" max="12" placeholder="Repeat count" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
            <input v-model.number="config.speed" type="number" min="10" max="200" placeholder="Speed (px/s)" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          </div>
        </template>

        <template v-else-if="selectedType === 'PRODUCT_GRID'">
          <input v-model="config.title" placeholder="Section title" required class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <input v-model="config.subtitle" placeholder="Subtitle (optional)" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <select v-model="config.source" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm">
            <option value="FEATURED">Featured</option>
            <option value="NEW_ARRIVALS">New Arrivals</option>
            <option value="BEST_SELLERS">Best Sellers</option>
            <option value="CATEGORY">Specific Category</option>
          </select>
          <select v-if="config.source === 'CATEGORY'" v-model="config.categorySlug" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm">
            <option value="">Choose category</option>
            <option v-for="c in categories" :key="c.id" :value="c.slug">{{ c.name }}</option>
          </select>
          <input v-model.number="config.limit" type="number" min="1" max="24" placeholder="Number of products" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        </template>

        <template v-else-if="selectedType === 'CATEGORY_GRID'">
          <input v-model="config.title" placeholder="Section title" required class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <div class="grid grid-cols-2 gap-2">
            <label v-for="c in categories" :key="c.id" class="flex items-center gap-2 text-sm">
              <input v-model="config.categorySlugs" type="checkbox" :value="c.slug" /> {{ c.name }}
            </label>
          </div>
        </template>

        <template v-else-if="selectedType === 'COLLECTION_GRID'">
          <input v-model="config.title" placeholder="Section title" required class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <input v-model="config.subtitle" placeholder="Subtitle (optional)" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <div class="grid grid-cols-2 gap-2">
            <label v-for="c in collections" :key="c.id" class="flex items-center gap-2 text-sm">
              <input v-model="config.collectionSlugs" type="checkbox" :value="c.slug" /> {{ c.name }}
            </label>
          </div>
        </template>

        <template v-else-if="selectedType === 'POSTER_GRID'">
          <input v-model="config.title" placeholder="Section title (optional)" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <div v-for="(poster, i) in config.posters" :key="i" class="space-y-2 rounded-lg border border-ink-950/10 p-3">
            <AdminImagePicker v-model="poster.imageUrl" label="Poster image" />
            <input v-model="poster.heading" placeholder="Heading (optional)" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
            <input v-model="poster.ctaUrl" placeholder="Link URL (optional)" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
            <button type="button" class="text-xs text-red-500" @click="removePoster(i)">Remove poster</button>
          </div>
          <button type="button" class="text-sm underline" @click="addPoster">+ Add poster</button>
        </template>

        <template v-else-if="selectedType === 'CAMPAIGN_TEASER'">
          <select v-model="config.campaignSlug" required class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm">
            <option value="">Choose campaign</option>
            <option v-for="c in campaigns" :key="c.id" :value="c.slug">{{ c.name }}</option>
          </select>
          <input v-model="config.heading" placeholder="Heading override (optional)" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <input v-model="config.ctaText" placeholder="CTA text (optional)" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        </template>

        <template v-else-if="selectedType === 'LOOKBOOK_TEASER'">
          <select v-model="config.lookbookSlug" required class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm">
            <option value="">Choose lookbook</option>
            <option v-for="l in lookbooks" :key="l.id" :value="l.slug">{{ l.title }}</option>
          </select>
          <input v-model="config.heading" placeholder="Heading override (optional)" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <input v-model="config.ctaText" placeholder="CTA text (optional)" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
        </template>

        <template v-else-if="selectedType === 'RICH_TEXT'">
          <input v-model="config.heading" placeholder="Heading (optional)" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <textarea v-model="config.body" rows="4" placeholder="Body text" required class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
          <select v-model="config.align" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm">
            <option value="left">Align left</option>
            <option value="center">Align center</option>
          </select>
        </template>

        <div v-if="HAS_ANIMATION.has(selectedType)">
          <label class="mb-1 block text-sm font-medium">Animation</label>
          <select v-model="config.animationPreset" class="w-full rounded-lg border border-ink-950/15 px-3 py-2 text-sm">
            <option v-for="p in animationPresets" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>

        <div class="flex gap-3">
          <button type="submit" class="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-cream">Save</button>
          <button type="button" class="rounded-full border border-ink-950/15 px-5 py-2.5 text-sm" @click="showForm = false">Cancel</button>
        </div>
      </form>
    </div>

    <ul class="space-y-3">
      <li v-for="(section, i) in sections" :key="section.id" class="flex items-center justify-between rounded-xl border border-ink-950/10 p-4">
        <div>
          <p class="text-xs uppercase tracking-wide text-ink-950/40">{{ section.type.replace(/_/g, ' ') }}</p>
          <p class="font-medium">{{ section.config.heading || section.config.title || section.config.text || "Untitled section" }}</p>
        </div>
        <div class="flex items-center gap-3 text-sm">
          <button :disabled="i === 0" class="disabled:opacity-30" @click="move(section, -1)">↑</button>
          <button :disabled="i === (sections?.length ?? 0) - 1" class="disabled:opacity-30" @click="move(section, 1)">↓</button>
          <button class="underline" @click="toggleActive(section)">{{ section.isActive ? "Hide" : "Show" }}</button>
          <button class="underline" @click="startEdit(section)">Edit</button>
          <button class="text-red-500" @click="remove(section)">Delete</button>
        </div>
      </li>
    </ul>
  </div>
</template>
