"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import FreestylePreview from "@/components/FreestylePreview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RatingState = Record<string, number | null>; // repoId -> rating or null

export default function JudgePage() {
  const params = useParams<{ repoId: string }>();
  const currentRepoId = params?.repoId ?? "";
  const [selectedRepoForRating, setSelectedRepoForRating] = useState<string | null>(null);
  const [tempRating, setTempRating] = useState<number>(0);

  const repoIds = useQuery(api.submissions.getRandomSubmissionsExcluding, {
    excludeRepoId: currentRepoId,
    limit: 4,
  });

  const [ratings, setRatings] = useState<RatingState>({});
  useEffect(() => {
    if (repoIds && repoIds.length > 0) {
      const init: RatingState = {};
      for (const id of repoIds) init[id] = null;
      setRatings(init);
    }
  }, [repoIds?.join(",")]);

  const createReview = useMutation(api.submissions.createSubmissionReview);

  const allCompleted = useMemo(() => {
    const vals = Object.values(ratings);
    return vals.length === 4 && vals.every((v) => typeof v === "number" && v > 0);
  }, [ratings]);

  const handleOpenDialog = (repoId: string) => {
    setSelectedRepoForRating(repoId);
    setTempRating(ratings[repoId] ?? 0);
  };

  const handleSubmitRating = async () => {
    if (!selectedRepoForRating || tempRating < 1 || tempRating > 5) return;
    await createReview({ repoId: selectedRepoForRating, rating: tempRating });
    setRatings((prev) => ({ ...prev, [selectedRepoForRating]: tempRating }));
    setSelectedRepoForRating(null);
  };

  if (!repoIds) return <div className="p-6">Loading…</div>;

  return (
    <div className="p-2 space-y-4">
      <div className="text-sm text-zinc-600 text-center">
        {allCompleted
          ? "All reviews completed!"
          : "Please review these 4 projects to complete your submission"}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {repoIds.map((rid) => {
          const isRated = typeof ratings[rid] === "number" && (ratings[rid] ?? 0) > 0;
          return (
            <div key={rid} className="relative h-[360px] border rounded-md overflow-hidden">
              <div className="absolute top-2 right-2 z-10">
                <Button className="border border-white" size="sm" onClick={() => handleOpenDialog(rid)} disabled={isRated}>
                  {isRated ? "Rated" : "Rate"}
                </Button>
              </div>
              <FreestylePreview repoId={rid} className="h-full w-full" />
            </div>
          );
        })}
      </div>

      <Dialog open={!!selectedRepoForRating} onOpenChange={(o) => !o && setSelectedRepoForRating(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate this project</DialogTitle>
            <DialogDescription>Select a rating from 1 to 5 stars.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setTempRating(n)}
                className={
                  "text-2xl " + (n <= tempRating ? "text-yellow-500" : "text-zinc-400")
                }
                aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
              >
                ★
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedRepoForRating(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRating} disabled={tempRating < 1}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
