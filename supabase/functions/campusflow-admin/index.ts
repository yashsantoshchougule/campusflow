import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type" };
const reply = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers });
const recentlyAuthenticated = (authTime: unknown) => typeof authTime === "number" && Date.now() - authTime * 1000 <= 5 * 60 * 1000;

export default {
  fetch: withSupabase({ auth: "user" }, async (request, ctx) => {
    if (request.method === "OPTIONS") return new Response(null, { headers });
    const userId = String(ctx.userClaims?.sub ?? "");
    if (!userId) return reply({ error: "Authenticated user is required." }, 401);
    const body = await request.json().catch(() => null) as { action?: string; email?: string; teacherId?: string; subjectCode?: string; course?: string; department?: string; semester?: number; noteId?: string; confirmation?: string } | null;
    if (!body?.action) return reply({ error: "Action is required." }, 400);

    if (body.action === "delete_my_account") {
      if (body.confirmation !== "DELETE MY ACCOUNT" || !recentlyAuthenticated(ctx.jwtClaims?.auth_time)) return reply({ error: "Typed confirmation and a recent login are required." }, 401);
      const { error } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId);
      return error ? reply({ error: error.message }, 400) : reply({ deleted: true });
    }

    const { data: role, error: roleError } = await ctx.supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
    if (roleError) return reply({ error: roleError.message }, 400);
    if (role?.role !== "admin") return reply({ error: "Admin permission is required." }, 403);

    if (body.action === "invite_teacher") {
      if (!body.email) return reply({ error: "Teacher email is required." }, 400);
      const { data, error } = await ctx.supabaseAdmin.auth.admin.inviteUserByEmail(body.email);
      if (error || !data.user) return reply({ error: error?.message ?? "Could not invite teacher." }, 400);
      const { error: roleUpdateError } = await ctx.supabaseAdmin.from("user_roles").upsert({ user_id: data.user.id, role: "teacher" });
      return roleUpdateError ? reply({ error: roleUpdateError.message }, 400) : reply({ teacherId: data.user.id });
    }

    if (body.action === "assign_teacher_subject") {
      if (!body.teacherId || !body.subjectCode) return reply({ error: "Teacher and subject code are required." }, 400);
      const { error } = await ctx.supabaseAdmin.from("teacher_subjects").upsert({ teacher_id: body.teacherId, subject_code: body.subjectCode, course: body.course ?? null, department: body.department ?? null, semester: body.semester ?? null }, { onConflict: "teacher_id,subject_code,course,department,semester" });
      return error ? reply({ error: error.message }, 400) : reply({ assigned: true });
    }

    if (body.action === "delete_academic_note") {
      if (!body.noteId) return reply({ error: "Note ID is required." }, 400);
      const { data: note, error } = await ctx.supabaseAdmin.from("academic_notes").select("storage_bucket, storage_path").eq("id", body.noteId).maybeSingle();
      if (error || !note) return reply({ error: error?.message ?? "Academic note not found." }, 404);
      const { error: fileError } = await ctx.supabaseAdmin.storage.from(note.storage_bucket).remove([note.storage_path]);
      if (fileError) return reply({ error: fileError.message }, 400);
      const { error: deleteError } = await ctx.supabaseAdmin.from("academic_notes").delete().eq("id", body.noteId);
      return deleteError ? reply({ error: deleteError.message }, 400) : reply({ deleted: true });
    }

    return reply({ error: "Unsupported action." }, 400);
  }),
};
