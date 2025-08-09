"use server";
import { freestyle } from "@/lib/freestyle";

export async function createRepo({
  name = "VibeRacer App",
  templateUrl = process.env.FREESTYLE_TEMPLATE_URL ||
    "https://github.com/freestyle-sh/freestyle-next",
}: {
  name?: string;
  templateUrl?: string;
} = {}): Promise<string> {
  const { repoId } = await freestyle.createGitRepository({
    name,
    public: true,
    source: {
      url: templateUrl,
      type: "git",
    },
  });
  return repoId;
}

