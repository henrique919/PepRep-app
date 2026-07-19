import { createClient } from "npm:@supabase/supabase-js@2.110.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ ok: false, message: "Method not allowed." }, 405);

  const authorization = request.headers.get("Authorization");
  if (authorization === null || !authorization.startsWith("Bearer ")) {
    return json({ ok: false, message: "Authentication required." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (supabaseUrl === undefined || anonKey === undefined || serviceRoleKey === undefined) {
    return json({ ok: false, message: "Server configuration is incomplete." }, 500);
  }

  const token = authorization.slice("Bearer ".length);
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(token);
  if (userError !== null || user === null) {
    return json({ ok: false, message: "Authentication required." }, 401);
  }

  let body: { confirm?: boolean } = {};
  try {
    body = (await request.json()) as { confirm?: boolean };
  } catch {
    return json({ ok: false, message: "A confirmation body is required." }, 400);
  }
  if (body.confirm !== true) {
    return json({ ok: false, message: "Account deletion was not confirmed." }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: manifests, error: manifestError } = await admin
    .from("peprep_backup_manifests")
    .select("object_path")
    .eq("user_id", user.id);
  if (manifestError !== null) {
    return json({ ok: false, message: "Could not enumerate cloud backups." }, 500);
  }

  const objectPaths = new Set(
    (manifests ?? [])
      .map((row) => row.object_path)
      .filter((path): path is string => typeof path === "string" && path.startsWith(`${user.id}/`)),
  );

  // Also enumerate the private user folder so a file cannot be orphaned if a
  // prior upload succeeded but its manifest insert/cleanup did not.
  const pageSize = 100;
  for (let offset = 0; offset < 10_000; offset += pageSize) {
    const { data: objects, error: listError } = await admin.storage
      .from("peprep-encrypted-backups")
      .list(user.id, { limit: pageSize, offset, sortBy: { column: "name", order: "asc" } });
    if (listError !== null) {
      return json({ ok: false, message: "Could not enumerate cloud backup files." }, 500);
    }
    for (const object of objects ?? []) {
      if (object.id !== null) objectPaths.add(`${user.id}/${object.name}`);
    }
    if ((objects ?? []).length < pageSize) break;
  }

  const paths = [...objectPaths];
  for (let offset = 0; offset < paths.length; offset += pageSize) {
    const { error: storageError } = await admin.storage
      .from("peprep-encrypted-backups")
      .remove(paths.slice(offset, offset + pageSize));
    if (storageError !== null) {
      return json({ ok: false, message: "Could not remove all cloud backup files." }, 500);
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError !== null) {
    return json({ ok: false, message: "Could not delete the cloud account." }, 500);
  }

  return json({ ok: true }, 200);
});
