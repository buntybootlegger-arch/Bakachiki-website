<script setup lang="ts">
const auth = useAuthStore();
const router = useRouter();

const firstName = ref("");
const email = ref("");
const password = ref("");
const error = ref<string | null>(null);
const loading = ref(false);

async function submit() {
  error.value = null;
  loading.value = true;
  try {
    await auth.register({ email: email.value, password: password.value, firstName: firstName.value });
    router.push("/account");
  } catch (err: any) {
    error.value = err?.data?.message ?? "Could not create your account";
  } finally {
    loading.value = false;
  }
}

useSeoMeta({ title: "Create Account" });
</script>

<template>
  <div class="mx-auto max-w-md px-6 py-20">
    <h1 class="mb-8 font-display text-3xl">Create Account</h1>
    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <label class="mb-1 block text-sm font-medium">First name</label>
        <input v-model="firstName" type="text" class="w-full rounded-lg border border-ink-950/15 px-4 py-2.5" />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium">Email</label>
        <input v-model="email" type="email" required class="w-full rounded-lg border border-ink-950/15 px-4 py-2.5" />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium">Password</label>
        <input v-model="password" type="password" required minlength="8" class="w-full rounded-lg border border-ink-950/15 px-4 py-2.5" />
      </div>
      <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
      <button type="submit" :disabled="loading" class="w-full rounded-full bg-ink-950 py-3 text-sm font-semibold text-paper disabled:opacity-50">
        {{ loading ? "Creating…" : "Create Account" }}
      </button>
    </form>
    <p class="mt-6 text-center text-sm text-ink-950/60">
      Already have an account? <NuxtLink to="/login" class="font-medium underline">Sign in</NuxtLink>
    </p>
  </div>
</template>
