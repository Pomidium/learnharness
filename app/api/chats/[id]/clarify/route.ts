import { clarify } from "@/src/server";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
 const { id } = await ctx.params;
 const body = await req.json().catch(() => null);
 if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Invalid JSON body" }, { status: 400 });
 return clarify(id, body.toolCallId, body.text);
}
