export interface ApiError extends Error {
  statusCode?: number;
}

/** Base $fetch instance for public, unauthenticated endpoints. Always sends
 * cookies so the guest cart token round-trips correctly. */
export function useApi() {
  const config = useRuntimeConfig();
  return $fetch.create({
    baseURL: `${config.public.apiBase}/api`,
    credentials: "include",
  });
}
