// The Lantern Library "librarian": a Supabase Edge Function that lets the app ask Claude
// (genre lookup, recommendations, spine matching, finding the next book in a series).
// Your Anthropic API key stays here on the server and is never sent to the phone.
//
// Secrets to set in Supabase > Edge Functions > Secrets:
//   ANTHROPIC_API_KEY  your key from console.anthropic.com
//   OWNER_EMAIL        the email you sign in to the library with (only you can use the librarian)
// Optional: MODEL_QUICK and MODEL_DEFAULT to choose other Claude models.
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    const owner = (Deno.env.get("OWNER_EMAIL") ?? "").trim().toLowerCase();
    if (!user || !owner || (user.email ?? "").toLowerCase() !== owner) return json({ error: "not_granted" }, 403);

    const { prompt, tier } = await req.json();
    if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 60000) return json({ error: "bad_request" }, 400);
    const model = tier === "default"
      ? (Deno.env.get("MODEL_DEFAULT") ?? "claude-sonnet-5-5")
      : (Deno.env.get("MODEL_QUICK") ?? "claude-haiku-5-5");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({ model, max_tokens: 4000, messages: [{ role: "user", content: prompt }] }),
    });
    if (res.status === 429) return json({ error: "rate_limited" }, 429);
    const out = await res.json();
    if (!res.ok) return json({ error: "failed", detail: out?.error?.message ?? res.statusText }, 502);
    const text = (out.content ?? []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("");
    return json({ text });
  } catch (_e) {
    return json({ error: "failed" }, 500);
  }
});
