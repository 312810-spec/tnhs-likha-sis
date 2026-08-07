// ============================================================================
//  create-account  (Supabase Edge Function, Deno)
//  ICT Coordinator account provisioning for TNHS LIKHA-SIS.
//
//  SECURITY MODEL
//  --------------
//  * This function runs entirely on the server and uses the
//    SUPABASE_SERVICE_ROLE_KEY environment variable (never the client).
//  * It verifies that the CALLER is an authenticated ict_coordinator before
//    provisioning anyone, so no browser code ever calls the admin API and no
//    admin-level Supabase function is reachable from client-side code.
//  * The temporary password returned below is generated server-side and shown
//    to the coordinator exactly once so it can be handed to the new user.
// ============================================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

type AllowedRole = "teacher" | "master_teacher";

interface CreateAccountBody {
  email?: unknown;
  full_name?: unknown;
  role?: unknown;
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders, ...headers },
  });
}

Deno.serve(async (req) => {
  // CORS preflight.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!auth) {
      return json({ error: "Missing authorization header." }, 401);
    }

    // Service-role client (server-only). The key is supplied to the function
    // runtime via SUPABASE_SERVICE_ROLE_KEY — it never lives in a client file.
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1) Identify the caller from the Bearer JWT (server-side).
    const { data: caller, error: callerErr } = await admin.auth.getUser(auth);
    if (callerErr || !caller?.user) {
      return json({ error: "Unauthorized: invalid session." }, 401);
    }

    // 2) Only an ICT Coordinator may provision accounts.
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("role")
      .eq("id", caller.user.id)
      .single();
    if (profileErr || profile?.role !== "ict_coordinator") {
      return json(
        { error: "Forbidden: only the ICT Coordinator can create accounts." },
        403
      );
    }

    // 3) Validate the request payload.
    const body = (await req.json()) as CreateAccountBody;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
    const role = body.role as AllowedRole;

    if (!email || !fullName) {
      return json({ error: "email and full_name are required." }, 400);
    }
    if (role !== "teacher" && role !== "master_teacher") {
      return json({ error: "role must be either teacher or master_teacher." }, 400);
    }

    // 4) Provision the Auth user with a strong, single-use temporary password.
    //    (Service role can create users — this is intentionally server-side only.)
    const tempPassword = `${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}#aA1`;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
      app_metadata: { role },
    });
    if (createErr || !created.user) {
      return json({ error: createErr?.message ?? "Failed to create account." }, 400);
    }

    // 5) Insert the matching profile row. The service role bypasses RLS here by
    //    design (the ICT Coordinator already holds the ALL policy, and this path
    //    is guarded by the auth check above).
    const { error: insertErr } = await admin.from("profiles").insert({
      id: created.user.id,
      full_name: fullName,
      role,
      is_adviser: false,
    });
    if (insertErr) {
      // Roll back the auth user so no orphaned login is left behind.
      await admin.auth.admin.deleteUser(created.user.id);
      return json(
        { error: `Profile could not be created: ${insertErr.message}` },
        400
      );
    }

    return json({
      ok: true,
      email,
      full_name: fullName,
      role,
      password: tempPassword,
      message:
        "Account created. Share the temporary password with the new user exactly once.",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected server error.";
    return json({ error: message }, 500);
  }
});
