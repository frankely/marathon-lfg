import "server-only";

type D1Database = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      run: () => Promise<unknown>;
      all: <T = unknown>() => Promise<{ results: T[] }>;
      first: <T = unknown>() => Promise<T | null>;
    };
    run: () => Promise<unknown>;
    all: <T = unknown>() => Promise<{ results: T[] }>;
    first: <T = unknown>() => Promise<T | null>;
  };
};

type CloudflareEnv = {
  DB?: D1Database;
};

let cachedEnv: CloudflareEnv | null = null;

export async function getCloudflareEnv(): Promise<CloudflareEnv> {
  if (cachedEnv) return cachedEnv;
  try {
    const mod = await import("@opennextjs/cloudflare");
    const ctx = await mod.getCloudflareContext({ async: true });
    cachedEnv = (ctx?.env ?? {}) as CloudflareEnv;
  } catch {
    cachedEnv = {};
  }
  return cachedEnv;
}

export async function getDB(): Promise<D1Database | null> {
  const env = await getCloudflareEnv();
  return env.DB ?? null;
}
