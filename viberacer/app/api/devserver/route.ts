import { NextResponse } from "next/server";
import { freestyle } from "@/lib/freestyle";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const repoId = searchParams.get("repoId");

  if (!repoId) {
    return NextResponse.json({ error: "Missing repoId" }, { status: 400 });
  }

  try {
    const { ephemeralUrl, mcpEphemeralUrl } = await freestyle.requestDevServer({
      repoId,
    });
    return NextResponse.json({ ephemeralUrl, mcpEphemeralUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

