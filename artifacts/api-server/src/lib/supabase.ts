import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export class SupabaseConfigurationError extends Error {
  constructor() {
    super("Supabase server configuration is incomplete.");
    this.name = "SupabaseConfigurationError";
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new SupabaseConfigurationError();
  return value;
}

const authOptions = {
  autoRefreshToken: false,
  persistSession: false,
  detectSessionInUrl: false,
};

let publicClient: SupabaseClient<Database> | undefined;
let serviceClient: SupabaseClient<Database> | undefined;

export function getSupabaseUrl(): string {
  return requiredEnv("SUPABASE_URL");
}

export function getSupabasePublishableKey(): string {
  return requiredEnv("SUPABASE_PUBLISHABLE_KEY");
}

export function getSupabasePublicClient(): SupabaseClient<Database> {
  if (!publicClient) {
    publicClient = createClient<Database>(
      getSupabaseUrl(),
      getSupabasePublishableKey(),
      { auth: authOptions },
    );
  }
  return publicClient;
}

export function getSupabaseServiceClient(): SupabaseClient<Database> {
  if (!serviceClient) {
    serviceClient = createClient<Database>(
      getSupabaseUrl(),
      requiredEnv("SUPABASE_SECRET_KEY"),
      { auth: authOptions },
    );
  }
  return serviceClient;
}

export function createUserSupabaseClient(
  accessToken: string,
): SupabaseClient<Database> {
  return createClient<Database>(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      auth: authOptions,
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    },
  );
}
