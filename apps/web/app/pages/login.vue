<script setup lang="ts">
const auth = useAuthStore();
const router = useRouter();

const email = ref("");
const password = ref("");
const error = ref<string | null>(null);
const loading = ref(false);

async function submit() {
  error.value = null;
  loading.value = true;
  try {
    await auth.login({ email: email.value, password: password.value });
    router.push("/account");
  } catch (err: any) {
    error.value = err?.data?.message ?? "Invalid email or password";
  } finally {
    loading.value = false;
  }
}

useSeoMeta({ title: "Login" });
</script>

<template>
  <div class="mx-auto max-w-md px-6 py-20">
    <h1 class="mb-8 font-display text-3xl">Welcome Back</h1>
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
    <p class="mt-6 text-center text-sm text-ink-950/60">
      New here? <NuxtLink to="/register" class="font-medium underline">Create an account</NuxtLink>
    </p>
  </div>
</template>
