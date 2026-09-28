<script setup lang="ts">
const adminAuth = useAdminAuthStore();
const router = useRouter();

async function logout() {
  await adminAuth.logout();
  router.push("/admin/login");
}
</script>

<template>
  <div class="flex min-h-screen bg-paper">
    <AdminSidebar />
    <div class="flex-1">
      <header class="flex items-center justify-between border-b border-ink-950/10 px-8 py-4">
        <p class="text-sm text-ink-950/50">Signed in as</p>
        <div class="flex items-center gap-4">
          <div class="text-right text-sm">
            <p class="font-medium">{{ adminAuth.admin?.email }}</p>
            <p class="text-xs uppercase tracking-wide text-ink-950/40">{{ adminAuth.admin?.role.name }}</p>
          </div>
          <button class="rounded-full border border-ink-950/15 px-4 py-1.5 text-sm" @click="logout">Log out</button>
        </div>
      </header>
      <main class="p-8">
        <slot />
      </main>
    </div>
    <ConfirmDialogHost />
  </div>
</template>
