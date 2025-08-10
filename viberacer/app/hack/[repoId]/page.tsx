"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import FreestylePreview from "@/components/FreestylePreview";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useAISDKRuntime } from "@assistant-ui/react-ai-sdk";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";
import { useStackApp } from "@stackframe/stack";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect } from "react";



export default function CompeteWithRepo() {
  const stack = useStackApp();
  const { id: userId } = stack.useUser({ or: "redirect" });
  const params = useParams<{ repoId: string }>();
  const [username, setUsername] = useState("");
  const [open, setOpen] = useState(false);
  const repoId = params?.repoId ?? "";
  const createSubmission = useMutation(api.submissions.createSubmission);
  const timeData = useQuery(api.adminData.getAdminData);
  const contestState = useQuery(api.race.getCurrentContestState);
  const router = useRouter();

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat/' + repoId,
    }),
  });

  const handleSubmit = () => {
    setOpen(true);
  };

  const handleDialogSubmit = async () => {
    await createSubmission({ repoId, userId });
    setOpen(false);
  };

  const runtime = useAISDKRuntime(chat);

  // Auto-redirect when contest stage changes
  useEffect(() => {
    if (!contestState) return;
    
    // Only redirect if we're not in the in_progress stage
    if (contestState.stage !== "in_progress") {
      console.log("Contest stage changed to", contestState.stage, "- redirecting from hack page");
      router.push("/compete");
    }
  }, [contestState, router]);

  return (
    <div className="h-[calc(100vh-0px)] w-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={30} minSize={20} className="border-r">
          <AssistantRuntimeProvider runtime={runtime}>
            <div className="h-full flex flex-col">
              <div className="px-4 py-3 border-b flex justify-between items-center">
                {timeData ? (
                  <span className="text-xl font-mono text-black">
                    {Math.floor(timeData.timeToNext / 60)}:{String(Math.floor(timeData.timeToNext % 60)).padStart(2, '0')}
                  </span>
                ) : (
                  <span />
                )}
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-xs text-gray-500 border border-gray-500 p-2 rounded-md">
                      Contest&nbsp;Theme
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Create a modern and minimalist todo app with a dark theme.
                  </TooltipContent>
                </Tooltip>
                <Button onClick={handleSubmit}>Submit Project</Button>
              </div>
              <div className="flex-grow h-0">
                <Thread />
              </div>
            </div>
          </AssistantRuntimeProvider>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={70} minSize={40}>
          <FreestylePreview repoId={repoId} className="h-full w-full" />
        </ResizablePanel>
      </ResizablePanelGroup>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ready to submit?</DialogTitle>
            <DialogDescription>
              You can always re-submit later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDialogSubmit}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

