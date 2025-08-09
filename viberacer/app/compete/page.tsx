import { redirect } from "next/navigation";
import { createRepo } from "@/lib/create-repo";

export default async function CompetePage() {
  const repoId = await createRepo({ name: "VibeRacer App" });
  redirect(`/compete/${repoId}`);
}