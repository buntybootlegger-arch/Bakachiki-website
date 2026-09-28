<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin-auth" });

const adminAuth = useAdminAuthStore();
const { confirm } = useConfirm();

const { data: admins, refresh } = await useAsyncData("admin-admins", () => adminAuth.authFetch<any[]>("/admins"));
const { data: roles } = await useAsyncData("admin-roles", () => adminAuth.authFetch<any[]>("/roles"));
const { data: permissions } = await useAsyncData("admin-permissions", () => adminAuth.authFetch<any[]>("/permissions"));

const error = ref<string | null>(null);
const showForm = ref(false);
const form = reactive({ email: "", password: "", firstName: "", lastName: "", roleId: "" });

async function submitCreate() {
  error.value = null;
  try {
    await adminAuth.authFetch("/admins", { method: "POST", body: form });
    showForm.value = false;
    Object.assign(form, { email: "", password: "", firstName: "", lastName: "", roleId: "" });
    await refresh();
  } catch (err: any) {
    error.value = err?.data?.message ?? "Could not create admin";
  }
}

async function toggleActive(admin: any) {
  await adminAuth.authFetch(`/admins/${admin.id}`, { method: "PATCH", body: { isActive: !admin.isActive } });
  await refresh();
}

async function changeRole(admin: any, roleId: string) {
  await adminAuth.authFetch(`/admins/${admin.id}`, { method: "PATCH", body: { roleId } });
  await refresh();
}

async function resetPassword(admin: any) {
  const newPassword = window.prompt(`New password for ${admin.email} (min 8 characters):`);
  if (!newPassword) return;
  await adminAuth.authFetch(`/admins/${admin.id}/reset-password`, { method: "POST", body: { newPassword } });
}

async function remove(admin: any) {
  const ok = await confirm({ title: "Delete admin?", message: `"${admin.email}" will lose access immediately.` });
  if (!ok) return;
  await adminAuth.authFetch(`/admins/${admin.id}`, { method: "DELETE" });
  await refresh();
}

// Permission overrides modal
const overridesFor = ref<any | null>(null);
const overrideState = reactive<Record<string, "DEFAULT" | "GRANT" | "REVOKE">>({});

async function openOverrides(admin: any) {
  const detail = await adminAuth.authFetch<any>(`/admins/${admin.id}`);
  overridesFor.value = admin;
  for (const p of permissions.value ?? []) overrideState[p.id] = "DEFAULT";
  for (const o of detail.permissionOverrides ?? []) overrideState[o.permissionId] = o.effect;
}

async function saveOverrides() {
  const overrides = Object.entries(overrideState)
    .filter(([, effect]) => effect !== "DEFAULT")
    .map(([permissionId, effect]) => ({ permissionId, effect }));
  await adminAuth.authFetch(`/admins/${overridesFor.value.id}/permissions`, { method: "PUT", body: { overrides } });
  overridesFor.value = null;
}

useSeoMeta({ title: "Admins & Roles" });
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="font-display text-2xl">Admins & Roles</h1>
      <button class="rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-paper" @click="showForm = !showForm">
        {{ showForm ? "Cancel" : "+ New Admin" }}
      </button>
    </div>

    <form v-if="showForm" class="mb-8 grid grid-cols-2 gap-4 rounded-xl border border-ink-950/10 p-6" @submit.prevent="submitCreate">
      <input v-model="form.email" type="email" placeholder="Email" required class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      <input v-model="form.password" type="password" placeholder="Temporary password" required minlength="8" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      <input v-model="form.firstName" placeholder="First name" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      <input v-model="form.lastName" placeholder="Last name" class="rounded-lg border border-ink-950/15 px-3 py-2 text-sm" />
      <select v-model="form.roleId" required class="col-span-2 rounded-lg border border-ink-950/15 px-3 py-2 text-sm">
        <option value="" disabled>Select role</option>
        <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
      </select>
      <p v-if="error" class="col-span-2 text-sm text-red-500">{{ error }}</p>
      <button type="submit" class="col-span-2 rounded-full bg-ink-950 py-2.5 text-sm font-semibold text-paper">Create Admin</button>
    </form>

    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-ink-950/10 text-left text-xs uppercase tracking-wide text-ink-950/40">
          <th class="py-2">Email</th>
          <th>Role</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="admin in admins" :key="admin.id" class="border-b border-ink-950/5">
          <td class="py-3 font-medium">{{ admin.email }}</td>
          <td>
            <select :value="admin.role.id" class="rounded-lg border border-ink-950/15 px-2 py-1 text-xs" @change="changeRole(admin, ($event.target as HTMLSelectElement).value)">
              <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </td>
          <td>
            <button class="underline" :class="admin.isActive ? 'text-green-600' : 'text-ink-950/40'" @click="toggleActive(admin)">
              {{ admin.isActive ? "Active" : "Disabled" }}
            </button>
          </td>
          <td class="space-x-3 text-right">
            <button class="text-ink-950/60 hover:text-ink-950" @click="openOverrides(admin)">Permissions</button>
            <button class="text-ink-950/60 hover:text-ink-950" @click="resetPassword(admin)">Reset Password</button>
            <button class="text-red-500 hover:text-red-700" @click="remove(admin)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="overridesFor" class="fixed inset-0 z-[90] flex items-center justify-center bg-ink-950/50 px-6">
      <div class="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-paper p-6">
        <h2 class="mb-1 font-display text-lg">Permission Overrides</h2>
        <p class="mb-4 text-sm text-ink-950/50">{{ overridesFor.email }} — overrides apply on top of the role's default permissions.</p>
        <div class="space-y-2">
          <div v-for="p in permissions" :key="p.id" class="flex items-center justify-between text-sm">
            <span>{{ p.resource }}:{{ p.action }}</span>
            <select v-model="overrideState[p.id]" class="rounded-lg border border-ink-950/15 px-2 py-1 text-xs">
              <option value="DEFAULT">Default</option>
              <option value="GRANT">Grant</option>
              <option value="REVOKE">Revoke</option>
            </select>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button class="rounded-full border border-ink-950/15 px-4 py-2 text-sm" @click="overridesFor = null">Cancel</button>
          <button class="rounded-full bg-ink-950 px-4 py-2 text-sm font-semibold text-paper" @click="saveOverrides">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>
