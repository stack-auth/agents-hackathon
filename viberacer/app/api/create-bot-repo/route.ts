import { NextResponse } from "next/server";
import { freestyle } from "@/lib/freestyle";

export async function POST(req: Request) {
  try {
    const { contestId } = await req.json();
    
    // Create a new Freestyle repo for the bot
    // Using a simple template that creates a nice todo app
    const { repoId } = await freestyle.createGitRepository({
      name: `VibeBot Contest ${contestId}`,
      public: true,
      source: {
        // Use the default Freestyle Next.js template
        url: process.env.FREESTYLE_TEMPLATE_URL || "https://github.com/freestyle-sh/freestyle-next",
        type: "git",
      },
    });
    
    console.log(`Created bot repo ${repoId} for contest ${contestId}`);
    
    return NextResponse.json({ repoId });
  } catch (error) {
    console.error("Failed to create bot repo:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}