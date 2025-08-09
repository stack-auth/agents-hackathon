"use server";

import { freestyle } from "@/lib/freestyle";

export async function requestDevServer({
  repoId,
}: {
  repoId: string;
}): Promise<{ ephemeralUrl: string; mcpEphemeralUrl?: string }> {
  const { ephemeralUrl, mcpEphemeralUrl } = await freestyle.requestDevServer({
    repoId,
  });

  return { ephemeralUrl, mcpEphemeralUrl };
}

