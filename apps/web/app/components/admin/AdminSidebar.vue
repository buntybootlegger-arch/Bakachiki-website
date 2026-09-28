<script setup lang="ts">
const links = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/brands", label: "Brands" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/coupons", label: "Coupons" },
  { to: "/admin/shipping", label: "Shipping" },
  { to: "/admin/collections", label: "Collections" },
  { to: "/admin/campaigns", label: "Campaigns" },
  { to: "/admin/lookbooks", label: "Lookbooks" },
  { to: "/admin/media", label: "Media Library" },
  { to: "/admin/pages", label: "Pages" },
  { to: "/admin/settings", label: "Settings" },
  { to: "/admin/admins", label: "Admins & Roles" },
];
</script>

<template>
  <aside class="hidden w-64 shrink-0 border-r border-white/10 bg-ink-950 text-paper md:block">
    <div class="px-6 py-6">
      <Logo size="sm" />
      <p class="mt-2 text-xs uppercase tracking-wide text-paper/40">Admin Panel</p>
    </div>
    <nav class="flex flex-col gap-1 px-3">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="rounded-lg px-3 py-2.5 text-sm font-medium text-paper/70 transition-colors hover:bg-white/5 hover:text-paper"
        active-class="bg-white/10 text-paper"
      >
        {{ link.label }}
      </NuxtLink>
    </nav>
  </aside>
</template>
