<script setup lang="ts">
definePageMeta({ layout: false });

const adminAuth = useAdminAuthStore();
const router = useRouter();

const email = ref("");
const password = ref("");
const error = ref<string | null>(null);
const loading = ref(false);

async function submit() {
  error.value = null;
  loading.value = true;
  try {
    await adminAuth.login({ email: email.value, password: password.value });
    router.push("/admin");
  } catch (err: any) {
    error.value = err?.data?.message ?? "Invalid email or password";
  } finally {
    loading.value = false;
  }
}

useSeoMeta({ title: "Admin Login" });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-ink-950 px-6">
    <div class="w-full max-w-sm rounded-2xl bg-paper p-8">
      <h1 class="mb-1 font-display text-2xl">Admin Sign In</h1>
      <p class="mb-6 text-sm text-ink-950/50">Bakachiki Control Panel</p>
      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="mb-1 block text-sm font-medium">Email</label>
          <input v-model="email" type="email" required class="w-full rounded-lg border border-ink-950/15 px-4 py-2.5" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Password</label>
          <input v-model="password" type="password" required class="w-full rounded-lg border border-ink-950/15 px-4 py-2.5" />
        </div>
        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
        <button type="submit" :disabled="loading" class="w-full rounded-full bg-ink-950 py-3 text-sm font-semibold text-paper disabled:opacity-50">
          {{ loading ? "Signing in…" : "Sign In" }}
        </button>
      </form>
    </div>
  </div>
</template>
